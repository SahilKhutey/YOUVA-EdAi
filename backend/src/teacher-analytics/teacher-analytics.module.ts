import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [TeacherAnalyticsController],
    providers: [TeacherAnalyticsService],
})
export class TeacherAnalyticsModule { }
