import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CredentialMeshService } from './credential-mesh.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('credential-mesh')
@UseGuards(JwtAuthGuard)
export class CredentialMeshController {
    constructor(private readonly credentialMeshService: CredentialMeshService) { }

    @Get('my-credentials')
    async getMyCredentials(@Req() req: any) {
        return this.credentialMeshService.getStudentCredentials(req.user.id);
    }
}
