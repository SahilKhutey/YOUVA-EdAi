import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';

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
