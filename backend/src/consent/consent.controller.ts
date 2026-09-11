import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ConsentService } from './consent.service';
import { CONSENT_DESCRIPTIONS, VALID_CONSENT_TYPES } from './consent.constants';

@Controller('consent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get('types')
  getConsentTypes() {
    return {
      types: VALID_CONSENT_TYPES,
      descriptions: CONSENT_DESCRIPTIONS,
    };
  }

  @Get(':studentId')
  @Roles(Role.PARENT)
  listConsents(@Req() req: any, @Param('studentId') studentId: string) {
    return this.consentService.listConsents(req.user.id, studentId);
  }

  @Post('request-otp')
  @Roles(Role.PARENT)
  requestOtp(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('consentType') consentType: string,
  ) {
    return this.consentService.requestConsentOtp(req.user.id, studentId, consentType);
  }

  @Post('verify-otp')
  @Roles(Role.PARENT)
  verifyOtp(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('consentType') consentType: string,
    @Body('otp') otp: string,
    @Body('version') version?: string,
  ) {
    return this.consentService.verifyOtpAndGrant(
      req.user.id,
      studentId,
      consentType,
      otp,
      version || '1.0.0',
    );
  }

  @Post('grant')
  @Roles(Role.PARENT)
  grant(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('consentType') consentType: string,
    @Body('version') version: string,
    @Body('evidence') evidence?: string,
  ) {
    return this.consentService.grant(
      req.user.id,
      studentId,
      consentType,
      version || '1.0.0',
      evidence,
    );
  }

  @Post('revoke')
  @Roles(Role.PARENT)
  revoke(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('consentType') consentType: string,
  ) {
    return this.consentService.revoke(req.user.id, studentId, consentType);
  }

  @Post('purge/:studentId')
  @Roles(Role.ADMIN)
  executePurge(@Param('studentId') studentId: string) {
    return this.consentService.executePurge(studentId);
  }

  @Get('check/:studentId/:consentType')
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN)
  async checkConsent(
    @Param('studentId') studentId: string,
    @Param('consentType') consentType: string,
  ) {
    const hasConsent = await this.consentService.hasConsent(studentId, consentType);
    return { studentId, consentType, hasConsent };
  }
}
