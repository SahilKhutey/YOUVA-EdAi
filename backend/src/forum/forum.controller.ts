import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('forum')
@UseGuards(JwtAuthGuard)
export class ForumController {
    constructor(private readonly service: ForumService) { }

    // Forum home — all subjects + topics with post counts
    @Get('home')
    getForumHome() {
        return this.service.getForumHome();
    }

    // All posts for a topic
    @Get('topic/:topicId')
    getPosts(@Param('topicId') topicId: string) {
        return this.service.getPosts(topicId);
    }

    // Single post with replies
    @Get('post/:id')
    getPostById(@Param('id') id: string) {
        return this.service.getPostById(id);
    }

    // Create a new post
    @Post('post')
    createPost(
        @Request() req: any,
        @Body() body: { topicId: string; title: string; body: string },
    ) {
        return this.service.createPost(req.user.userId, body.topicId, body.title, body.body);
    }

    // Reply to a post
    @Post('post/:postId/reply')
    createReply(
        @Param('postId') postId: string,
        @Request() req: any,
        @Body() body: { body: string },
    ) {
        return this.service.createReply(req.user.userId, postId, body.body);
    }

    // Upvote toggle
    @Patch('post/:id/upvote')
    toggleUpvote(@Param('id') id: string, @Request() req: any) {
        return this.service.toggleUpvote(req.user.userId, id);
    }

    // Pin/unpin (TEACHER/ADMIN only)
    @Patch('post/:id/pin')
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    pinPost(@Param('id') id: string) {
        return this.service.pinPost(id);
    }

    // Mark reply as accepted (TEACHER/ADMIN only)
    @Patch('reply/:id/accept')
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    markAccepted(@Param('id') id: string) {
        return this.service.markAccepted(id);
    }
}
