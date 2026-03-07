import { Module } from '@nestjs/common';
import { CredentialMeshService } from './credential-mesh.service';
import { CredentialMeshController } from './credential-mesh.controller';
import { VerificationLedgerService } from './verification-ledger.service';
import { GlobalVerificationController } from './global-verification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';

@Module({
    imports: [PrismaModule, KnowledgeGraphModule],
    controllers: [CredentialMeshController, GlobalVerificationController],
    providers: [CredentialMeshService, VerificationLedgerService],
    exports: [CredentialMeshService, VerificationLedgerService],
})
export class CredentialMeshModule { }
