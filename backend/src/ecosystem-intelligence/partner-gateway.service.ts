import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  EcosystemPartner,
  PartnerType,
  PartnerStatus,
  PartnerScope,
} from './n21-types';

@Injectable()
export class PartnerGatewayService {
  private partners: Map<string, EcosystemPartner> = new Map();
  private apiKeyIndex: Map<string, string> = new Map(); // apiKeyHash -> partnerId

  constructor() {
    this.seedInitialPartners();
  }

  private seedInitialPartners(): void {
    const seeds: Partial<EcosystemPartner>[] = [
      {
        partnerId: 'partner-dps-01',
        organizationId: 'org-dps-rkp',
        name: 'Delhi Public School R.K. Puram',
        partnerType: 'INSTITUTION',
        status: 'ACTIVE',
        scopes: ['READ_SHARED_EVIDENCE', 'SUBMIT_EVIDENCE', 'ACCESS_AGGREGATE_ANALYTICS'],
      },
      {
        partnerId: 'partner-mit-02',
        organizationId: 'org-mit-ccs',
        name: 'MIT Center for Computational Science',
        partnerType: 'ISSUER',
        status: 'ACTIVE',
        scopes: ['SUBMIT_EVIDENCE', 'VERIFY_CREDENTIAL'],
      },
      {
        partnerId: 'partner-zk-03',
        organizationId: 'org-zk-foundation',
        name: 'Zero-Knowledge Cryptography Research Foundation',
        partnerType: 'OPPORTUNITY_PROVIDER',
        status: 'ACTIVE',
        scopes: ['PUBLISH_OPPORTUNITY', 'VERIFY_CREDENTIAL'],
      },
    ];

    for (const s of seeds) {
      const mockKey = `sec_key_${s.partnerId}`;
      const hash = this.hashApiKey(mockKey);
      const partner: EcosystemPartner = {
        partnerId: s.partnerId!,
        organizationId: s.organizationId!,
        name: s.name!,
        partnerType: s.partnerType!,
        status: s.status!,
        scopes: s.scopes || [],
        apiKeyHash: hash,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.partners.set(partner.partnerId, partner);
      this.apiKeyIndex.set(hash, partner.partnerId);
    }
  }

  public registerPartner(dto: {
    organizationId: string;
    name: string;
    partnerType: PartnerType;
    scopes: PartnerScope[];
  }): { partner: EcosystemPartner; rawApiKey: string } {
    if (!dto.organizationId || !dto.name || !dto.partnerType) {
      throw new BadRequestException('organizationId, name, and partnerType are required');
    }

    // Prohibit wildcard scopes (Clause N21.23 - N21.24)
    if (dto.scopes.some((s: any) => s === '*' || s === 'ALL')) {
      throw new BadRequestException('Wildcard scopes are strictly prohibited. Least privilege required.');
    }

    const partnerId = `partner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const rawApiKey = `youva_live_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = this.hashApiKey(rawApiKey);

    const partner: EcosystemPartner = {
      partnerId,
      organizationId: dto.organizationId,
      name: dto.name,
      partnerType: dto.partnerType,
      status: 'APPLIED',
      scopes: dto.scopes,
      apiKeyHash,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.partners.set(partnerId, partner);
    this.apiKeyIndex.set(apiKeyHash, partnerId);

    return { partner, rawApiKey };
  }

  public getPartner(partnerId: string): EcosystemPartner {
    const p = this.partners.get(partnerId);
    if (!p) {
      throw new NotFoundException(`Ecosystem Partner ${partnerId} not found`);
    }
    return p;
  }

  public listPartners(type?: PartnerType, status?: PartnerStatus): EcosystemPartner[] {
    let list = Array.from(this.partners.values());
    if (type) list = list.filter((p) => p.partnerType === type);
    if (status) list = list.filter((p) => p.status === status);
    return list;
  }

  public updatePartnerStatus(partnerId: string, status: PartnerStatus): EcosystemPartner {
    const p = this.getPartner(partnerId);
    p.status = status;
    p.updatedAt = new Date().toISOString();
    this.partners.set(partnerId, p);
    return p;
  }

  public verifyPartnerAccess(rawApiKey: string, requiredScope: PartnerScope): EcosystemPartner {
    const hash = this.hashApiKey(rawApiKey);
    const partnerId = this.apiKeyIndex.get(hash);
    if (!partnerId) {
      throw new ForbiddenException('Invalid or unknown Ecosystem API key');
    }

    const partner = this.getPartner(partnerId);
    if (partner.status !== 'ACTIVE') {
      throw new ForbiddenException(`Partner ${partner.name} is not in ACTIVE status (current: ${partner.status})`);
    }

    if (!partner.scopes.includes(requiredScope)) {
      throw new ForbiddenException(`Partner ${partner.name} lacks required scope: ${requiredScope}`);
    }

    return partner;
  }

  // Clause N21.128 - N21.129: Partner Offboarding
  public offboardPartner(partnerId: string, reason: string): {
    partnerId: string;
    status: PartnerStatus;
    credentialsPreserved: boolean;
    auditPreserved: boolean;
    declaration: string;
  } {
    const partner = this.getPartner(partnerId);
    partner.status = 'OFFBOARDED';
    partner.updatedAt = new Date().toISOString();

    // Revoke API key mapping
    this.apiKeyIndex.delete(partner.apiKeyHash);

    // Clause N21.129: Learner credentials are never invalidated by partner departure!
    return {
      partnerId,
      status: 'OFFBOARDED',
      credentialsPreserved: true,
      auditPreserved: true,
      declaration: `Partner ${partner.name} offboarded (${reason}). API access revoked. Learner-owned credentials and audit records remain fully valid.`,
    };
  }

  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
