import { Module } from '@nestjs/common';
import { PilotEvidenceController } from './pilot-evidence.controller';
import { PilotEvidenceService } from './pilot-evidence.service';
import { PilotDataQualityService } from './pilot-data-quality.service';

@Module({
  controllers: [PilotEvidenceController],
  providers: [PilotEvidenceService, PilotDataQualityService],
  exports: [PilotEvidenceService, PilotDataQualityService],
})
export class PilotModule {}
