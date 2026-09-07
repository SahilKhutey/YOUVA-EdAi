import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
} from 'axios';

import {
  assertSafeExternalUrl,
} from './p16.security';

import {
  CanonicalExternalRecord,
  ExternalIntegrationAdapter,
  IntegrationConfig,
  IntegrationRecord,
  PullResult,
} from './p16.types';

interface RemoteEnvelope {
  records?: CanonicalExternalRecord[];
  nextCursor?: string;
  hasMore?: boolean;
}

@Injectable()
export class RestJsonAdapter
  implements ExternalIntegrationAdapter
{
  readonly provider = 'REST_JSON';

  private readonly allowedHosts: string[];

  constructor(
    private readonly config: ConfigService,
  ) {
    this.allowedHosts = (
      config.get<string>(
        'P16_ALLOWED_HOSTS',
      ) || ''
    )
      .split(',')
      .map((value) =>
        value.trim().toLowerCase(),
      )
      .filter(Boolean);
  }

  private getConfig(
    integration: IntegrationRecord,
  ): IntegrationConfig {
    if (!integration.config_json) {
      throw new Error(
        'Integration configuration is missing.',
      );
    }

    const parsed =
      JSON.parse(
        integration.config_json,
      ) as IntegrationConfig;

    if (!parsed.baseUrl) {
      throw new Error(
        'Integration baseUrl is required.',
      );
    }

    return parsed;
  }

  private client(
    integration: IntegrationRecord,
  ): AxiosInstance {
    const cfg =
      this.getConfig(integration);

    const baseUrl =
      assertSafeExternalUrl(
        cfg.baseUrl,
        this.allowedHosts,
      );

    return axios.create({
      baseURL: baseUrl
        .toString()
        .replace(/\/$/, ''),

      timeout: Math.min(
        Math.max(
          cfg.timeoutMs ?? 10000,
          1000,
        ),
        30000,
      ),

      maxContentLength:
        2 * 1024 * 1024,

      maxBodyLength:
        2 * 1024 * 1024,

      headers: {
        'content-type':
          'application/json',
        'user-agent':
          'YOUVA-P16/1.0',
      },

      validateStatus: (status) =>
        status >= 200 &&
        status < 300,
    });
  }

  async testConnection(
    integration: IntegrationRecord,
  ) {
    const cfg =
      this.getConfig(integration);

    const client =
      this.client(integration);

    await client.get(
      cfg.pullPath || '/health',
    );

    return {
      success: true,
      message:
        'Connection successful.',
    };
  }

  async pull(
    integration: IntegrationRecord,
    cursor?: string,
  ): Promise<PullResult> {
    const cfg =
      this.getConfig(integration);

    const client =
      this.client(integration);

    const response =
      await client.get<RemoteEnvelope>(
        cfg.pullPath || '/records',
        {
          params: cursor
            ? { cursor }
            : undefined,
        },
      );

    const body =
      response.data || {};

    if (
      !Array.isArray(body.records)
    ) {
      throw new Error(
        'Provider response.records must be an array.',
      );
    }

    return {
      records: body.records,
      nextCursor:
        body.nextCursor,
      hasMore:
        Boolean(body.hasMore),
    };
  }

  async push(
    integration: IntegrationRecord,
    records: CanonicalExternalRecord[],
  ) {
    const cfg =
      this.getConfig(integration);

    const client =
      this.client(integration);

    const response =
      await client.post(
        cfg.pushPath || '/records',
        { records },
      );

    const body =
      response.data as {
        accepted?: number;
        rejected?: number;
      };

    return {
      accepted: Number(
        body.accepted ??
          records.length,
      ),
      rejected: Number(
        body.rejected ?? 0,
      ),
    };
  }
}
