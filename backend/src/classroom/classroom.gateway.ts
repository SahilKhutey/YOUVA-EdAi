import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { authenticateSocket } from '../security/socket-auth';
import { allowedOrigins } from '../security/http-config';

/**
 * Live 1-on-1 classroom: whiteboard, lesson steps and video-call signalling.
 * A connection must carry a valid login token, and a client can only join, send to, or hear from a session
 * that it is a participant of (the session's teacher, its student, or an admin).
 */
@WebSocketGateway({ cors: { origin: allowedOrigins(), credentials: true } })
export class ClassroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private prisma: PrismaService, private jwt: JwtService) { }

    handleConnection(client: Socket) {
        const user = authenticateSocket(client, this.jwt);
        if (!user) {
            client.emit('error', { message: 'unauthorized' });
            client.disconnect(true);
            return;
        }
        client.data.user = user;
        client.data.roles = {} as Record<string, 'teacher' | 'student' | 'admin'>;
    }

    handleDisconnect(_client: Socket) { /* nothing to clean up: rooms are left automatically */ }

    /** True when this client has joined the session as an authorised participant. */
    private role(client: Socket, sessionId: unknown): 'teacher' | 'student' | 'admin' | undefined {
        return typeof sessionId === 'string' ? client.data?.roles?.[sessionId] : undefined;
    }

    @SubscribeMessage('join-room')
    async handleJoinRoom(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        const user = client.data?.user;
        if (!user || typeof data?.sessionId !== 'string') return { status: 'denied' };
        const session = await this.prisma.digitalClassroomSession.findUnique({ where: { id: data.sessionId } });
        if (!session) return { status: 'denied' };
        const role = session.teacherId === user.id ? 'teacher' : session.studentId === user.id ? 'student' : user.role === 'ADMIN' ? 'admin' : undefined;
        if (!role) return { status: 'denied' };
        client.join(session.id);
        client.data.roles[session.id] = role;
        client.to(session.id).emit('user-joined', { userId: client.id });
        return { status: 'joined', role };
    }

    @SubscribeMessage('draw')
    handleDraw(@MessageBody() data: { sessionId: string; drawData: any }, @ConnectedSocket() client: Socket) {
        if (!this.role(client, data?.sessionId)) return;
        client.to(data.sessionId).emit('draw', data.drawData);
    }

    @SubscribeMessage('clear-board')
    handleClearBoard(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        if (!this.role(client, data?.sessionId)) return;
        client.to(data.sessionId).emit('clear-board');
    }

    @SubscribeMessage('change-step')
    async handleChangeStep(@MessageBody() data: { sessionId: string, stepIndex: number }, @ConnectedSocket() client: Socket) {
        const role = this.role(client, data?.sessionId);
        if (role !== 'teacher' && role !== 'admin') return; // only the teacher moves the lesson on
        if (!Number.isInteger(data.stepIndex) || data.stepIndex < 0) return;
        client.to(data.sessionId).emit('change-step', data.stepIndex);
        try {
            await this.prisma.digitalClassroomSession.update({
                where: { id: data.sessionId },
                data: { currentStep: data.stepIndex }
            });
        } catch (e) {
            console.error('Failed to update session step', e);
        }
    }

    // WebRTC signalling: forwarded only inside a session the sender has joined
    @SubscribeMessage('offer')
    handleOffer(@MessageBody() data: { sessionId: string, offer: any }, @ConnectedSocket() client: Socket) {
        if (!this.role(client, data?.sessionId)) return;
        client.to(data.sessionId).emit('offer', data.offer);
    }

    @SubscribeMessage('answer')
    handleAnswer(@MessageBody() data: { sessionId: string, answer: any }, @ConnectedSocket() client: Socket) {
        if (!this.role(client, data?.sessionId)) return;
        client.to(data.sessionId).emit('answer', data.answer);
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(@MessageBody() data: { sessionId: string, candidate: any }, @ConnectedSocket() client: Socket) {
        if (!this.role(client, data?.sessionId)) return;
        client.to(data.sessionId).emit('ice-candidate', data.candidate);
    }
}
