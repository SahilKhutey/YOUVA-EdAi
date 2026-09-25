import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScenarioComparisonService } from './comparison/scenario-comparison.service';
import { ScenarioController } from './controllers/scenario.controller';
import { TwinSnapshotController } from './controllers/twin-snapshot.controller';
import { SimulationPolicy } from './policies/simulation-policy';
import { ScenarioService } from './scenarios/scenario.service';
import { SimulationEngineService } from './simulation/simulation-engine.service';
import { SnapshotService } from './snapshots/snapshot.service';

@Module({
  imports: [PrismaModule],
  controllers: [TwinSnapshotController, ScenarioController],
  providers: [
    SimulationPolicy,
    SnapshotService,
    SimulationEngineService,
    ScenarioService,
    ScenarioComparisonService,
  ],
  exports: [
    SimulationPolicy,
    SnapshotService,
    SimulationEngineService,
    ScenarioService,
    ScenarioComparisonService,
  ],
})
export class LearningDigitalTwinModule {}
