import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  PrismaModule,
} from '../prisma/prisma.module';

import {
  InteroperabilityController,
} from './p16.controller';

import {
  InteroperabilityService,
} from './p16.service';

import {
  IntegrationAdapterRegistry,
} from './p16.registry';

import {
  RestJsonAdapter,
} from './p16.rest-json.adapter';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],

  controllers: [
    InteroperabilityController,
  ],

  providers: [
    IntegrationAdapterRegistry,
    InteroperabilityService,
    RestJsonAdapter,
  ],

  exports: [
    InteroperabilityService,
    IntegrationAdapterRegistry,
  ],
})
export class InteroperabilityModule {}
