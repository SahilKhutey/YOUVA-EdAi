import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  CreateRelationshipDto,
  CreateKnowledgeEventDto,
  SearchKnowledgeDto,
  StartSessionDto,
  UpdateSessionDto,
  EvaluateAnswerDto,
} from './dto';
import { hashKnowledgeContent } from './types/knowledge.types';

import { Optional } from '@nestjs/common';
import { EvidenceProcessorService } from '../learning-evidence/evidence-processor.service';
import { GraphValidationService } from '../knowledge-graph/graph-validation.service';

@Injectable()
export class LearningKnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly evidenceProcessor?: EvidenceProcessorService,
    @Optional() private readonly graphValidation?: GraphValidationService,
  ) {}

  /**
   * Creates a new KnowledgeObject and its initial DRAFT version (v1).
   */
  async create(
    actorId: string,
    input: CreateKnowledgeDto,
    tenantId: string = 'default-tenant',
  ) {
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestException('Title is required');
    }

    const contentHash = hashKnowledgeContent(input.content);

    return this.prisma.$transaction(async (tx) => {
      // Create canonical knowledge object
      const knowledgeObject = await tx.knowledgeObject.create({
        data: {
          tenantId,
          type: input.type,
          title: input.title,
          slug: input.slug,
          description: input.description,
          subjectId: input.subjectId,
          topicId: input.topicId,
          parentId: input.parentId,
          status: 'DRAFT',
          currentVersion: 1,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      // Create initial version (v1)
      const initialVersion = await tx.knowledgeVersion.create({
        data: {
          knowledgeObjectId: knowledgeObject.id,
          version: 1,
          content: input.content,
          contentHash,
          sourceType: 'TEACHER',
          reviewStatus: 'DRAFT',
          authorId: actorId,
        },
      });

      // Create objectives if provided
      if (input.learningObjectives && input.learningObjectives.length > 0) {
        await tx.knowledgeObjective.createMany({
          data: input.learningObjectives.map((obj, index) => ({
            knowledgeObjectId: knowledgeObject.id,
            objective: obj,
            sequence: index,
          })),
        });
      }

      // Create tags if provided
      if (input.tags && input.tags.length > 0) {
        await tx.knowledgeTag.createMany({
          data: input.tags.map((tag) => ({
            knowledgeObjectId: knowledgeObject.id,
            tag: tag.trim().toLowerCase(),
          })),
          skipDuplicates: true,
        });
      }

      // Create prerequisites if provided
      if (input.prerequisites && input.prerequisites.length > 0) {
        for (const prereqId of input.prerequisites) {
          if (prereqId !== knowledgeObject.id) {
            await tx.knowledgeRelationship.create({
              data: {
                sourceId: prereqId,
                targetId: knowledgeObject.id,
                relation: 'PREREQUISITE',
                createdBy: actorId,
              },
            });
          }
        }
      }

      return {
        ...knowledgeObject,
        versions: [initialVersion],
      };
    });
  }

  /**
   * Updates an existing knowledge object by appending a new version (N + 1).
   * Keeps existing published version intact and resets object status to DRAFT.
   */
  async update(
    actorId: string,
    id: string,
    input: UpdateKnowledgeDto,
    tenantId: string = 'default-tenant',
  ) {
    const existing = await this.prisma.knowledgeObject.findFirst({
      where: { id, tenantId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException(`Knowledge object '${id}' not found in tenant '${tenantId}'`);
    }

    const latestVersionNum = existing.versions[0]?.version ?? existing.currentVersion;
    const nextVersionNum = latestVersionNum + 1;
    const contentHash = hashKnowledgeContent(input.content);

    return this.prisma.$transaction(async (tx) => {
      // Create new version record
      const newVersion = await tx.knowledgeVersion.create({
        data: {
          knowledgeObjectId: existing.id,
          version: nextVersionNum,
          content: input.content,
          contentHash,
          sourceType: 'TEACHER',
          reviewStatus: 'DRAFT',
          authorId: actorId,
        },
      });

      // Update knowledge object (status becomes DRAFT for pending review)
      const updatedObject = await tx.knowledgeObject.update({
        where: { id: existing.id },
        data: {
          title: input.title ?? existing.title,
          description: input.description ?? existing.description,
          status: 'DRAFT',
          updatedBy: actorId,
        },
      });

      // Update objectives if provided
      if (input.learningObjectives) {
        await tx.knowledgeObjective.deleteMany({
          where: { knowledgeObjectId: existing.id },
        });
        await tx.knowledgeObjective.createMany({
          data: input.learningObjectives.map((obj, index) => ({
            knowledgeObjectId: existing.id,
            objective: obj,
            sequence: index,
          })),
        });
      }

      // Update tags if provided
      if (input.tags) {
        await tx.knowledgeTag.deleteMany({
          where: { knowledgeObjectId: existing.id },
        });
        await tx.knowledgeTag.createMany({
          data: input.tags.map((tag) => ({
            knowledgeObjectId: existing.id,
            tag: tag.trim().toLowerCase(),
          })),
          skipDuplicates: true,
        });
      }

      return {
        ...updatedObject,
        newVersion,
      };
    });
  }

  /**
   * Submits a DRAFT knowledge object for review (DRAFT -> IN_REVIEW).
   */
  async submitForReview(
    actorId: string,
    id: string,
    tenantId: string = 'default-tenant',
  ) {
    const existing = await this.prisma.knowledgeObject.findFirst({
      where: { id, tenantId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    const latestVersion = existing.versions[0];
    if (!latestVersion) {
      throw new NotFoundException('No version found to submit for review');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.knowledgeVersion.update({
        where: { id: latestVersion.id },
        data: { reviewStatus: 'PENDING_REVIEW' },
      });

      return tx.knowledgeObject.update({
        where: { id: existing.id },
        data: {
          status: 'IN_REVIEW',
          updatedBy: actorId,
        },
      });
    });
  }

  /**
   * Approves a knowledge version (IN_REVIEW -> APPROVED).
   */
  async approve(
    actorId: string,
    id: string,
    tenantId: string = 'default-tenant',
  ) {
    const existing = await this.prisma.knowledgeObject.findFirst({
      where: { id, tenantId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    const latestVersion = existing.versions[0];
    if (!latestVersion) {
      throw new NotFoundException('No version found to approve');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.knowledgeVersion.update({
        where: { id: latestVersion.id },
        data: { reviewStatus: 'APPROVED' },
      });

      return tx.knowledgeObject.update({
        where: { id: existing.id },
        data: {
          status: 'APPROVED',
          updatedBy: actorId,
        },
      });
    });
  }

  /**
   * Atomically publishes an approved knowledge version (APPROVED -> PUBLISHED).
   */
  async publish(
    actorId: string,
    id: string,
    tenantId: string = 'default-tenant',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.knowledgeObject.findFirst({
        where: { id, tenantId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      });

      if (!existing) {
        throw new NotFoundException(`Knowledge object '${id}' not found`);
      }

      const version = existing.versions[0];
      if (!version) {
        throw new NotFoundException('Knowledge version not found');
      }

      if (version.reviewStatus !== 'APPROVED') {
        throw new ConflictException('Only approved knowledge can be published');
      }

      const updatedObject = await tx.knowledgeObject.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          currentVersion: version.version,
          updatedBy: actorId,
        },
      });

      await tx.knowledgeVersion.update({
        where: { id: version.id },
        data: {
          publishedAt: new Date(),
        },
      });

      return updatedObject;
    });
  }

  /**
   * Student knowledge retrieval.
   * Enforces: only PUBLISHED knowledge is student-accessible. Drafts/archived throw 404.
   */
  async getForStudent(
    learnerId: string,
    id: string,
    tenantId: string = 'default-tenant',
  ) {
    const object = await this.prisma.knowledgeObject.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
      },
      include: {
        objectives: { orderBy: { sequence: 'asc' } },
        tags: true,
        incomingLinks: {
          where: { relation: 'PREREQUISITE' },
          include: { source: true },
        },
        outgoingLinks: {
          include: { target: true },
        },
      },
    });

    if (!object) {
      throw new NotFoundException('Knowledge object not found or not published');
    }

    const version = await this.prisma.knowledgeVersion.findUnique({
      where: {
        knowledgeObjectId_version: {
          knowledgeObjectId: object.id,
          version: object.currentVersion,
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Published knowledge version content not found');
    }

    return {
      id: object.id,
      type: object.type,
      title: object.title,
      slug: object.slug,
      description: object.description,
      version: object.currentVersion,
      knowledgeVersionId: version.id,
      content: version.content,
      learningObjectives: object.objectives.map((o) => o.objective),
      tags: object.tags.map((t) => t.tag),
      prerequisites: object.incomingLinks.map((link) => ({
        id: link.source.id,
        title: link.source.title,
        type: link.source.type,
      })),
      relatedKnowledge: object.outgoingLinks.map((link) => ({
        id: link.target.id,
        title: link.target.title,
        relation: link.relation,
      })),
    };
  }

  /**
   * Starts or resumes a learning session for a published knowledge object.
   * Pins the session to a concrete KnowledgeVersion.
   * Emits a STARTED event when a new session is created.
   */
  async startSession(
    learnerId: string,
    knowledgeObjectId: string,
    input?: StartSessionDto,
    tenantId: string = 'default-tenant',
  ) {
    const object = await this.prisma.knowledgeObject.findFirst({
      where: {
        id: knowledgeObjectId,
        status: 'PUBLISHED',
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!object) {
      throw new NotFoundException('Knowledge object not found or not published');
    }

    // Determine concrete version
    let version: any;
    if (input?.knowledgeVersionId) {
      version = await this.prisma.knowledgeVersion.findFirst({
        where: {
          id: input.knowledgeVersionId,
          knowledgeObjectId,
        },
      });
    } else {
      version = await this.prisma.knowledgeVersion.findUnique({
        where: {
          knowledgeObjectId_version: {
            knowledgeObjectId: object.id,
            version: object.currentVersion,
          },
        },
      });
    }

    if (!version) {
      throw new NotFoundException('Published knowledge version not found');
    }

    // Check if an ACTIVE session already exists for this learner and knowledge object
    const existingActive = await this.prisma.knowledgeLearningSession.findFirst({
      where: {
        tenantId,
        learnerId,
        knowledgeObjectId,
        status: 'ACTIVE',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (existingActive) {
      return existingActive;
    }

    // Create new session
    const session = await this.prisma.knowledgeLearningSession.create({
      data: {
        tenantId,
        learnerId,
        knowledgeObjectId,
        knowledgeVersionId: version.id,
        status: 'ACTIVE',
        lastPosition: 0,
      },
    });

    // Emit STARTED event non-blockingly
    this.recordEvent(
      learnerId,
      {
        knowledgeObjectId,
        knowledgeVersion: version.version,
        eventType: 'STARTED',
        metadata: JSON.stringify({ sessionId: session.id }),
      },
      tenantId,
    ).catch(() => {});

    return session;
  }

  /**
   * Retrieves a student's learning session.
   * Enforces session ownership and tenant isolation.
   */
  async getSession(
    learnerId: string,
    sessionId: string,
    tenantId: string = 'default-tenant',
  ) {
    const session = await this.prisma.knowledgeLearningSession.findUnique({
      where: { id: sessionId },
      include: { knowledgeObject: true },
    });

    if (!session) {
      throw new NotFoundException(`Learning session '${sessionId}' not found`);
    }

    if (session.learnerId !== learnerId || session.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return session;
  }

  /**
   * Updates the student's progress position in the session and records SECTION_VIEWED event.
   */
  async updateSessionPosition(
    learnerId: string,
    sessionId: string,
    input: UpdateSessionDto,
    tenantId: string = 'default-tenant',
  ) {
    const session = await this.prisma.knowledgeLearningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Learning session '${sessionId}' not found`);
    }

    if (session.learnerId !== learnerId || session.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    const updatedSession = await this.prisma.knowledgeLearningSession.update({
      where: { id: sessionId },
      data: { lastPosition: input.lastPosition },
    });

    // Record SECTION_VIEWED event
    const version = await this.prisma.knowledgeVersion.findUnique({
      where: { id: session.knowledgeVersionId },
    });

    if (version) {
      this.recordEvent(
        learnerId,
        {
          knowledgeObjectId: session.knowledgeObjectId,
          knowledgeVersion: version.version,
          eventType: 'SECTION_VIEWED',
          metadata: JSON.stringify({
            sessionId: session.id,
            position: input.lastPosition,
          }),
        },
        tenantId,
      ).catch(() => {});
    }

    return updatedSession;
  }

  /**
   * Marks a session as COMPLETED and records a COMPLETED learning event.
   */
  async completeSession(
    learnerId: string,
    sessionId: string,
    tenantId: string = 'default-tenant',
  ) {
    const session = await this.prisma.knowledgeLearningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Learning session '${sessionId}' not found`);
    }

    if (session.learnerId !== learnerId || session.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    const updatedSession = await this.prisma.knowledgeLearningSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Record COMPLETED event
    const version = await this.prisma.knowledgeVersion.findUnique({
      where: { id: session.knowledgeVersionId },
    });

    if (version) {
      this.recordEvent(
        learnerId,
        {
          knowledgeObjectId: session.knowledgeObjectId,
          knowledgeVersion: version.version,
          eventType: 'COMPLETED',
          metadata: JSON.stringify({ sessionId: session.id }),
        },
        tenantId,
      ).catch(() => {});
    }

    return updatedSession;
  }

  /**
   * Evaluates a student's answer server-side against canonical content blocks.
   * Client-side correctness claims are strictly untrusted.
   * Emits an ANSWERED event with full telemetry (attempt, latencyMs, hintUsed, isCorrect).
   */
  async evaluateAnswer(
    learnerId: string,
    input: EvaluateAnswerDto,
    tenantId: string = 'default-tenant',
  ) {
    const version = await this.prisma.knowledgeVersion.findUnique({
      where: {
        knowledgeObjectId_version: {
          knowledgeObjectId: input.knowledgeObjectId,
          version: input.knowledgeVersion,
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${input.knowledgeVersion} for knowledge object '${input.knowledgeObjectId}' not found`,
      );
    }

    // Parse version content to locate question block
    let questionBlock: any = null;
    try {
      const parsed = JSON.parse(version.content);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        for (const sec of parsed.sections) {
          if (Array.isArray(sec.blocks)) {
            const found = sec.blocks.find(
              (b: any) =>
                (b.type === 'QUESTION' || b.type === 'PRACTICE') &&
                (b.id === input.questionId || b.questionId === input.questionId),
            );
            if (found) {
              questionBlock = found;
              break;
            }
          }
        }
      } else if (Array.isArray(parsed)) {
        questionBlock = parsed.find(
          (b: any) =>
            (b.type === 'QUESTION' || b.type === 'PRACTICE') &&
            (b.id === input.questionId || b.questionId === input.questionId),
        );
      }
    } catch {
      // Content might not be JSON (e.g. raw text)
    }

    if (!questionBlock) {
      throw new NotFoundException(`Question '${input.questionId}' not found in knowledge version`);
    }

    // Server-side evaluation
    const expectedAnswer = String(
      questionBlock.answer ??
      questionBlock.correctAnswer ??
      questionBlock.metadata?.correctAnswer ??
      '',
    ).trim().toLowerCase();

    const submitted = String(input.submittedAnswer || '').trim().toLowerCase();
    const isCorrect = expectedAnswer.length > 0 && expectedAnswer === submitted;

    const explanation =
      questionBlock.explanation ||
      questionBlock.metadata?.explanation ||
      (isCorrect
        ? 'Well done! Your answer is correct.'
        : 'That is not quite right. Review the hints or explanation and try again.');

    // Record ANSWERED event
    await this.recordEvent(
      learnerId,
      {
        knowledgeObjectId: input.knowledgeObjectId,
        knowledgeVersion: input.knowledgeVersion,
        eventType: 'ANSWERED',
        clientEventId: input.clientEventId,
        metadata: JSON.stringify({
          questionId: input.questionId,
          submittedAnswer: input.submittedAnswer,
          isCorrect,
          attempt: input.attempt ?? 1,
          latencyMs: input.latencyMs ?? 0,
          hintUsed: input.hintUsed ?? false,
        }),
      },
      tenantId,
    ).catch(() => {});

    return {
      isCorrect,
      feedback: isCorrect
        ? 'Correct! Excellent understanding.'
        : 'Incorrect. Please review the explanation and try again.',
      explanation,
    };
  }

  /**
   * Records a granular student learning event.
   * Enforces: knowledge object must exist, event preserves concrete version,
   * and duplicate clientEventId requests are handled idempotently.
   */
  async recordEvent(
    learnerId: string,
    input: CreateKnowledgeEventDto,
    tenantId: string = 'default-tenant',
  ) {
    if (input.clientEventId) {
      const existingEvent = await this.prisma.knowledgeEvent.findUnique({
        where: {
          tenantId_learnerId_clientEventId: {
            tenantId,
            learnerId,
            clientEventId: input.clientEventId,
          },
        },
      });
      if (existingEvent) {
        return existingEvent;
      }
    }

    const knowledgeObject = await this.prisma.knowledgeObject.findUnique({
      where: { id: input.knowledgeObjectId },
    });

    if (!knowledgeObject) {
      throw new NotFoundException(`Knowledge object '${input.knowledgeObjectId}' not found`);
    }

    const version = await this.prisma.knowledgeVersion.findUnique({
      where: {
        knowledgeObjectId_version: {
          knowledgeObjectId: input.knowledgeObjectId,
          version: input.knowledgeVersion,
        },
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${input.knowledgeVersion} for knowledge object '${input.knowledgeObjectId}' does not exist`,
      );
    }

    try {
      const event = await this.prisma.knowledgeEvent.create({
        data: {
          tenantId,
          learnerId,
          clientEventId: input.clientEventId,
          knowledgeObjectId: input.knowledgeObjectId,
          knowledgeVersion: input.knowledgeVersion,
          eventType: input.eventType,
          metadata: input.metadata,
        },
      });

      if (this.evidenceProcessor) {
        this.evidenceProcessor.processEvent(event.id).catch(() => {});
      }

      return event;
    } catch (err: any) {
      if (err?.code === 'P2002' && input.clientEventId) {
        const existing = await this.prisma.knowledgeEvent.findUnique({
          where: {
            tenantId_learnerId_clientEventId: {
              tenantId,
              learnerId,
              clientEventId: input.clientEventId,
            },
          },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  /**
   * Searches published knowledge objects with indexed filtering.
   */
  async search(
    query: SearchKnowledgeDto,
    tenantId: string = 'default-tenant',
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
      OR: [{ tenantId }, { tenantId: null }],
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.query && query.query.trim().length > 0) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.query, mode: 'insensitive' } },
            { description: { contains: query.query, mode: 'insensitive' } },
            { slug: { contains: query.query, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.knowledgeObject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          objectives: { take: 3 },
          tags: true,
        },
      }),
      this.prisma.knowledgeObject.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        slug: item.slug,
        description: item.description,
        version: item.currentVersion,
        tags: item.tags.map((t) => t.tag),
        learningObjectives: item.objectives.map((o) => o.objective),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Creates a semantic relationship between two knowledge objects.
   * Enforces: sourceId !== targetId, valid objects, cycle detection, and tenant isolation.
   */
  async createRelationship(
    actorId: string,
    input: CreateRelationshipDto,
    tenantId: string = 'default-tenant',
  ) {
    if (this.graphValidation) {
      await this.graphValidation.validateRelationship(
        input.sourceId,
        input.targetId,
        input.relation,
        tenantId,
      );
    } else {
      if (input.sourceId === input.targetId) {
        throw new BadRequestException('A knowledge object cannot relate to itself');
      }

      const [source, target] = await Promise.all([
        this.prisma.knowledgeObject.findUnique({ where: { id: input.sourceId } }),
        this.prisma.knowledgeObject.findUnique({ where: { id: input.targetId } }),
      ]);

      if (!source) {
        throw new NotFoundException(`Source knowledge object '${input.sourceId}' not found`);
      }

      if (!target) {
        throw new NotFoundException(`Target knowledge object '${input.targetId}' not found`);
      }
    }

    return this.prisma.knowledgeRelationship.upsert({
      where: {
        sourceId_targetId_relation: {
          sourceId: input.sourceId,
          targetId: input.targetId,
          relation: input.relation,
        },
      },
      create: {
        sourceId: input.sourceId,
        targetId: input.targetId,
        relation: input.relation,
        weight: input.weight ?? 1.0,
        createdBy: actorId,
      },
      update: {
        weight: input.weight ?? 1.0,
      },
    });
  }

  /**
   * Retrieves related knowledge for an object.
   */
  async getRelated(id: string, tenantId: string = 'default-tenant') {
    const object = await this.prisma.knowledgeObject.findUnique({
      where: { id },
    });
    if (!object) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    const outgoing = await this.prisma.knowledgeRelationship.findMany({
      where: { sourceId: id },
      include: { target: true },
    });

    const incoming = await this.prisma.knowledgeRelationship.findMany({
      where: { targetId: id },
      include: { source: true },
    });

    return {
      outgoing: outgoing.map((rel) => ({
        id: rel.target.id,
        title: rel.target.title,
        type: rel.target.type,
        relation: rel.relation,
        weight: rel.weight,
      })),
      incoming: incoming.map((rel) => ({
        id: rel.source.id,
        title: rel.source.title,
        type: rel.source.type,
        relation: rel.relation,
        weight: rel.weight,
      })),
    };
  }

  /**
   * Retrieves prerequisites for a knowledge object.
   */
  async getPrerequisites(id: string, tenantId: string = 'default-tenant') {
    const object = await this.prisma.knowledgeObject.findUnique({
      where: { id },
    });
    if (!object) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    const prereqEdges = await this.prisma.knowledgeRelationship.findMany({
      where: {
        targetId: id,
        relation: 'PREREQUISITE',
      },
      include: { source: true },
    });

    return prereqEdges.map((edge) => ({
      id: edge.source.id,
      title: edge.source.title,
      type: edge.source.type,
      status: edge.source.status,
      weight: edge.weight,
    }));
  }

  /**
   * Retrieves teacher's knowledge library and stats.
   */
  async getTeacherKnowledge(actorId: string, tenantId: string = 'default-tenant') {
    const [drafts, inReview, approved, published, items] = await Promise.all([
      this.prisma.knowledgeObject.count({ where: { tenantId, status: 'DRAFT' } }),
      this.prisma.knowledgeObject.count({ where: { tenantId, status: 'IN_REVIEW' } }),
      this.prisma.knowledgeObject.count({ where: { tenantId, status: 'APPROVED' } }),
      this.prisma.knowledgeObject.count({ where: { tenantId, status: 'PUBLISHED' } }),
      this.prisma.knowledgeObject.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        include: {
          objectives: true,
          tags: true,
        },
      }),
    ]);

    return {
      stats: {
        drafts,
        inReview,
        approved,
        published,
        total: drafts + inReview + approved + published,
      },
      items,
    };
  }

  /**
   * Retrieves detailed teacher view with version history.
   */
  async getTeacherKnowledgeDetail(
    actorId: string,
    id: string,
    tenantId: string = 'default-tenant',
  ) {
    const object = await this.prisma.knowledgeObject.findFirst({
      where: { id, tenantId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        objectives: { orderBy: { sequence: 'asc' } },
        tags: true,
        outgoingLinks: { include: { target: true } },
        incomingLinks: { include: { source: true } },
      },
    });

    if (!object) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    return object;
  }

  /**
   * Retrieves all versions of a knowledge object.
   */
  async getVersions(id: string, tenantId: string = 'default-tenant') {
    const object = await this.prisma.knowledgeObject.findUnique({
      where: { id },
    });
    if (!object) {
      throw new NotFoundException(`Knowledge object '${id}' not found`);
    }

    return this.prisma.knowledgeVersion.findMany({
      where: { knowledgeObjectId: id },
      orderBy: { version: 'desc' },
    });
  }
}
