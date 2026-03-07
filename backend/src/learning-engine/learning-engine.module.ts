import { Module } from '@nestjs/common';
import { BktService } from './services/bkt.service';
import { RlDifficultyService } from './services/rl-difficulty.service';
import { NeuralCognitiveService } from './services/neural-cognitive.service';
import { NeuralCognitiveController } from './neural-cognitive.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NeuralCognitiveController],
  providers: [BktService, RlDifficultyService, NeuralCognitiveService],
  exports: [BktService, RlDifficultyService, NeuralCognitiveService],
})
export class LearningEngineModule { }
