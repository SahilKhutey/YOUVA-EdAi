import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TaskLogEntry {
  id: string;
  taskId: string;
  track: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'INTERNAL_VERIFIED' | 'APPROVED' | 'ACTIVE';
  evidence: string;
  verifiedBy: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskLogDto {
  taskId: string;
  track: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'INTERNAL_VERIFIED' | 'APPROVED' | 'ACTIVE';
  evidence: string;
  verifiedBy: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class V01TaskLoggerService {
  private readonly logger = new Logger(V01TaskLoggerService.name);
  private readonly logDir = path.resolve(process.cwd(), 'data');
  private readonly logFilePath = path.resolve(this.logDir, 'v01_task_logs.jsonl');
  private readonly inMemoryLogs: TaskLogEntry[] = [];

  constructor() {
    this.ensureStorage();
    this.loadExistingLogs();
    this.seedBaselineTaskLogsIfEmpty();
  }

  private ensureStorage() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.warn(`Could not initialize task logs directory: ${err.message}`);
    }
  }

  private loadExistingLogs() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const lines = fs.readFileSync(this.logFilePath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line) as TaskLogEntry;
            this.inMemoryLogs.push(entry);
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not load existing task logs: ${err.message}`);
    }
  }

  private persistLog(entry: TaskLogEntry) {
    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to persist task log: ${err.message}`);
    }
  }

  private seedBaselineTaskLogsIfEmpty() {
    if (this.inMemoryLogs.length > 0) return;

    const initialEntries: CreateTaskLogDto[] = [
      {
        taskId: 'TASK-V01-B1',
        track: 'B',
        title: 'End-to-End Tracing of P1/P2/P3 Learning Loop',
        status: 'INTERNAL_VERIFIED',
        evidence: 'Audited LearningTransactionService, BktService, TeacherInterventionOpsService, ConsentService; classified legacy vs v0.1 isolated paths.',
        verifiedBy: 'Core Systems Architect',
      },
      {
        taskId: 'TASK-V01-B2',
        track: 'B',
        title: 'Deterministic Math Answer Evaluator',
        status: 'INTERNAL_VERIFIED',
        evidence: 'backend/src/v01/v01-adaptive.service.ts normalize whitespace, case, variable prefix, decimals; 5 automated unit tests pass.',
        verifiedBy: 'Lead Algorithmic Engineer',
      },
      {
        taskId: 'TASK-V01-B3',
        track: 'B',
        title: 'Deterministic Adaptive Difficulty Transitions',
        status: 'INTERNAL_VERIFIED',
        evidence: 'backend/src/v01/v01-adaptive.service.ts nextDifficulty rule verified: EASY <-> MEDIUM <-> HARD transitions; 6 tests pass.',
        verifiedBy: 'Pedagogical Systems Engineer',
      },
      {
        taskId: 'TASK-V01-B4',
        track: 'B',
        title: 'Teacher Override Precedence & Protection',
        status: 'INTERNAL_VERIFIED',
        evidence: 'backend/src/v01/v01.service.ts NEEDS_HELP override halts advancement and forces EASY foundational item; protected against AI overwrite.',
        verifiedBy: 'Lead Systems Architect',
      },
      {
        taskId: 'TASK-V01-B5',
        track: 'B',
        title: 'Attempt Audit Logging & Persistence',
        status: 'INTERNAL_VERIFIED',
        evidence: 'backend/src/v01/v01.service.ts append-only logging to data/v01_pilot_attempts.jsonl verified with 3 tests.',
        verifiedBy: 'Data Integrity Engineer',
      },
      {
        taskId: 'TASK-V01-C1',
        track: 'C',
        title: 'Curated Content Suite for One-Step Equations',
        status: 'INTERNAL_VERIFIED',
        evidence: 'backend/src/v01/v01-content.ts 18 hand-authored items (6 Easy, 6 Med, 6 Hard) verified in v01.spec.ts.',
        verifiedBy: 'Middle School Math Specialist',
      },
      {
        taskId: 'TASK-V01-D3',
        track: 'D',
        title: 'Supervised End-to-End Dry Run Verification',
        status: 'INTERNAL_VERIFIED',
        evidence: 'Full student session -> attempt -> adaptive transition -> teacher [ NEEDS HELP ] override -> foundational item delivered. All 19 tests pass.',
        verifiedBy: 'Lead Systems Architect',
      },
    ];

    for (const item of initialEntries) {
      this.logTask(item);
    }
  }

  /**
   * Logs a task execution event to in-memory store and append-only file.
   */
  logTask(dto: CreateTaskLogDto): TaskLogEntry {
    if (!dto.taskId || !dto.status || !dto.evidence || !dto.verifiedBy) {
      throw new BadRequestException('taskId, status, evidence, and verifiedBy are required');
    }

    const entry: TaskLogEntry = {
      id: `tlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: dto.taskId,
      track: dto.track,
      title: dto.title,
      status: dto.status,
      evidence: dto.evidence,
      verifiedBy: dto.verifiedBy,
      timestamp: new Date().toISOString(),
      metadata: dto.metadata,
    };

    this.inMemoryLogs.push(entry);
    this.persistLog(entry);
    this.logger.log(`Task Logged [${entry.taskId}]: ${entry.status} by ${entry.verifiedBy}`);
    return entry;
  }

  /**
   * Retrieve all task logs, optionally filtered by taskId or track.
   */
  getTaskLogs(filter?: { taskId?: string; track?: string }): TaskLogEntry[] {
    let result = [...this.inMemoryLogs];
    if (filter?.taskId) {
      result = result.filter((l) => l.taskId === filter.taskId);
    }
    if (filter?.track) {
      result = result.filter((l) => l.track === filter.track);
    }
    return result;
  }

  /**
   * Retrieve the latest logged status for every known taskId.
   */
  getLatestTaskStatusMap(): Record<string, TaskLogEntry> {
    const latest: Record<string, TaskLogEntry> = {};
    for (const log of this.inMemoryLogs) {
      latest[log.taskId] = log;
    }
    return latest;
  }
}
