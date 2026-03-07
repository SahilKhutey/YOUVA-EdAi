import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.announcement.findMany({
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: 20,
            include: {
                author: { select: { id: true, name: true } },
            },
        });
    }

    async create(
        authorId: string,
        title: string,
        body: string,
        isPinned: boolean,
    ) {
        return this.prisma.announcement.create({
            data: { authorId, title, body, isPinned },
            include: { author: { select: { id: true, name: true } } },
        });
    }

    async remove(id: string) {
        return this.prisma.announcement.delete({ where: { id } });
    }
}
