import { Module } from '@nestjs/common';
import { MultimodalController } from './multimodal.controller';
import { MediaSecurityService } from './media-security.service';
import { MediaStorageService } from './media-storage.service';
import { MultimodalModerationService } from './multimodal-moderation.service';
import { SpeechRecognitionService } from './speech-recognition.service';
import { SpeechSynthesisService } from './speech-synthesis.service';
import { VisionUnderstandingService } from './vision-understanding.service';
import { MediaGenerationService } from './media-generation.service';
import { ModalityRouterService } from './modality-router.service';
import { MultimodalFinopsService } from './multimodal-finops.service';
import { TeacherContentReviewService } from './teacher-content-review.service';
import { MultimodalGatewayService } from './multimodal-gateway.service';
import { MultimodalTutorService } from './multimodal-tutor.service';

@Module({
  controllers: [MultimodalController],
  providers: [
    MediaSecurityService,
    MediaStorageService,
    MultimodalModerationService,
    SpeechRecognitionService,
    SpeechSynthesisService,
    VisionUnderstandingService,
    MediaGenerationService,
    ModalityRouterService,
    MultimodalFinopsService,
    TeacherContentReviewService,
    MultimodalGatewayService,
    MultimodalTutorService,
  ],
  exports: [
    MediaSecurityService,
    MediaStorageService,
    MultimodalModerationService,
    SpeechRecognitionService,
    SpeechSynthesisService,
    VisionUnderstandingService,
    MediaGenerationService,
    ModalityRouterService,
    MultimodalFinopsService,
    TeacherContentReviewService,
    MultimodalGatewayService,
    MultimodalTutorService,
  ],
})
export class MultimodalModule {}
