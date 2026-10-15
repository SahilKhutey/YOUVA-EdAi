import { AiFeaturesGuard } from '../common/guards/ai-features.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';

// Login required (this endpoint used to accept any prompt from anyone) and off unless ENABLE_AI_FEATURES=true.
@UseGuards(JwtAuthGuard, AiFeaturesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.generateText(prompt);
  }
}
