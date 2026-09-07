import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CommercialService } from './commercial.service';
import { OnboardingService } from './onboarding.service';
import { ProductEventService } from './product-event.service';
import { SupportService } from './support.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { SubmitProductFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sub: string;
    userId?: string;
    role?: string;
    email?: string;
  };
}

@Controller(['v1/commercial', 'commercial'])
export class CommercialController {
  constructor(
    private readonly commercialService: CommercialService,
    private readonly billingService: BillingService,
    private readonly onboardingService: OnboardingService,
    private readonly productEventService: ProductEventService,
    private readonly supportService: SupportService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.commercialService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('entitlements')
  async getEntitlements(
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.commercialService.getEntitlements(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboarding/complete')
  async completeOnboarding(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CompleteOnboardingDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.onboardingService.complete(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('billing/checkout')
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CheckoutDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.billingService.createCheckoutSession(
      userId,
      dto.plan as any,
    );
  }

  @Post('billing/webhook')
  async webhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.processWebhook(
      req.body as Buffer,
      signature,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('events')
  async track(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      eventName: string;
      properties?: Record<string, unknown>;
      sessionId?: string;
    },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.productEventService.track({
      userId,
      eventName: body.eventName,
      properties: body.properties,
      sessionId: body.sessionId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('support/tickets')
  async createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSupportTicketDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.supportService.createTicket(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('support/tickets')
  async getMyTickets(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub || req.user.id;
    return this.supportService.getUserTickets(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('feedback')
  async submitFeedback(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitProductFeedbackDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.supportService.submitFeedback(userId, dto);
  }
}
