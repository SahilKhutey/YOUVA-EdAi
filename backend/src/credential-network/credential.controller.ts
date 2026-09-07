import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { CredentialService } from './services/credential.service';
import { SkillsPassportService } from './services/skills-passport.service';
import { CredentialIssuanceService } from './services/credential-issuance.service';
import { CredentialVerificationService } from './services/credential-verification.service';
import { CredentialShareService } from './services/credential-share.service';
import { CredentialRevocationService } from './services/credential-revocation.service';
import { CredentialTemplateService } from './services/credential-template.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/credentials', 'v1/credentials', 'credentials'])
export class CredentialController {
  constructor(
    private readonly credentialService: CredentialService,
    private readonly passportService: SkillsPassportService,
    private readonly issuanceService: CredentialIssuanceService,
    private readonly verificationService: CredentialVerificationService,
    private readonly shareService: CredentialShareService,
    private readonly revocationService: CredentialRevocationService,
    private readonly templateService: CredentialTemplateService,
  ) {}

  @Get('learner/:learnerId')
  @UseGuards(JwtAuthGuard)
  async getLearnerCredentials(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.credentialService.getLearnerCredentials(learnerId, tenantId);
  }

  @Get('learner/:learnerId/passport')
  @UseGuards(JwtAuthGuard)
  async getPassport(
    @Param('learnerId') learnerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.passportService.generate(learnerId, tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCredential(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.credentialService.getCredential(id, tenantId);
  }

  @Post('draft')
  @UseGuards(JwtAuthGuard)
  async createDraft(
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || body.tenantId || 'default-tenant';
    const learnerId = req.user?.sub || req.user?.userId || body.learnerId;
    return this.credentialService.createDraft({
      ...body,
      learnerId,
      tenantId,
    });
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const actorId = req.user?.sub || req.user?.userId || 'user';
    return this.credentialService.submitForReview(id, tenantId, actorId);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verify(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVE' | 'REJECT'; notes?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const verifierId = req.user?.sub || req.user?.userId || 'teacher';
    return this.verificationService.verify(
      id,
      verifierId,
      tenantId,
      body.decision,
      body.notes,
    );
  }

  @Post(':id/issue')
  @UseGuards(JwtAuthGuard)
  async issue(
    @Param('id') id: string,
    @Body() body: { operationKey?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const issuerId = req.user?.sub || req.user?.userId || 'institution';
    return this.issuanceService.issue(id, issuerId, tenantId, body?.operationKey);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  async share(
    @Param('id') id: string,
    @Body() body: { expiresAt?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const actorId = req.user?.sub || req.user?.userId || 'learner';
    const expiresDate = body?.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.shareService.createShare(id, tenantId, actorId, expiresDate);
  }

  @Post(':id/revoke')
  @UseGuards(JwtAuthGuard)
  async revoke(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const actorId = req.user?.sub || req.user?.userId || 'admin';
    return this.revocationService.revoke(id, tenantId, actorId, body.reason);
  }

  @Get('templates/list')
  async getTemplates(@Query('tenantId') tenantId?: string) {
    return this.templateService.getTemplates(tenantId);
  }
}
