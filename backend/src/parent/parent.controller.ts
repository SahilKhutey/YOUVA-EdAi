import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ParentAccessService } from './parent-access.service';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentController {
  constructor(
    private readonly parentAccessService: ParentAccessService,
  ) {}

  @Get('children')
  getChildren(@Req() req: any) {
    return this.parentAccessService.getChildren(req.user.id);
  }

  @Get('children/:studentId')
  getChild(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentAccessService.getChild(
      req.user.id,
      studentId,
    );
  }
}
