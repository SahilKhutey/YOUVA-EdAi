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
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { ForumFeatureGuard } from '../common/guards/feature-flag.guard';

@Controller('forum')
@UseGuards(ForumFeatureGuard, JwtAuthGuard)
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
        @Body() body: CreatePostDto,
    ) {
        const userId = req.user.id || req.user.userId;
        return this.service.createPost(userId, body.topicId, body.title, body.body);
    }

    // Reply to a post
    @Post('post/:postId/reply')
    createReply(
        @Param('postId') postId: string,
        @Request() req: any,
        @Body() body: CreateReplyDto,
    ) {
        const userId = req.user.id || req.user.userId;
        return this.service.createReply(userId, postId, body.body);
    }

    // Upvote toggle
    @Patch('post/:id/upvote')
    toggleUpvote(@Param('id') id: string, @Request() req: any) {
        const userId = req.user.id || req.user.userId;
        return this.service.toggleUpvote(userId, id);
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
