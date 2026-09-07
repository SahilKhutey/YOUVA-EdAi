import { Controller, Get, Param } from '@nestjs/common';
import { CredentialPublicVerificationService } from './services/credential-public-verification.service';

@Controller(['api/v1/public/credentials', 'v1/public/credentials', 'public/credentials'])
export class PublicCredentialController {
  constructor(
    private readonly verificationService: CredentialPublicVerificationService,
  ) {}

  /**
   * Public verification endpoint.
   * Invariant: Does not require learner authentication.
   * Returns only sanitized public claims without exposing learner PII.
   */
  @Get('verify/:token')
  async verify(@Param('token') token: string) {
    return this.verificationService.verify(token);
  }
}
