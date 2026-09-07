import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  IntegrationAdapterRegistry,
} from './p16.registry';

import {
  checksumPayload,
} from './p16.security';

import {
  CanonicalExternalRecord,
  CreateIntegrationInput,
  IntegrationRecord,
} from './p16.types';

@Injectable()
export class InteroperabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry:
      IntegrationAdapterRegistry,
  ) {}

  async assertTenantMember(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const rows =
      await this.prisma.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT id
        FROM p16_tenant_memberships
        WHERE tenant_id = ${tenantId}
          AND user_id = ${userId}
          AND status = 'ACTIVE'
        LIMIT 1
      `;

    if (!rows[0]) {
      throw new NotFoundException(
        'Tenant membership not found.',
      );
    }
  }

  async createTenant(
    userId: string,
    name: string,
  ): Promise<{ tenantId: string }> {
    if (!name?.trim()) {
      throw new BadRequestException(
        'Tenant name is required.',
      );
    }

    const rows =
      await this.prisma.$queryRaw<
        Array<{ id: string }>
      >`
        INSERT INTO p16_tenants (name)
        VALUES (${name.trim()})
        RETURNING id
      `;

    const tenantId =
      rows[0].id;

    await this.prisma.$executeRaw`
      INSERT INTO p16_tenant_memberships
        (tenant_id, user_id, role)
      VALUES
        (${tenantId}, ${userId}, 'OWNER')
      ON CONFLICT
        (tenant_id, user_id)
      DO NOTHING
    `;

    return { tenantId };
  }

  async addMember(
    actorUserId: string,
    tenantId: string,
    userId: string,
    role:
      | 'ADMIN'
      | 'TEACHER',
  ) {
    await this.assertTenantMember(
      actorUserId,
      tenantId,
    );

    await this.prisma.$executeRaw`
      INSERT INTO p16_tenant_memberships
        (tenant_id, user_id, role)
      VALUES
        (${tenantId}, ${userId}, ${role})
      ON CONFLICT
        (tenant_id, user_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        status = 'ACTIVE'
    `;

    return {
      tenantId,
      userId,
      role,
    };
  }

  async createIntegration(
    userId: string,
    tenantId: string,
    input: CreateIntegrationInput,
  ) {
    await this.assertTenantMember(
      userId,
      tenantId,
    );

    if (
      !this.registry.has(
        input.provider,
      )
    ) {
      throw new BadRequestException(
        `Unsupported provider: ${input.provider}`,
      );
    }

    if (
      !input.name?.trim()
    ) {
      throw new BadRequestException(
        'Integration name is required.',
      );
    }

    const configJson =
      JSON.stringify(
        input.config,
      );

    const capabilitiesJson =
      JSON.stringify(
        input.capabilities ?? [],
      );

    const rows =
      await this.prisma.$queryRaw<
        Array<IntegrationRecord>
      >`
        INSERT INTO p16_external_integrations
          (
            tenant_id,
            provider,
            name,
            config_json,
            capabilities_json
          )
        VALUES
          (
            ${tenantId},
            ${input.provider},
            ${input.name.trim()},
            ${configJson},
            ${capabilitiesJson}
          )
        RETURNING
          id,
          tenant_id,
          provider,
          name,
          status,
          config_json,
          capabilities_json
      `;

    return rows[0];
  }

  async getIntegration(
    userId: string,
    tenantId: string,
    id: string,
  ): Promise<IntegrationRecord> {
    await this.assertTenantMember(
      userId,
      tenantId,
    );

    const rows =
      await this.prisma.$queryRaw<
        Array<IntegrationRecord>
      >`
        SELECT
          id,
          tenant_id,
          provider,
          name,
          status,
          config_json,
          capabilities_json
        FROM p16_external_integrations
        WHERE id = ${id}
          AND tenant_id = ${tenantId}
        LIMIT 1
      `;

    if (!rows[0]) {
      throw new NotFoundException(
        'Integration not found.',
      );
    }

    return rows[0];
  }

  async test(
    userId: string,
    tenantId: string,
    id: string,
  ) {
    const integration =
      await this.getIntegration(
        userId,
        tenantId,
        id,
      );

    if (
      integration.status ===
      'DISABLED'
    ) {
      throw new ConflictException(
        'Integration is disabled.',
      );
    }

    const adapter =
      this.registry.get(
        integration.provider,
      );

    return adapter.testConnection(
      integration,
    );
  }

  async importOnce(
    userId: string,
    tenantId: string,
    id: string,
  ) {
    const integration =
      await this.getIntegration(
        userId,
        tenantId,
        id,
      );

    if (
      integration.status ===
      'DISABLED'
    ) {
      throw new ConflictException(
        'Integration is disabled.',
      );
    }

    const adapter =
      this.registry.get(
        integration.provider,
      );

    const cursorRows =
      await this.prisma.$queryRaw<
        Array<{
          cursor: string | null;
        }>
      >`
        SELECT cursor
        FROM p16_sync_cursors
        WHERE integration_id = ${id}
          AND resource = 'default'
        LIMIT 1
      `;

    const cursor =
      cursorRows[0]?.cursor ??
      undefined;

    const pulled =
      await adapter.pull(
        integration,
        cursor,
      );

    let created = 0;
    let updated = 0;
    let rejected = 0;

    for (
      const record of
        pulled.records
    ) {
      if (
        record.source
          .integrationId !== id
      ) {
        rejected++;
        continue;
      }

      if (
        !record.source
          .recordId ||
        !record.entity?.type
      ) {
        rejected++;
        continue;
      }

      const checksum =
        checksumPayload(
          record.payload,
        );

      const existing =
        await this.prisma.$queryRaw<
          Array<{
            id: string;
            checksum: string;
          }>
        >`
          SELECT
            id,
            checksum
          FROM p16_external_records
          WHERE integration_id = ${id}
            AND external_record_id =
              ${record.source.recordId}
            AND external_type =
              ${record.entity.type}
          LIMIT 1
        `;

      if (!existing[0]) {
        await this.prisma.$executeRaw`
          INSERT INTO p16_external_records
            (
              integration_id,
              tenant_id,
              external_record_id,
              external_type,
              source_version,
              canonical_type,
              payload_json,
              checksum
            )
          VALUES
            (
              ${id},
              ${tenantId},
              ${record.source.recordId},
              ${record.entity.type},
              ${record.source.version ?? null},
              ${record.entity.type},
              ${JSON.stringify(record.payload)},
              ${checksum}
            )
        `;

        await this.prisma.$executeRaw`
          INSERT INTO p16_data_provenance
            (
              tenant_id,
              canonical_type,
              canonical_id,
              source_type,
              source_id,
              mapping_version,
              metadata_json
            )
          VALUES
            (
              ${tenantId},
              ${record.entity.type},
              ${record.source.recordId},
              ${record.source.provider},
              ${record.source.recordId},
              ${record.provenance.mappingVersion},
              ${JSON.stringify({
                integrationId: id,
              })}
            )
        `;

        created++;
        continue;
      }

      if (
        existing[0].checksum !==
        checksum
      ) {
        await this.prisma.$executeRaw`
          UPDATE p16_external_records
          SET
            source_version =
              ${record.source.version ?? null},
            payload_json =
              ${JSON.stringify(record.payload)},
            checksum =
              ${checksum},
            last_seen_at = NOW(),
            status = 'IMPORTED'
          WHERE id =
            ${existing[0].id}
            AND tenant_id =
            ${tenantId}
        `;

        updated++;
      } else {
        await this.prisma.$executeRaw`
          UPDATE p16_external_records
          SET last_seen_at = NOW()
          WHERE id =
            ${existing[0].id}
            AND tenant_id =
            ${tenantId}
        `;
      }
    }

    await this.prisma.$executeRaw`
      INSERT INTO p16_sync_cursors
        (
          integration_id,
          resource,
          cursor,
          last_synced_at
        )
      VALUES
        (
          ${id},
          'default',
          ${pulled.nextCursor ?? null},
          NOW()
        )
      ON CONFLICT
        (integration_id, resource)
      DO UPDATE SET
        cursor =
          EXCLUDED.cursor,
        last_synced_at =
          NOW()
    `;

    return {
      integrationId: id,
      received:
        pulled.records.length,
      created,
      updated,
      rejected,
      hasMore:
        pulled.hasMore,
      nextCursor:
        pulled.nextCursor ??
        null,
    };
  }

  async disable(
    userId: string,
    tenantId: string,
    id: string,
  ) {
    await this.getIntegration(
      userId,
      tenantId,
      id,
    );

    await this.prisma.$executeRaw`
      UPDATE p16_external_integrations
      SET status = 'DISABLED'
      WHERE id = ${id}
        AND tenant_id = ${tenantId}
    `;

    return {
      id,
      status: 'DISABLED',
    };
  }

  async listConflicts(
    userId: string,
    tenantId: string,
    integrationId?: string,
  ) {
    await this.assertTenantMember(
      userId,
      tenantId,
    );

    return this.prisma.$queryRaw`
      SELECT *
      FROM p16_integration_conflicts
      WHERE tenant_id = ${tenantId}
        AND (
          ${integrationId ?? null}::text IS NULL
          OR integration_id =
             ${integrationId ?? null}
        )
      ORDER BY created_at DESC
      LIMIT 200
    `;
  }

  async resolveConflict(
    userId: string,
    tenantId: string,
    conflictId: string,
    resolution:
      | 'KEEP_INTERNAL'
      | 'ACCEPT_EXTERNAL'
      | 'MERGE'
      | 'ESCALATE',
    resolutionJson?: unknown,
  ) {
    await this.assertTenantMember(
      userId,
      tenantId,
    );

    const rows =
      await this.prisma.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT id
        FROM p16_integration_conflicts
        WHERE id = ${conflictId}
          AND tenant_id = ${tenantId}
          AND status = 'OPEN'
        LIMIT 1
      `;

    if (!rows[0]) {
      throw new ConflictException(
        'Conflict is missing or already resolved.',
      );
    }

    await this.prisma.$executeRaw`
      UPDATE p16_integration_conflicts
      SET
        status = 'RESOLVED',
        resolution_json =
          ${JSON.stringify({
            resolution,
            data:
              resolutionJson ??
              null,
          })},
        resolved_by = ${userId},
        resolved_at = NOW()
      WHERE id = ${conflictId}
        AND tenant_id = ${tenantId}
        AND status = 'OPEN'
    `;

    return {
      id: conflictId,
      status: 'RESOLVED',
      resolution,
    };
  }
}
