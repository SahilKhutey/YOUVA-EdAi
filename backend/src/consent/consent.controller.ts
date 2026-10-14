import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { ConsentService } from './consent.service';
import { EraseDto, RecordConsentDto } from './dto/consent.dto';

@Controller('consent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consent: ConsentService, private readonly scope: ScopeAuthorizationService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  async record(@Req() req: any, @Body() dto: RecordConsentDto) {
    await this.scope.assertTeacherStudentScope(req.user.id, dto.studentId);
    return this.consent.record(req.user.id, { ...dto, signedAt: new Date(dto.signedAt) });
  }

  @Get('student/:studentId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async list(@Req() req: any, @Param('studentId') studentId: string) {
    await this.scope.assertTeacherStudentScope(req.user.id, studentId);
    return this.consent.list(studentId);
  }

  @Post('student/:studentId/revoke')
  @Roles(Role.TEACHER, Role.ADMIN)
  async revoke(@Req() req: any, @Param('studentId') studentId: string) {
    await this.scope.assertTeacherStudentScope(req.user.id, studentId);
    return this.consent.revoke(req.user.id, studentId);
  }

  /** Irreversible. Admin only. */
  @Post('student/:studentId/erase')
  @Roles(Role.ADMIN)
  erase(@Req() req: any, @Param('studentId') studentId: string, @Body() _dto: EraseDto) {
    return this.consent.eraseStudent(req.user.id, studentId);
  }
}
