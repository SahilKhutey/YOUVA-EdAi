import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticateSocket } from '../security/socket-auth';
import { corsOrigins } from '../security/http-config';

/**
 * Shared whiteboard. OFF unless ENABLE_SHARED_BOARD=true, because the frontend uses one hardcoded room
 * ("default-room") for every user, which would put unrelated students in the same room. When enabled,
 * a valid login token is required.
 */
@WebSocketGateway({
  cors: { origin: corsOrigins(process.env.CORS_ORIGINS), credentials: true },
  namespace: 'board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('BoardGateway');
  private activeUsers: Map<string, any> = new Map();

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const enabled = (process.env.ENABLE_SHARED_BOARD ?? 'false').toLowerCase() === 'true';
    const user = enabled ? authenticateSocket(client, this.jwt) : null;
    if (!user) {
      client.emit('error', { message: enabled ? 'unauthorized' : 'shared board is turned off' });
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeUsers.delete(client.id);
    if (client.data?.user) this.server.emit('user-left', { id: client.id });
  }

  @SubscribeMessage('join-board')
  handleJoinBoard(
    @MessageBody() data: { boardId: string; user: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.boardId);
    this.activeUsers.set(client.id, { ...data.user, id: client.id });

    // Broadcast to others in the room
    client.to(data.boardId).emit('user-joined', {
      id: client.id,
      ...data.user,
    });

    // Return list of current users to the joiner
    const roomUsers = Array.from(this.activeUsers.values()).filter(
      (u) => u.boardId === data.boardId,
    ); // simple filter if we stored boardId
    // For now, simpler: just emit to everyone
    return { status: 'joined', users: roomUsers };
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @MessageBody() data: { boardId: string; x: number; y: number },
    @ConnectedSocket() client: Socket,
  ) {
    // Throttle/Batching could happen here if not frontend
    // Forward to others
    client.to(data.boardId).emit('cursor-update', {
      id: client.id,
      x: data.x,
      y: data.y,
    });
  }

  @SubscribeMessage('draw-stroke')
  handleDrawStroke(
    @MessageBody() data: { boardId: string; stroke: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.boardId).emit('stroke-added', {
      id: client.id, // who drew it
      stroke: data.stroke,
    });
  }

  @SubscribeMessage('text-added')
  handleTextAdded(
    @MessageBody() data: { boardId: string; text: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.boardId).emit('text-added', {
      id: client.id,
      text: data.text,
    });
  }

  @SubscribeMessage('text-update')
  handleTextUpdate(
    @MessageBody() data: { boardId: string; id: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.boardId).emit('text-updated', {
      id: data.id,
      text: data.text,
    });
  }

  @SubscribeMessage('viewport-change')
  handleViewportChange(
    @MessageBody()
    data: { boardId: string; x: number; y: number; scale: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.boardId).emit('viewport-change', {
      x: data.x,
      y: data.y,
      scale: data.scale,
    });
  }
}
