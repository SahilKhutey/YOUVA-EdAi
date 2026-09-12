import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers/status')
  async getProviderStatus() {
    return this.aiService.getDetailedProviderHealth();
  }

  @Post('generate')
  async generate(@Body('prompt') prompt: string) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    return this.aiService.generateText(prompt);
  }

  @Post('generate-structured')
  async generateStructured(
    @Body('prompt') prompt: string,
    @Body('schemaInstruction') schemaInstruction: string,
  ) {
    if (!prompt) {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    if (!schemaInstruction) {
      throw new HttpException('Schema instruction is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.aiService.generateStructured(prompt, schemaInstruction);
    } catch (err: any) {
      if (err.message?.includes('SafetyModerationViolation')) {
        throw new HttpException(err.message, HttpStatus.FORBIDDEN);
      }
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
