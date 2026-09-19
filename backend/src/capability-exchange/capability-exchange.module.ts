import { Module } from '@nestjs/common';
import { CapabilityAlignmentService } from './capability-alignment.service';
import { CapabilityPassportService } from './capability-passport.service';
import { OpportunityNetworkService } from './opportunity-network.service';
import { OpportunityTrustExchangeService } from './opportunity-trust-exchange.service';
import { CapabilityExchangeController } from './capability-exchange.controller';

@Module({
  controllers: [CapabilityExchangeController],
  providers: [
    CapabilityAlignmentService,
    CapabilityPassportService,
    OpportunityNetworkService,
    OpportunityTrustExchangeService,
  ],
  exports: [
    CapabilityAlignmentService,
    CapabilityPassportService,
    OpportunityNetworkService,
    OpportunityTrustExchangeService,
  ],
})
export class CapabilityExchangeModule {}
