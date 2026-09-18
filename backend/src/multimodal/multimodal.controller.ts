import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ModalityRouterService } from './modality-router.service';
import { MultimodalGatewayService } from './multimodal-gateway.service';
import { SpeechRecognitionService } from './speech-recognition.service';
import { SpeechSynthesisService } from './speech-synthesis.service';
import { VisionUnderstandingService } from './vision-understanding.service';
import { MediaGenerationService } from './media-generation.service';
import { MediaStorageService } from './media-storage.service';
import { MultimodalFinopsService } from './multimodal-finops.service';
import { TeacherContentReviewService } from './teacher-content-review.service';
import { MultimodalTutorService } from './multimodal-tutor.service';
import {
  ModalityRecommendationRequest,
  SpeechRecognitionRequest,
  SpeechSynthesisRequest,
  VisionAnalysisRequest,
  MultimodalGenerationRequest,
  LearningModality,
} from './multimodal-types';

@Controller('multimodal')
export class MultimodalController {
  constructor(
    private readonly modalityRouter: ModalityRouterService,
    private readonly gateway: MultimodalGatewayService,
    private readonly speechRecognition: SpeechRecognitionService,
    private readonly speechSynthesis: SpeechSynthesisService,
    private readonly visionUnderstanding: VisionUnderstandingService,
    private readonly mediaGeneration: MediaGenerationService,
    private readonly storageService: MediaStorageService,
    private readonly finopsService: MultimodalFinopsService,
    private readonly teacherReview: TeacherContentReviewService,
    private readonly tutorService: MultimodalTutorService,
  ) {}

  @Post('recommend-modality')
  recommendModality(@Body() body: ModalityRecommendationRequest) {
    return this.modalityRouter.recommendModality(body);
  }

  @Post('speech/transcribe')
  async transcribe(@Body() body: SpeechRecognitionRequest) {
    return this.gateway.transcribe(body);
  }

  @Post('speech/evaluate')
  evaluateSpeech(
    @Body()
    body: {
      transcript: string;
      confidence: number;
      expectedAnswer: string;
      conceptId: string;
    },
  ) {
    return this.speechRecognition.evaluateSpokenAnswer({
      sttResult: {
        transcript: body.transcript,
        confidence: body.confidence,
        language: 'en-IN',
        durationMs: 2500,
        isUnclear: body.confidence < 0.60,
      },
      expectedAnswer: body.expectedAnswer,
      conceptId: body.conceptId,
    });
  }

  @Post('speech/synthesize')
  async synthesize(@Body() body: SpeechSynthesisRequest) {
    return this.gateway.synthesize(body);
  }

  @Post('vision/analyze')
  async analyzeVision(@Body() body: VisionAnalysisRequest) {
    return this.visionUnderstanding.analyzeVision(body);
  }

  @Post('generation/generate')
  async generateMedia(@Body() body: MultimodalGenerationRequest) {
    return this.gateway.generate(body);
  }

  @Post('media/review')
  submitTeacherReview(
    @Body()
    body: {
      assetId: string;
      tenantId: string;
      teacherId: string;
      action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
      notes?: string;
    },
  ) {
    return this.teacherReview.submitReview(body);
  }

  @Get('media/signed-url')
  getSignedUrl(@Query('storageKey') storageKey: string, @Query('ttl') ttl?: string) {
    if (!storageKey) throw new BadRequestException('storageKey query parameter is required');
    const ttlSeconds = ttl ? parseInt(ttl, 10) : 900;
    const signedUrl = this.storageService.generateSignedUrl(storageKey, ttlSeconds);
    return { storageKey, signedUrl, ttlSeconds };
  }

  @Get('finops/budget/:tenantId')
  getFinopsBudget(@Param('tenantId') tenantId: string) {
    return this.finopsService.getTenantBudget(tenantId);
  }

  @Get('flags')
  getFeatureFlags() {
    return this.tutorService.getFeatureFlags();
  }

  @Post('flags')
  updateFeatureFlags(@Body() flags: any) {
    return this.tutorService.setFeatureFlags(flags);
  }

  @Post('tutor/session/start')
  startTutorSession(
    @Body()
    body: {
      learnerId: string;
      tenantId: string;
      conceptId: string;
      learningObjective: string;
      initialMastery: number;
      preferredModality?: LearningModality;
    },
  ) {
    return this.tutorService.startTutorSession(body);
  }

  @Post('tutor/session/:sessionId/switch')
  switchModality(
    @Param('sessionId') sessionId: string,
    @Body('modality') modality: LearningModality,
  ) {
    return this.tutorService.switchModality(sessionId, modality);
  }

  @Post('tutor/session/:sessionId/attempt')
  recordSessionAttempt(
    @Param('sessionId') sessionId: string,
    @Body('correct') correct: boolean,
  ) {
    return this.tutorService.recordAttempt(sessionId, correct);
  }
}
