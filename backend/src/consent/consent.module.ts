import { Module } from '@nestjs/common';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentModule } from '../parent/parent.module';

@Module({
  imports: [PrismaModule, ParentModule],
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
