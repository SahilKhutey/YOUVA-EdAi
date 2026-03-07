import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; hasPassword?: boolean; password?: string; cognitiveLevel?: string; gradeLevel?: string },
  ) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.cognitiveLevel) updateData.cognitiveLevel = data.cognitiveLevel;
    if (data.gradeLevel !== undefined) updateData.gradeLevel = data.gradeLevel;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, cognitiveLevel: true, gradeLevel: true },
    });
  }
}
