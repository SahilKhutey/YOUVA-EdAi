import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import { TelemetryEventType } from './telemetry.constants';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    service.clearEvents();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should deterministically pseudonymize student ID matching Phase 3 salt format', () => {
    const id1 = 's-dps-101';
    const anon1 = service.pseudonymize(id1);
    const anon2 = service.pseudonymize(id1);

    expect(anon1).toMatch(/^anon_[a-f0-9]{8}$/);
    expect(anon1).toBe(anon2); // Deterministic

    const id2 = 's-dps-102';
    const anon3 = service.pseudonymize(id2);
    expect(anon3).not.toBe(anon1); // Unique per student
  });

  it('should emit events and scrub PII from payload', () => {
    const event = service.emitEvent({
      eventType: TelemetryEventType.PRACTICE_ITEM_PRESENTED,
      sessionId: 'sess-test-01',
      studentId: 's-dps-105',
      cohortId: 'PILOT-DPS-RKP-2026-Q3',
      payload: {
        topicId: 'linear-equations',
        email: 'leaked.student@dpsrkp.edu.in', // Should be scrubbed!
        name: 'Aarav Sharma', // Should be scrubbed!
        targetDifficulty: 0.55,
      },
    });

    expect(event.pseudonymizedStudentId).toMatch(/^anon_[a-f0-9]{8}$/);
    expect(event.payload.email).toBeUndefined();
    expect(event.payload.name).toBeUndefined();
    expect(event.payload.targetDifficulty).toBe(0.55);

    const exported = service.exportCohortTelemetry('PILOT-DPS-RKP-2026-Q3');
    expect(exported.totalEvents).toBe(1);
    expect(exported.events[0].eventId).toBe(event.eventId);
  });
});
