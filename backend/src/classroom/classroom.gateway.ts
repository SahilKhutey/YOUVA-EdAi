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
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ClassroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private prisma: PrismaService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-room')
    async handleJoinRoom(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        client.join(data.sessionId);
        console.log(`Client ${client.id} joined room ${data.sessionId}`);
        client.to(data.sessionId).emit('user-joined', { userId: client.id });
    }

    @SubscribeMessage('draw')
    handleDraw(@MessageBody() data: { sessionId: string; drawData: any }, @ConnectedSocket() client: Socket) {
        client.to(data.sessionId).emit('draw', data.drawData);
    }

    @SubscribeMessage('clear-board')
    handleClearBoard(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        client.to(data.sessionId).emit('clear-board');
    }

    @SubscribeMessage('change-step')
    async handleChangeStep(@MessageBody() data: { sessionId: string, stepIndex: number }, @ConnectedSocket() client: Socket) {
        // Broadcast the step change
        client.to(data.sessionId).emit('change-step', data.stepIndex);
        // Persist the state
        try {
            await this.prisma.digitalClassroomSession.update({
                where: { id: data.sessionId },
                data: { currentStep: data.stepIndex }
            });
        } catch (e) {
            console.error('Failed to update session step', e);
        }
    }

    // WebRTC Signaling
    @SubscribeMessage('offer')
    handleOffer(@MessageBody() data: { sessionId: string, offer: any }, @ConnectedSocket() client: Socket) {
        client.to(data.sessionId).emit('offer', data.offer);
    }

    @SubscribeMessage('answer')
    handleAnswer(@MessageBody() data: { sessionId: string, answer: any }, @ConnectedSocket() client: Socket) {
        client.to(data.sessionId).emit('answer', data.answer);
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(@MessageBody() data: { sessionId: string, candidate: any }, @ConnectedSocket() client: Socket) {
        client.to(data.sessionId).emit('ice-candidate', data.candidate);
    }
}
