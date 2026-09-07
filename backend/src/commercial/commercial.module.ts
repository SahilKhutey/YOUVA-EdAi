import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommercialController } from './commercial.controller';
import { CommercialService } from './commercial.service';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { OnboardingService } from './onboarding.service';
import { ProductEventService } from './product-event.service';
import { SupportService } from './support.service';
import { EntitlementGuard } from './guards/entitlement.guard';

@Module({
  imports: [PrismaModule],
  controllers: [CommercialController],
  providers: [
    CommercialService,
    BillingService,
    EntitlementService,
    OnboardingService,
    ProductEventService,
    SupportService,
    EntitlementGuard,
  ],
  exports: [
    CommercialService,
    BillingService,
    EntitlementService,
    EntitlementGuard,
    ProductEventService,
    SupportService,
  ],
})
export class CommercialModule {}
