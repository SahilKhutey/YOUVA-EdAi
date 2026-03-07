import { Module } from '@nestjs/common';
import { ContentGenController } from './content-gen.controller';
import { PromptOrchestratorService } from './services/prompt-orchestrator/prompt-orchestrator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AgeiModule } from '../agei/agei.module';

@Module({
  imports: [PrismaModule, AiModule, AgeiModule],
  controllers: [ContentGenController],
  providers: [PromptOrchestratorService],
  exports: [PromptOrchestratorService]
})
export class ContentGenModule { }
