import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ForumService {
    constructor(
        private prisma: PrismaService,
        private gamificationService: GamificationService,
    ) { }

    // ── Get all posts for a topic ──────────────────────────────
    async getPosts(topicId: string) {
        const posts = await this.prisma.discussionPost.findMany({
            where: { topicId },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            include: {
                author: { select: { id: true, name: true, role: true } },
                _count: { select: { replies: true } },
            },
        });
        return posts;
    }

    // ── Get all subjects + topics with open post counts ────────
    async getForumHome() {
        const subjects = await this.prisma.subject.findMany({
            include: {
                topics: {
                    include: {
                        _count: {
                            select: { discussionPosts: true },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return subjects;
    }

    // ── Get single post with replies ───────────────────────────
    async getPostById(id: string) {
        const post = await this.prisma.discussionPost.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, role: true } },
                topic: { select: { id: true, title: true, subject: { select: { name: true } } } },
                replies: {
                    include: {
                        author: { select: { id: true, name: true, role: true } },
                    },
                    orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
                },
            },
        });

        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    // ── Create a new post ──────────────────────────────────────
    async createPost(
        userId: string,
        topicId: string,
        title: string,
        body: string,
    ) {
        const post = await this.prisma.discussionPost.create({
            data: { topicId, authorId: userId, title, body },
            include: { author: { select: { id: true, name: true, role: true } } },
        });

        // Award XP for starting a discussion
        await this.gamificationService.addXp(userId, 10);

        return post;
    }

    // ── Create a reply ─────────────────────────────────────────
    async createReply(userId: string, postId: string, body: string) {
        const post = await this.prisma.discussionPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        const reply = await this.prisma.discussionReply.create({
            data: { postId, authorId: userId, body },
            include: { author: { select: { id: true, name: true, role: true } } },
        });

        // Award XP for contributing a reply
        await this.gamificationService.addXp(userId, 5);

        return reply;
    }

    // ── Toggle upvote on a post ────────────────────────────────
    async toggleUpvote(userId: string, postId: string) {
        const existing = await this.prisma.postVote.findUnique({
            where: { postId_userId: { postId, userId } },
        });

        if (existing) {
            // Remove vote
            await this.prisma.postVote.delete({
                where: { postId_userId: { postId, userId } },
            });
            await this.prisma.discussionPost.update({
                where: { id: postId },
                data: { upvotes: { decrement: 1 } },
            });
            return { upvoted: false };
        } else {
            // Add vote
            await this.prisma.postVote.create({ data: { postId, userId, value: 1 } });
            await this.prisma.discussionPost.update({
                where: { id: postId },
                data: { upvotes: { increment: 1 } },
            });
            return { upvoted: true };
        }
    }

    // ── Pin/Unpin a post (TEACHER/ADMIN only) ──────────────────
    async pinPost(postId: string) {
        const post = await this.prisma.discussionPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.discussionPost.update({
            where: { id: postId },
            data: { isPinned: !post.isPinned },
        });
    }

    // ── Mark reply as accepted answer ─────────────────────────
    async markAccepted(replyId: string) {
        const reply = await this.prisma.discussionReply.findUnique({ where: { id: replyId } });
        if (!reply) throw new NotFoundException('Reply not found');

        // Un-accept any previously accepted reply on this post
        await this.prisma.discussionReply.updateMany({
            where: { postId: reply.postId },
            data: { isAccepted: false },
        });

        // Mark this reply as accepted and resolve the post
        const [updated] = await Promise.all([
            this.prisma.discussionReply.update({
                where: { id: replyId },
                data: { isAccepted: true },
            }),
            this.prisma.discussionPost.update({
                where: { id: reply.postId },
                data: { status: 'RESOLVED' },
            }),
            // Award major XP for providing the accepted answer
            this.gamificationService.addXp(reply.authorId, 50),
        ]);
        return updated;
    }
}
