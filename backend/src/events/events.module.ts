import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutboxService } from './outbox/outbox.service';
import { OutboxProcessor } from './outbox/outbox.processor';
import { EventBusService } from './event-bus.service';

import { OutboxWorkerService } from './outbox/outbox-worker.service';
import { IdempotentConsumerService } from './idempotency/idempotent-consumer.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    OutboxService,
    OutboxProcessor,
    OutboxWorkerService,
    EventBusService,
    IdempotentConsumerService,
  ],
  exports: [
    OutboxService,
    OutboxProcessor,
    OutboxWorkerService,
    EventBusService,
    IdempotentConsumerService,
  ],
})
export class EventsModule {}
