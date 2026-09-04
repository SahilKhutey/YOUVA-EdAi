import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        topics: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
