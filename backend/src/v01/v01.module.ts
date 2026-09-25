import { Module } from '@nestjs/common';
import { V01Controller } from './v01.controller';
import { V01Service } from './v01.service';
import { V01AdaptiveService } from './v01-adaptive.service';

@Module({
  controllers: [V01Controller],
  providers: [V01Service, V01AdaptiveService],
  exports: [V01Service, V01AdaptiveService],
})
export class V01Module {}
