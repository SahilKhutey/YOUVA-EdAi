import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { IncidentManagerService, IncidentSeverity, IncidentState } from './incident/incident-manager.service';
import { AlertManagerService } from './incident/alert-manager.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { DrVerificationService } from './dr/dr-verification.service';

@Controller('api/reliability')
export class ReliabilityController {
  constructor(
    private readonly incidentManager: IncidentManagerService,
    private readonly alertManager: AlertManagerService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly drVerification: DrVerificationService,
  ) {}

  @Get('incidents')
  listIncidents() {
    return this.incidentManager.listIncidents();
  }

  @Post('incidents')
  declareIncident(
    @Body()
    body: {
      title: string;
      description: string;
      severity: IncidentSeverity;
      actor?: string;
    },
  ) {
    return this.incidentManager.declareIncident(body);
  }

  @Patch('incidents/:id/transition')
  transitionIncident(
    @Param('id') id: string,
    @Body() body: { nextState: IncidentState; note: string; actor: string },
  ) {
    return this.incidentManager.transitionState(id, body.nextState, body.note, body.actor);
  }

  @Get('alerts')
  listAlerts() {
    return this.alertManager.getActiveAlerts();
  }

  @Get('circuit-breakers')
  listCircuitBreakers() {
    return this.circuitBreaker.getAllCircuitStates();
  }

  @Post('dr/drill')
  async runDrill() {
    const sampleTables = {
      users: [{ id: 'u1', name: 'Student 1' }],
      mastery: [{ id: 'm1', score: 0.95 }],
      audit: [{ id: 'a1', action: 'INIT' }],
    };
    const backup = this.drVerification.createBackupSnapshot(sampleTables);
    return this.drVerification.runDrVerificationDrill(backup);
  }
}
