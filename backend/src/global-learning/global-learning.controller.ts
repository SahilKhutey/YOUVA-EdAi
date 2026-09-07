import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearnerIntelligenceService } from './learner/learner-intelligence.service';
import { OfflineService, OfflineActivity } from './offline/offline.service';
import { ExperimentService } from './research/experiment.service';
import {
  ModelEvaluationService,
  ModelEvaluation,
} from './models/model-evaluation.service';

@Controller(['v1/global', 'global'])
export class GlobalLearningController {
  constructor(
    private readonly learnerIntelligence: LearnerIntelligenceService,
    private readonly offlineService: OfflineService,
    private readonly experimentService: ExperimentService,
    private readonly modelEvaluationService: ModelEvaluationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('learner-intelligence/:studentId')
  async getLearnerIntelligence(
    @Param('studentId') studentId: string,
    @Request() req: any,
  ) {
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      throw new ForbiddenException('Cannot access other learner intelligence.');
    }
    return this.learnerIntelligence.getGlobalLearnerState(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('offline/packages')
  async createOfflinePackage(
    @Request() req: any,
    @Body() body: { activities: OfflineActivity[]; validityHours?: number },
  ) {
    return this.offlineService.createPackage(
      req.user.id,
      body.activities,
      body.validityHours,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('offline/sync')
  async syncOfflineEvidence(@Request() req: any, @Body() body: any) {
    return this.offlineService.syncEvidence(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('experiments')
  async createExperiment(
    @Body()
    body: {
      key: string;
      name: string;
      description?: string;
      allocation: Record<string, number>;
      metrics: string[];
    },
  ) {
    return this.experimentService.createExperiment(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('experiments/:key/assign')
  async assignVariant(
    @Param('key') key: string,
    @Request() req: any,
    @Body() body: { subjectId?: string },
  ) {
    const subjectId = body.subjectId || req.user.id;
    return {
      experimentKey: key,
      subjectId,
      variant: await this.experimentService.assignSubjectVariant(key, subjectId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('experiments/:key/observations')
  async recordObservation(
    @Param('key') key: string,
    @Request() req: any,
    @Body() body: { metric: string; value: number; subjectId?: string },
  ) {
    const subjectId = body.subjectId || req.user.id;
    return this.experimentService.recordObservation(
      key,
      subjectId,
      body.metric,
      body.value,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai/evaluate')
  async evaluateModel(
    @Request() req: any,
    @Body()
    body: {
      interactionId: string;
      evaluatorType: 'AUTOMATED' | 'TEACHER' | 'RESEARCH' | 'SAFETY';
      evaluation: ModelEvaluation;
      notes?: string;
    },
  ) {
    return this.modelEvaluationService.recordEvaluation({
      interactionId: body.interactionId,
      evaluatorType: body.evaluatorType,
      evaluatorId: req.user.id,
      evaluation: body.evaluation,
      notes: body.notes,
    });
  }
}
