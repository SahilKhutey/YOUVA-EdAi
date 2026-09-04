import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly service: NotificationService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.service.findAll(req.user.userId);
    }

    @Patch('read-all')
    markAllRead(@Request() req: any) {
        return this.service.markAllRead(req.user.userId);
    }

    @Patch(':id/read')
    markRead(@Param('id') id: string, @Request() req: any) {
        return this.service.markRead(id, req.user.userId);
    }
}
