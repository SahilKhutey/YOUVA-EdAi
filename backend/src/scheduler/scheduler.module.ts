import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { StudyPlannerService } from './study-planner.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SchedulerController],
    providers: [SchedulerService, StudyPlannerService],
    exports: [SchedulerService, StudyPlannerService],
})
export class SchedulerModule { }
