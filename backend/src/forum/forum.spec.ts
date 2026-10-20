import { NotFoundException } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';

describe('ForumService & ForumController', () => {
  let service: ForumService;
  let controller: ForumController;
  let prisma: any;
  let gamification: any;

  beforeEach(() => {
    prisma = {
      subject: { findMany: jest.fn() },
      discussionPost: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      discussionReply: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      topic: { findUnique: jest.fn() },
      postVote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    gamification = {
      addXp: jest.fn(),
    };
    service = new ForumService(prisma, gamification);
    controller = new ForumController(service);
  });

  it('getPostById throws NotFoundException when post does not exist', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue(null);
    await expect(service.getPostById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('createPost throws NotFoundException when topic does not exist', async () => {
    prisma.topic.findUnique.mockResolvedValue(null);
    await expect(service.createPost('user-1', 'topic-x', 'Title', 'Body')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.discussionPost.create).not.toHaveBeenCalled();
    expect(gamification.addXp).not.toHaveBeenCalled();
  });

  it('createPost succeeds and awards 10 XP when topic exists', async () => {
    prisma.topic.findUnique.mockResolvedValue({ id: 'topic-1', title: 'Equations' });
    prisma.discussionPost.create.mockResolvedValue({
      id: 'post-1',
      topicId: 'topic-1',
      authorId: 'user-1',
      title: 'Title',
      body: 'Body',
    });

    const result = await controller.createPost(
      { user: { id: 'user-1' } },
      { topicId: 'topic-1', title: 'Title', body: 'Body' },
    );

    expect(result.id).toBe('post-1');
    expect(gamification.addXp).toHaveBeenCalledWith('user-1', 10);
  });

  it('createReply throws NotFoundException when post does not exist', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue(null);
    await expect(service.createReply('user-1', 'post-x', 'Reply')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createReply succeeds and awards 5 XP when post exists', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue({ id: 'post-1' });
    prisma.discussionReply.create.mockResolvedValue({
      id: 'reply-1',
      postId: 'post-1',
      authorId: 'user-2',
      body: 'Reply',
    });

    const result = await controller.createReply(
      'post-1',
      { user: { id: 'user-2' } },
      { body: 'Reply' },
    );

    expect(result.id).toBe('reply-1');
    expect(gamification.addXp).toHaveBeenCalledWith('user-2', 5);
  });

  it('pinPost toggles isPinned and throws if not found', async () => {
    prisma.discussionPost.findUnique.mockResolvedValue(null);
    await expect(service.pinPost('missing')).rejects.toThrow(NotFoundException);

    prisma.discussionPost.findUnique.mockResolvedValue({ id: 'post-1', isPinned: false });
    prisma.discussionPost.update.mockResolvedValue({ id: 'post-1', isPinned: true });

    const updated = await controller.pinPost('post-1');
    expect(updated.isPinned).toBe(true);
    expect(prisma.discussionPost.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { isPinned: true },
    });
  });

  it('markAccepted sets accepted, marks post resolved and awards 50 XP', async () => {
    prisma.discussionReply.findUnique.mockResolvedValue({
      id: 'reply-1',
      postId: 'post-1',
      authorId: 'user-solver',
    });
    prisma.discussionReply.update.mockResolvedValue({ id: 'reply-1', isAccepted: true });
    prisma.discussionPost.update.mockResolvedValue({ id: 'post-1', status: 'RESOLVED' });

    await controller.markAccepted('reply-1');
    expect(prisma.discussionReply.updateMany).toHaveBeenCalledWith({
      where: { postId: 'post-1' },
      data: { isAccepted: false },
    });
    expect(gamification.addXp).toHaveBeenCalledWith('user-solver', 50);
  });
});
