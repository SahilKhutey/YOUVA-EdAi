import { NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';

describe('SupportService', () => {
  let service: SupportService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      supportTicket: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ticket-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      productFeedback: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'fb-1', ...data })),
      },
    };

    service = new SupportService(mockPrisma);
  });

  describe('createTicket', () => {
    it('creates normal support ticket for user', async () => {
      const ticket = await service.createTicket('user-1', {
        category: 'BILLING',
        priority: 'NORMAL',
        subject: 'Invoice copy',
        description: 'Need copy of annual plan invoice',
      });

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          category: 'BILLING',
          priority: 'NORMAL',
          status: 'OPEN',
        }),
      });
      expect(ticket.id).toBe('ticket-1');
    });

    it('flags safety routing when category is SAFETY or priority is CRITICAL', async () => {
      const ticket = await service.createTicket('user-1', {
        category: 'SAFETY',
        subject: 'Inappropriate content alert',
        description: 'Safety concern regarding question content',
      });

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          category: 'SAFETY',
          priority: 'HIGH', // Automatically upgraded
          metadata: expect.stringContaining('"isSafetyRouted":true'),
        }),
      });
    });
  });

  describe('Ticket Isolation', () => {
    it('prevents user from accessing another user ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-99',
        userId: 'other-user',
        subject: 'Private issue',
      });

      await expect(service.getTicketById('ticket-99', 'user-intruder')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows ticket owner to retrieve ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-99',
        userId: 'user-owner',
        subject: 'My issue',
      });

      const ticket = await service.getTicketById('ticket-99', 'user-owner');
      expect(ticket.id).toBe('ticket-99');
    });
  });

  describe('submitFeedback', () => {
    it('records product feedback with rating and context', async () => {
      const feedback = await service.submitFeedback('user-1', {
        category: 'UX',
        rating: 5,
        message: 'The new teacher intervention drawer is clean!',
        context: { surface: 'teacher_cockpit' },
      });

      expect(mockPrisma.productFeedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          category: 'UX',
          rating: 5,
          message: 'The new teacher intervention drawer is clean!',
        }),
      });
      expect(feedback.id).toBe('fb-1');
    });
  });
});
