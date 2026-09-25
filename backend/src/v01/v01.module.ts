import { Module } from '@nestjs/common';
import { V01Controller } from './v01.controller';
import { V01Service } from './v01.service';
import { V01AdaptiveService } from './v01-adaptive.service';
import { V01TaskLoggerService } from './v01-task-logger.service';

@Module({
  controllers: [V01Controller],
  providers: [V01Service, V01AdaptiveService, V01TaskLoggerService],
  exports: [V01Service, V01AdaptiveService, V01TaskLoggerService],
})
export class V01Module {}
