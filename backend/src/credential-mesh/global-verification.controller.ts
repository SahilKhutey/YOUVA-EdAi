import { Controller, Get, Param } from '@nestjs/common';
import { VerificationLedgerService } from './verification-ledger.service';

@Controller('global-verification')
export class GlobalVerificationController {
    constructor(private readonly verificationLedgerService: VerificationLedgerService) { }

    /**
     * Public endpoint for global credential verification natively without authentication.
     * Usage: GET /global-verification/:hash
     */
    @Get(':hash')
    async verifyCredentialHash(@Param('hash') hash: string) {
        return this.verificationLedgerService.verifyCredential(hash);
    }
}
