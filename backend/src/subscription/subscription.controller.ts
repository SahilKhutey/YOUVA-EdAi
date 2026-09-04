import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Request() req: any, @Body('plan') plan: string) {
    return this.subscriptionService.createCheckoutSession(
      req.user.userId,
      plan,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    // Note: To receive the raw body (req.rawBody), nest app must be configured with `rawBody: true`
    // If rawBody is not available, we use req.body as a fallback (which works for our dummy test logic)
    const payload = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.subscriptionService.handleStripeWebhook(
      signature,
      payload as Buffer,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Request() req: any) {
    return this.subscriptionService.getSubscription(req.user.userId);
  }
}
