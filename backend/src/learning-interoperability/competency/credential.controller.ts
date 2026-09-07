import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CredentialVerificationService } from './credential-verification.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['api/v1/credentials', 'v1/credentials', 'credentials'])
export class CredentialController {
  constructor(
    private readonly credentialService: CredentialVerificationService,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCredential(@Param('id') id: string) {
    return this.credentialService.verifyCredential(id);
  }

  @Get(':id/verify')
  async verifyCredential(@Param('id') id: string) {
    return this.credentialService.verifyCredential(id);
  }

  @Get('public/:verificationId')
  async getPublicVerification(@Param('verificationId') verificationId: string) {
    return this.credentialService.getPublicVerification(verificationId);
  }
}
