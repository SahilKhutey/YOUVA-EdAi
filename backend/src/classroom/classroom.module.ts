import { Module } from '@nestjs/common';
import { ClassroomController } from './classroom.controller';
import { LessonPlanService } from './lesson-plan.service';
import { WorksheetService } from './worksheet.service';
import { ClassroomGateway } from './classroom.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [PrismaModule, AiModule],
    controllers: [ClassroomController],
    providers: [LessonPlanService, WorksheetService, ClassroomGateway],
    exports: [LessonPlanService, WorksheetService, ClassroomGateway],
})
export class ClassroomModule { }
