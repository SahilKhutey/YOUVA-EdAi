import { Module } from '@nestjs/common';
import { PedagogyService } from './services/pedagogy/pedagogy.service';
import { ValidatorService } from './services/validator/validator.service';
import { AiMentorController } from './ai-mentor.controller';

@Module({
  providers: [PedagogyService, ValidatorService],
  controllers: [AiMentorController]
})
export class AiMentorModule {}
