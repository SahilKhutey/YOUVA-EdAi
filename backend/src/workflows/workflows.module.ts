import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowsController } from './workflows.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowsController],
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService],
})
export class WorkflowsModule {}
