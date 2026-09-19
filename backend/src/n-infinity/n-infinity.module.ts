import { Module } from '@nestjs/common';
import { CivilizationOperatingSystemService } from './civilization-operating-system.service';
import { EvidenceLedgerNegativeRegistryService } from './evidence-ledger-negative-registry.service';
import { GovernanceKillswitchIncidentService } from './governance-killswitch-incident.service';
import { NInfinityController } from './n-infinity.controller';

@Module({
  controllers: [NInfinityController],
  providers: [
    CivilizationOperatingSystemService,
    EvidenceLedgerNegativeRegistryService,
    GovernanceKillswitchIncidentService,
  ],
  exports: [
    CivilizationOperatingSystemService,
    EvidenceLedgerNegativeRegistryService,
    GovernanceKillswitchIncidentService,
  ],
})
export class NInfinityModule {}
