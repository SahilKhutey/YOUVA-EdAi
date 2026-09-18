import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ElementaryLesson } from './early-childhood-types';

export interface ChallengeEvaluationResult {
  lessonId: string;
  isCorrect: boolean;
  childFriendlyFeedback: string;
  recommendedNextConcept?: string;
  bktMasteryDelta: number;
}

@Injectable()
export class ElementaryLearningService {
  private readonly logger = new Logger(ElementaryLearningService.name);
  private readonly lessons = new Map<string, ElementaryLesson>();

  constructor() {
    this.seedElementaryCurriculum();
  }

  private seedElementaryCurriculum(): void {
    const defaultLessons: ElementaryLesson[] = [
      // Mathematics
      {
        lessonId: 'ELE-MATH-01',
        title: 'Fractions with Pizza Slices',
        subject: 'MATHEMATICS',
        level: 2,
        concept: 'Equal parts of a whole (1/2 and 1/4)',
        interactiveChallenge: {
          prompt: 'If a pizza has 4 equal slices and Rohan eats 1 slice, what fraction did he eat?',
          options: ['1/4', '1/2', '3/4', '4/4'],
          expectedAnswer: '1/4',
        },
      },
      {
        lessonId: 'ELE-MATH-02',
        title: 'Multi-Digit Regrouping',
        subject: 'MATHEMATICS',
        level: 3,
        concept: 'Addition with carrying over tens',
        interactiveChallenge: {
          prompt: 'Calculate 38 + 25 using place-value regrouping.',
          options: ['53', '63', '65', '58'],
          expectedAnswer: '63',
        },
      },

      // Science
      {
        lessonId: 'ELE-SCI-01',
        title: 'Plant Photosynthesis & Sunlight',
        subject: 'SCIENCE',
        level: 2,
        concept: 'How green leaves make food using sunlight and water',
        interactiveChallenge: {
          prompt: 'What gas do green leaves take in from the air during the day to make food?',
          options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
          expectedAnswer: 'Carbon Dioxide',
        },
      },

      // Coding Foundations (Clause N13.46)
      {
        lessonId: 'ELE-CODE-01',
        title: 'Robot Navigation: Sequencing & Loops',
        subject: 'CODING_FOUNDATIONS',
        level: 2,
        concept: 'Algorithmic sequencing: Repeat 3 times [Step Forward]',
        interactiveChallenge: {
          prompt: 'To move the robot 3 steps forward, which block sequence is the most efficient?',
          codeSnippet: 'repeat(3) { moveForward(); }',
          options: [
            'repeat(3) { moveForward(); }',
            'moveForward(); turnRight();',
            'repeat(1) { moveBackward(); }',
          ],
          expectedAnswer: 'repeat(3) { moveForward(); }',
        },
      },
      {
        lessonId: 'ELE-CODE-02',
        title: 'Conditional Logic: If / Else Detective',
        subject: 'CODING_FOUNDATIONS',
        level: 3,
        concept: 'Branching logic: if (isObstacleAhead) { turnLeft(); }',
        interactiveChallenge: {
          prompt: 'What should the robot do when the sensor detects a wall in front?',
          options: [
            'turnLeft()',
            'crashForward()',
            'shutDownForever()',
          ],
          expectedAnswer: 'turnLeft()',
        },
      },

      // AI Literacy Foundations (Clauses N13.47 - N13.48)
      {
        lessonId: 'ELE-AI-01',
        title: 'Can Computers Make Mistakes?',
        subject: 'AI_LITERACY',
        level: 1,
        concept: 'Epistemic humility: Checking facts instead of assuming AI is always right',
        interactiveChallenge: {
          prompt: 'If an AI tutor says that penguins can fly to the moon, what is the best thing to do?',
          options: [
            'Believe it immediately because it came from a computer',
            'Ask an adult and check an encyclopedia together',
            'Tell your friends it must be true',
          ],
          expectedAnswer: 'Ask an adult and check an encyclopedia together',
        },
      },
    ];

    for (const l of defaultLessons) {
      this.lessons.set(l.lessonId, l);
    }
    this.logger.log(`Initialized Elementary Curriculum with ${this.lessons.size} interactive lessons.`);
  }

  listLessons(subject?: string): ElementaryLesson[] {
    let list = Array.from(this.lessons.values());
    if (subject) {
      list = list.filter(l => l.subject === subject);
    }
    return list;
  }

  getLesson(lessonId: string): ElementaryLesson {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Elementary lesson '${lessonId}' not found.`);
    }
    return lesson;
  }

  /**
   * Evaluates student challenge answer and returns child-safe, supportive feedback (Clause N13.10, N13.48).
   */
  evaluateChallenge(lessonId: string, childAnswer: string): ChallengeEvaluationResult {
    const lesson = this.getLesson(lessonId);
    const isCorrect = lesson.interactiveChallenge.expectedAnswer.trim().toLowerCase() === childAnswer.trim().toLowerCase();

    let feedback = '';
    let bktDelta = 0.0;

    if (isCorrect) {
      feedback = 'Wonderful thinking! You found the right answer through great reasoning.';
      bktDelta = 0.12;
    } else {
      feedback = 'Good try! Let us look at the clues together. Remember, learning happens when we explore mistakes!';
      bktDelta = 0.02; // Formative support, not punitive zeroing
    }

    return {
      lessonId,
      isCorrect,
      childFriendlyFeedback: feedback,
      bktMasteryDelta: bktDelta,
    };
  }
}
