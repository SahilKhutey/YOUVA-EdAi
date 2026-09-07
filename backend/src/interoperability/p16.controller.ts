import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import {
  InteroperabilityService,
} from './p16.service';

import {
  IntegrationAdapterRegistry,
} from './p16.registry';

import {
  RestJsonAdapter,
} from './p16.rest-json.adapter';

import {
  assertPrivileged,
} from './p16.security';

interface RequestWithUser {
  user: {
    userId: string;
    role: string;
  };
}

@Controller(
  'api/v1/interoperability',
)
@UseGuards(AuthGuard('jwt'))
export class InteroperabilityController {
  constructor(
    private readonly service:
      InteroperabilityService,

    private readonly registry:
      IntegrationAdapterRegistry,

    private readonly restAdapter:
      RestJsonAdapter,
  ) {
    if (
      !this.registry.has(
        this.restAdapter.provider,
      )
    ) {
      this.registry.register(
        this.restAdapter,
      );
    }
  }

  private tenant(
    headers: Record<
      string,
      string | undefined
    >,
  ): string {
    const tenantId =
      headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error(
        'x-tenant-id header is required.',
      );
    }

    return tenantId;
  }

  @Post('tenants')
  createTenant(
    @Req()
    req: RequestWithUser,
    @Body()
    body: { name: string },
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.createTenant(
      req.user.userId,
      body.name,
    );
  }

  @Post(
    'tenants/:tenantId/members',
  )
  addMember(
    @Req()
    req: RequestWithUser,

    @Param('tenantId')
    tenantId: string,

    @Body()
    body: {
      userId: string;
      role:
        | 'ADMIN'
        | 'TEACHER';
    },
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.addMember(
      req.user.userId,
      tenantId,
      body.userId,
      body.role,
    );
  }

  @Post('integrations')
  createIntegration(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,

    @Body()
    body: {
      provider: string;
      name: string;
      config: {
        baseUrl: string;
        pullPath?: string;
        pushPath?: string;
        timeoutMs?: number;
        mappingVersion?: number;
      };
      capabilities?: string[];
    },
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.createIntegration(
      req.user.userId,
      this.tenant(headers),
      body,
    );
  }

  @Get('integrations/:id/test')
  test(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,

    @Param('id')
    id: string,
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.test(
      req.user.userId,
      this.tenant(headers),
      id,
    );
  }

  @Post(
    'integrations/:id/import',
  )
  importOnce(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,

    @Param('id')
    id: string,
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.importOnce(
      req.user.userId,
      this.tenant(headers),
      id,
    );
  }

  @Post(
    'integrations/:id/disable',
  )
  disable(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,

    @Param('id')
    id: string,
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.disable(
      req.user.userId,
      this.tenant(headers),
      id,
    );
  }

  @Get('conflicts')
  conflicts(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.listConflicts(
      req.user.userId,
      this.tenant(headers),
    );
  }

  @Put(
    'conflicts/:id',
  )
  resolveConflict(
    @Req()
    req: RequestWithUser,

    @Headers()
    headers: Record<
      string,
      string | undefined
    >,

    @Param('id')
    id: string,

    @Body()
    body: {
      resolution:
        | 'KEEP_INTERNAL'
        | 'ACCEPT_EXTERNAL'
        | 'MERGE'
        | 'ESCALATE';

      data?: unknown;
    },
  ) {
    assertPrivileged(
      req.user.role,
    );

    return this.service.resolveConflict(
      req.user.userId,
      this.tenant(headers),
      id,
      body.resolution,
      body.data,
    );
  }
}
