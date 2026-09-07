import { Module } from '@nestjs/common';
import { ParentController } from './parent.controller';
import { ParentAccessService } from './parent-access.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParentController],
  providers: [ParentAccessService],
  exports: [ParentAccessService],
})
export class ParentModule {}
