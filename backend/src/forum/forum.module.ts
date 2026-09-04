import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
    imports: [PrismaModule, GamificationModule],
    controllers: [ForumController],
    providers: [ForumService],
})
export class ForumModule { }
