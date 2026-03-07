import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
    constructor(private readonly service: AnnouncementService) { }

    // Students and teachers can read announcements
    @Get()
    findAll() {
        return this.service.findAll();
    }

    // Only teachers can create
    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    create(
        @Request() req: any,
        @Body() body: { title: string; body: string; isPinned?: boolean },
    ) {
        return this.service.create(
            req.user.userId,
            body.title,
            body.body,
            body.isPinned ?? false,
        );
    }

    // Only teachers can delete
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
