import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ConsentService],
  controllers: [ConsentController],
  exports: [ConsentService],
})
export class ConsentModule {}
