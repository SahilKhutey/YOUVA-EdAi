import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.studySession.findMany({
            where: { userId },
            include: { topic: { select: { title: true, subject: { select: { name: true } } } } },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    async create(
        userId: string,
        topicId: string | null,
        title: string,
        scheduledAt: Date,
        durationMinutes: number,
        notes?: string,
    ) {
        return this.prisma.studySession.create({
            data: { userId, topicId, title, scheduledAt, durationMinutes, notes },
            include: { topic: { select: { title: true, subject: { select: { name: true } } } } },
        });
    }

    async complete(id: string, userId: string) {
        return this.prisma.studySession.updateMany({
            where: { id, userId },
            data: { isCompleted: true },
        });
    }

    async remove(id: string, userId: string) {
        return this.prisma.studySession.deleteMany({
            where: { id, userId },
        });
    }
}
