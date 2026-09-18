import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SpeechSynthesisRequest, SpeechSynthesisResult } from './multimodal-types';
import { MultimodalModerationService } from './multimodal-moderation.service';

@Injectable()
export class SpeechSynthesisService {
  private readonly logger = new Logger(SpeechSynthesisService.name);

  constructor(private readonly moderationService: MultimodalModerationService) {}

  /**
   * Synthesizes text into educational speech with synchronized captions and transcripts (N11.11, N11.25).
   */
  async synthesizeSpeech(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> {
    if (!request.tenantId) throw new BadRequestException('tenantId is required');
    if (!request.text || request.text.trim().length === 0) {
      throw new BadRequestException('text is required for speech synthesis');
    }

    // Moderation scan on input speech text (N11.38)
    const moderation = this.moderationService.moderatePrompt(request.text);
    if (!moderation.passed) {
      throw new BadRequestException(`Speech synthesis blocked: ${moderation.reason}`);
    }

    // Rate / Speed Bounds check (N11.11: speed in 0.5 to 2.0)
    const speed = Math.min(2.0, Math.max(0.5, request.speed || 1.0));

    // Simulated phoneme duration and synchronized word captions (N11.25)
    const words = request.text.split(/\s+/);
    const msPerWord = Math.round((250 / speed));
    const captions: Array<{ startMs: number; endMs: number; text: string }> = [];

    let currentMs = 0;
    for (const w of words) {
      captions.push({
        startMs: currentMs,
        endMs: currentMs + msPerWord,
        text: w,
      });
      currentMs += msPerWord;
    }

    const durationMs = currentMs;

    // Simulated standard 24kHz audio Base64 payload
    const simulatedAudioBase64 = Buffer.from(`YOUVA_AUDIO_SYNTHESIS_${request.correlationId}_${durationMs}`).toString('base64');

    this.logger.debug(
      `Synthesized ${words.length} words (${durationMs}ms) at speed ${speed}x for tenant ${request.tenantId}`,
    );

    return {
      audioBase64: simulatedAudioBase64,
      mimeType: 'audio/wav',
      durationMs,
      captions,
      transcript: request.text,
      sampleRate: 24000,
    };
  }

  /**
   * Generates graceful text fallback when TTS is disabled or fails (N11.11, N11.52).
   */
  generateTextFallback(text: string): { displayText: string; captions: Array<{ startMs: number; endMs: number; text: string }> } {
    return {
      displayText: text,
      captions: [{ startMs: 0, endMs: 5000, text }],
    };
  }
}
