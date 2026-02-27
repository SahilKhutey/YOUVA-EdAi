import { Module } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { RevisionController } from './revision.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [RevisionService],
  controllers: [RevisionController],
})
export class RevisionModule {}
