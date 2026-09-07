import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [PrismaModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantGuard],
  exports: [TenantsService, TenantGuard],
})
export class TenantsModule {}
