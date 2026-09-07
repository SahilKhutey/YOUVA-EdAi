import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/support-ticket.dto';
import { SubmitProductFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a support ticket.
   * Special routing: Safety category tickets trigger dual-routing into safety operations.
   */
  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    const isSafetyConcern =
      dto.category === 'SAFETY' || dto.priority === 'CRITICAL';

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        category: dto.category,
        priority: dto.priority ?? (isSafetyConcern ? 'HIGH' : 'NORMAL'),
        status: 'OPEN',
        subject: dto.subject,
        description: dto.description,
        metadata: dto.metadata
          ? JSON.stringify({
              ...dto.metadata,
              isSafetyRouted: isSafetyConcern,
              submittedAt: new Date().toISOString(),
            })
          : JSON.stringify({ isSafetyRouted: isSafetyConcern }),
      },
    });

    if (isSafetyConcern) {
      this.logger.warn(
        `[SAFETY ROUTING] Critical/Safety support ticket created: [${ticket.id}] for user [${userId}]. Forwarding to Safety Review Queue.`,
      );
    }

    return ticket;
  }

  /**
   * List tickets filed by the user. Enforces strict user isolation.
   */
  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single ticket ensuring actor owns it or is administrative reviewer.
   */
  async getTicketById(ticketId: string, userId: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket [${ticketId}] not found`);
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new NotFoundException(`Support ticket [${ticketId}] not found`);
    }

    return ticket;
  }

  /**
   * Record product feedback from students, parents, or teachers.
   */
  async submitFeedback(userId: string, dto: SubmitProductFeedbackDto) {
    return this.prisma.productFeedback.create({
      data: {
        userId,
        category: dto.category,
        rating: dto.rating ?? null,
        message: dto.message,
        contextJson: dto.context ? JSON.stringify(dto.context) : null,
      },
    });
  }
}
