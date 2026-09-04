import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Minimalist payload schema for 2G/3G text-only connections
interface SyncPayload {
    userId: string;
    localTimestamp: string;
    offlineEvents: Array<{
        type: string;
        data: any;
    }>;
}

@Injectable()
export class EdgeSyncService {
    private readonly logger = new Logger(EdgeSyncService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Receives compressed, batched telemetry from a local edge node
     * when the student regains internet connection.
     */
    async processIntercalatedSync(compressedPayload: string) {
        try {
            // In a real scenario, this payload could be gzip or base64 decoded
            let parsed;
            try {
                parsed = JSON.parse(compressedPayload);
            } catch {
                // Mocking decompression layer
                const decoded = Buffer.from(compressedPayload, 'base64').toString('utf-8');
                parsed = JSON.parse(decoded);
            }

            const validatedData = parsed as SyncPayload;

            if (!validatedData.userId || !validatedData.offlineEvents) {
                throw new Error("Invalid Edge Sync Payload Structure");
            }

            let ingestedCount = 0;
            // Iterate and flush local caching into massive cloud DB
            for (const event of validatedData.offlineEvents) {
                switch (event.type) {
                    case 'STUDY_SESSION_COMPLETE':
                        // Recreate the session log
                        await this.prisma.learningSession.create({
                            data: {
                                userId: validatedData.userId,
                                topicId: event.data.topicId,
                                startTime: new Date(validatedData.localTimestamp),
                                endTime: new Date(validatedData.localTimestamp),
                                logs: `[OFFLINE_SYNC] Transferred via Edge: ${JSON.stringify(event.data)}`
                            }
                        });
                        ingestedCount++;
                        break;
                    case 'COGNITIVE_STATE_UPDATE':
                        await this.prisma.cognitiveStateLog.create({
                            data: {
                                userId: validatedData.userId,
                                cognitiveLoad: event.data.cognitiveLoad || 0.5,
                                stepComplexity: event.data.stepComplexity || 0.5,
                                retrievalStrength: event.data.retrievalStrength || 0.5,
                                attentionSwitching: event.data.attentionSwitching || 0.5,
                                impulseControl: event.data.impulseControl || 0.5,
                                errorClusterScore: event.data.errorClusterScore || 0.0,
                                inferredState: event.data.inferredState || 'offline_sync',
                                timestamp: new Date(validatedData.localTimestamp),
                            }
                        });
                        ingestedCount++;
                        break;
                    default:
                        this.logger.warn(`Unknown edge event type ${event.type}`);
                }
            }

            this.logger.log(`Successfully ingested ${ingestedCount} offline events from edge node for User ${validatedData.userId}`);

            return {
                status: 'SYNC_COMPLETE',
                eventsProcessed: ingestedCount,
                nextSyncIntervalMs: 86400000 // 24 hours
            };

        } catch (error) {
            this.logger.error('Edge sync payload rejected', error);
            throw new Error('Failed to parse or validate Edge Sync Payload.');
        }
    }

    /**
     * Downloads an offline curriculum pack for the specified region
     * This data is highly compressed to work over 3G satellite links.
     */
    async downloadCurriculumPack(topicId: string) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            include: { questions: true }
        });

        // E.g., strip heavy markdown, images, or metadata to build a "low bandwidth" pack
        const compressedPack = {
            topicName: topic?.title,
            mcqs: topic?.questions.map(q => ({
                text: q.content,
                ops: q.options,
                ans: q.correctAnswer
            }))
        };

        const payloadString = JSON.stringify(compressedPack);

        return {
            payloadSize: payloadString.length,
            // Returning as base64 to simulate compressed packet
            data: Buffer.from(payloadString).toString('base64')
        };
    }
}
