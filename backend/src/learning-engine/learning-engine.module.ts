import { Module } from '@nestjs/common';
import { BktService } from './services/bkt.service';
import { RlDifficultyService } from './services/rl-difficulty.service';

@Module({
  providers: [BktService, RlDifficultyService],
})
export class LearningEngineModule {}
