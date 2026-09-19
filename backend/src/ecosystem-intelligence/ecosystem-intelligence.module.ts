import { Module } from '@nestjs/common';
import { EcosystemGraphService } from './ecosystem-graph.service';
import { PartnerGatewayService } from './partner-gateway.service';
import { EcosystemEventBusService } from './ecosystem-event-bus.service';
import { CurriculumIntelligenceService } from './curriculum-intelligence.service';
import { FederatedAnalyticsService } from './federated-analytics.service';
import { EcosystemIntelligenceController } from './ecosystem-intelligence.controller';

@Module({
  controllers: [EcosystemIntelligenceController],
  providers: [
    EcosystemGraphService,
    PartnerGatewayService,
    EcosystemEventBusService,
    CurriculumIntelligenceService,
    FederatedAnalyticsService,
  ],
  exports: [
    EcosystemGraphService,
    PartnerGatewayService,
    EcosystemEventBusService,
    CurriculumIntelligenceService,
    FederatedAnalyticsService,
  ],
})
export class EcosystemIntelligenceModule {}
