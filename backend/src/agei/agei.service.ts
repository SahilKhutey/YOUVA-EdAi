import { Injectable } from '@nestjs/common';
import { PedagogicalCoreService } from './pedagogical-core/pedagogical-core.service';
import { CognitivePredictionService } from './cognitive-prediction/cognitive-prediction.service';
import { KnowledgeSynthesisService } from './knowledge-synthesis/knowledge-synthesis.service';

/**
 * The Master Controller for the Artificial General Education Intelligence (AGEI) system.
 * Orchestrates the different "brains" (Pedagogical, Cognitive, Synthesis).
 */
@Injectable()
export class AgeiService {
    constructor(
        private pedagogicalCore: PedagogicalCoreService,
        private cognitivePrediction: CognitivePredictionService,
        private knowledgeSynthesis: KnowledgeSynthesisService,
    ) { }

    // The master controller will act as the unified API for other domains 
    // (like Content Generation or Practice) to request AGEI interventions.
}
