import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EcosystemService } from './ecosystem.service';
import { EcosystemController } from './ecosystem.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EcosystemController],
  providers: [EcosystemService],
  exports: [EcosystemService],
})
export class EcosystemModule {}
