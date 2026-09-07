import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxService } from './outbox/outbox.service';
import { OutboxProcessor } from './outbox/outbox.processor';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [OutboxService, OutboxProcessor, EventBusService],
  exports: [OutboxService, OutboxProcessor, EventBusService],
})
export class EventsModule {}
