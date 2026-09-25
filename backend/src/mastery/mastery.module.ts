import { Module } from '@nestjs/common';
import { MasteryEvaluatorService } from './mastery-evaluator.service';

@Module({
  providers: [MasteryEvaluatorService],
  exports: [MasteryEvaluatorService],
})
export class MasteryModule {}
