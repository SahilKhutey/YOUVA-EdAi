import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class VerificationLedgerService {
    constructor(private prisma: PrismaService) { }

    /**
     * Publicly verifiable endpoint for employers to check a credential's validity.
     * Crucially, this strips out Personally Identifiable Information (PII) 
     * unless explicitly authorized, returning only a verifiable hash of the identity.
     */
    async verifyCredential(blockchainHash: string) {
        const credential = await this.prisma.skillCredential.findUnique({
            where: { blockchainHash },
            include: {
                skillNode: {
                    select: {
                        name: true,
                        type: true,
                        domain: true,
                    }
                },
                user: {
                    select: {
                        id: true, // Only used to generate anonymous identity hash
                    }
                }
            }
        });

        if (!credential) {
            throw new NotFoundException('Invalid credential hash or credential does not exist on the mesh.');
        }

        // Generate an anonymous identity hash to protect the user's real ID/Email
        const anonymousIdentityHash = crypto.createHash('sha256').update(credential.user.id).digest('hex');

        return {
            isValid: true,
            credentialData: {
                anonymousIdentityHash: anonymousIdentityHash,
                skill: credential.skillNode,
                validationScore: credential.validationScore,
                cognitiveDepthRating: credential.cognitiveDepthRating,
                aiSignature: credential.aiSignature,
                institutionSignature: credential.institutionSignature,
                issuedAt: credential.issuedAt,
                expiresAt: credential.expiresAt,
                issuerId: credential.issuerId,
            },
            verificationMetadata: {
                checkedAt: new Date(),
                ledgerStatus: 'IMMUTABLE_SYNCED'
            }
        };
    }
}
