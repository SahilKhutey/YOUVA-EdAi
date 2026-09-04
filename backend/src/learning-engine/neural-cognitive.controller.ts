import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { NeuralCognitiveService } from './services/neural-cognitive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cognitive-state')
@UseGuards(JwtAuthGuard)
export class NeuralCognitiveController {
    constructor(private readonly neuralCognitiveService: NeuralCognitiveService) { }

    @Post('log')
    async logState(@Req() req: any, @Body() data: any) {
        return this.neuralCognitiveService.logCognitiveState(req.user.id, data);
    }

    @Post('hebbian-transfer')
    async logTransfer(@Req() req: any, @Body() body: { sourceId: string; targetId: string; success: boolean }) {
        return this.neuralCognitiveService.updateHebbianConnection(
            req.user.id,
            body.sourceId,
            body.targetId,
            body.success
        );
    }
}
