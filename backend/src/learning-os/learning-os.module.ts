import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DigitalTwinController } from './digital-twin/digital-twin.controller';
import { DigitalTwinService } from './digital-twin/digital-twin.service';

import { ImprovementController } from './improvement/improvement.controller';
import { ImprovementService } from './improvement/improvement.service';

import { OutcomeController } from './outcomes/outcome.controller';
import { OutcomeService } from './outcomes/outcome.service';

import { ReleaseController } from './release/release.controller';
import { ReleaseService } from './release/release.service';

import { PolicyController } from './policy/policy.controller';
import { PolicyService } from './policy/policy.service';

import { ResearchController } from './research/research.controller';
import { ResearchService } from './research/research.service';

import { ReliabilityController } from './reliability/reliability.controller';
import { ReliabilityService } from './reliability/reliability.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    DigitalTwinController,
    ImprovementController,
    OutcomeController,
    ReleaseController,
    PolicyController,
    ResearchController,
    ReliabilityController,
  ],
  providers: [
    DigitalTwinService,
    ImprovementService,
    OutcomeService,
    ReleaseService,
    PolicyService,
    ResearchService,
    ReliabilityService,
  ],
  exports: [
    DigitalTwinService,
    ImprovementService,
    OutcomeService,
    ReleaseService,
    PolicyService,
    ResearchService,
    ReliabilityService,
  ],
})
export class LearningOSModule {}
