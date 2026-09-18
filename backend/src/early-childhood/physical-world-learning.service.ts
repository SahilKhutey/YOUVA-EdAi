import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PhysicalTaskCompletion {
  completionId: string;
  learnerId: string;
  activityId: string;
  completedAt: string;
  confirmedBy: 'PARENT' | 'CHILD_VOICE' | 'TEACHER';
  childVerbalResponse?: string;
  notes?: string;
  learningReward: string; // e.g. "Earned Star Explorer badge for finding 3 round objects"
}

@Injectable()
export class PhysicalWorldLearningService {
  private readonly logger = new Logger(PhysicalWorldLearningService.name);
  private readonly physicalTasks = [
    {
      taskId: 'PHYS-01',
      title: 'Find Three Round Objects',
      spokenPrompt: 'Time to stretch! Can you look around your room and find three round things like a ball, a coin, or a clock?',
      objective: 'Connecting abstract 2D circles to 3D physical objects',
    },
    {
      taskId: 'PHYS-02',
      title: 'Block Tower Counting',
      spokenPrompt: 'Let us step away from the screen! Build a tower using toy blocks, count how many blocks high it is, and tell me!',
      objective: 'Spatial balance and 1-to-1 physical counting',
    },
    {
      taskId: 'PHYS-03',
      title: 'Leaf Texture Collector',
      spokenPrompt: 'With a grown-up, step outside and find two different leaves. Feel their surfaces: is one smooth and one bumpy?',
      objective: 'Sensory tactile exploration and natural science observation',
    },
  ];

  private readonly completions = new Map<string, PhysicalTaskCompletion>();

  getRandomPhysicalTask(): { taskId: string; title: string; spokenPrompt: string; objective: string } {
    const idx = Math.floor(Math.random() * this.physicalTasks.length);
    return this.physicalTasks[idx];
  }

  getTask(taskId: string) {
    const task = this.physicalTasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new NotFoundException(`Physical task '${taskId}' not found.`);
    }
    return task;
  }

  /**
   * Records off-screen physical task completion (Clauses N13.43 - N13.45).
   */
  recordTaskCompletion(params: {
    learnerId: string;
    taskId: string;
    confirmedBy: 'PARENT' | 'CHILD_VOICE' | 'TEACHER';
    childVerbalResponse?: string;
    notes?: string;
  }): PhysicalTaskCompletion {
    const task = this.getTask(params.taskId);
    const completionId = `phys-comp-${crypto.randomUUID()}`;

    const record: PhysicalTaskCompletion = {
      completionId,
      learnerId: params.learnerId,
      activityId: task.taskId,
      completedAt: new Date().toISOString(),
      confirmedBy: params.confirmedBy,
      childVerbalResponse: params.childVerbalResponse,
      notes: params.notes,
      learningReward: `Great work on "${task.title}" away from the screen!`,
    };

    this.completions.set(completionId, record);
    this.logger.log(`Physical task ${task.taskId} completed by ${params.learnerId} (Confirmed by ${params.confirmedBy})`);
    return record;
  }

  listLearnerCompletions(learnerId: string): PhysicalTaskCompletion[] {
    return Array.from(this.completions.values()).filter(c => c.learnerId === learnerId);
  }
}
