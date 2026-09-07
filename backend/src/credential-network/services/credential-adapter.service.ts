import { Injectable } from '@nestjs/common';
import {
  PortableCredential,
  CredentialExporter,
} from '../types/credential.types';

@Injectable()
export class OpenBadgeExporter implements CredentialExporter {
  readonly format = 'OPEN_BADGES_V2';

  export(credential: any): PortableCredential {
    let skills: string[] = [];
    try {
      skills = JSON.parse(credential.skillIdsJson || '[]');
    } catch {
      skills = [];
    }

    return {
      format: this.format,
      version: '2.0',
      credentialId: credential.id,
      achievement: {
        name: credential.title,
        description: credential.description ?? undefined,
        skills,
      },
      issuer: {
        id: credential.issuerId ?? undefined,
        name: credential.issuerName ?? 'YOUVA Learning Network',
      },
      verification: {
        level: credential.verificationLevel,
        status: credential.status,
      },
      issuedAt: credential.issuedAt ? new Date(credential.issuedAt).toISOString() : undefined,
      expiresAt: credential.expiresAt ? new Date(credential.expiresAt).toISOString() : undefined,
    };
  }
}

@Injectable()
export class CredentialAdapterService {
  constructor(private readonly openBadgeExporter: OpenBadgeExporter) {}

  /**
   * Translates an internal credential model into an external portable format.
   */
  export(credential: any, format = 'OPEN_BADGES_V2'): PortableCredential {
    if (format === 'OPEN_BADGES_V2') {
      return this.openBadgeExporter.export(credential);
    }

    // Default fallback
    return this.openBadgeExporter.export(credential);
  }
}
