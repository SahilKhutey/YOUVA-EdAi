import { Module } from '@nestjs/common';
import { AssessmentIntelligenceService } from './assessment-intelligence.service';
import { AssessmentIntelligenceController } from './assessment-intelligence.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { CredentialMeshModule } from '../credential-mesh/credential-mesh.module';

@Module({
    imports: [PrismaModule, AiModule, CredentialMeshModule],
    controllers: [AssessmentIntelligenceController],
    providers: [AssessmentIntelligenceService],
    exports: [AssessmentIntelligenceService],
})
export class AssessmentIntelligenceModule { }
