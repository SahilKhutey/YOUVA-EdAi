import { Controller, Get, Param } from '@nestjs/common';
import { PublicVerificationService } from './public-verification.service';
import { PublicVerificationResponse } from './credential-types';

@Controller(['api/v1/public/verify', 'v1/public/verify', 'public/verify'])
export class PublicVerifyController {
  constructor(private readonly verificationService: PublicVerificationService) {}

  /**
   * Public unauthenticated verification endpoint.
   * Invariant: Requires no authentication token.
   * Returns cryptographically verified credential status without learner PII.
   */
  @Get(':credentialId')
  verifyCredential(@Param('credentialId') credentialId: string): PublicVerificationResponse {
    return this.verificationService.verifyCredential(credentialId);
  }
}
