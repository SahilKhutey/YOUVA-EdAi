import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { DeterministicFallbackProvider } from './providers/deterministic-fallback.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiProvider,
    OllamaProvider,
    DeterministicFallbackProvider,
  ],
  exports: [
    AiService,
    GeminiProvider,
    OllamaProvider,
    DeterministicFallbackProvider,
  ],
})
export class AiModule {}
