import { Module } from '@nestjs/common';
import { PedagogyService } from './services/pedagogy/pedagogy.service';
import { ValidatorService } from './services/validator/validator.service';
import { AiMentorController } from './ai-mentor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [PedagogyService, ValidatorService],
  controllers: [AiMentorController]
})
export class AiMentorModule { }
