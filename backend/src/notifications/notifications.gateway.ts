import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService, AppNotification } from './notifications.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    // userId → Set of socket IDs
    private userSockets = new Map<string, Set<string>>();
    // socketId → userId
    private socketUser = new Map<string, string>();

    constructor(
        private jwtService: JwtService,
        private notificationsService: NotificationsService,
    ) { }

    afterInit() {
        // Wire the service so it can push to live sockets
        this.notificationsService.setSender(
            (userId: string, n: AppNotification) => {
                const sockets = this.userSockets.get(userId);
                if (sockets) {
                    sockets.forEach((sid) =>
                        this.server.to(sid).emit('notification', n),
                    );
                }
            },
        );
        this.logger.log('NotificationsGateway initialised');
    }

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth?.token as string) ??
                (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

            if (!token) throw new Error('No token');

            const payload = this.jwtService.verify(token) as { sub: string };
            const userId = payload.sub;

            // Register socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);
            this.socketUser.set(client.id, userId);

            // Drain queued notifications
            const queued = this.notificationsService.drain(userId);
            queued.forEach((n) => client.emit('notification', n));

            this.logger.log(`User ${userId} connected (socket ${client.id})`);
        } catch {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.socketUser.get(client.id);
        if (userId) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
            }
            this.socketUser.delete(client.id);
            this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
        }
    }

    /** Emit a notification to ALL connected clients (e.g. new announcement). */
    broadcastAll(notification: Omit<AppNotification, 'userId'>) {
        this.server.emit('notification', notification);
    }
}
