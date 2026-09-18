import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PreschoolActivity } from './early-childhood-types';

export interface InteractiveStoryState {
  storyId: string;
  learnerId: string;
  title: string;
  currentStep: 'CHARACTER' | 'PROBLEM' | 'EXPLORATION' | 'CHOICE' | 'CONSEQUENCE' | 'CONCEPT' | 'REFLECTION';
  narrativeText: string;
  audioPromptUrl?: string;
  choices?: Array<{ id: string; text: string; visualIcon: string }>;
  conceptLearned?: string;
  isComplete: boolean;
}

@Injectable()
export class PreschoolLearningService {
  private readonly logger = new Logger(PreschoolLearningService.name);
  private readonly activities = new Map<string, PreschoolActivity>();
  private readonly activeStories = new Map<string, InteractiveStoryState>();

  constructor() {
    this.seedPreschoolCurriculum();
  }

  private seedPreschoolCurriculum(): void {
    const defaultActivities: PreschoolActivity[] = [
      // Literacy
      {
        activityId: 'PRE-LIT-01',
        title: 'Letter Sounds Safari',
        domain: 'LITERACY',
        description: 'Match animal phonics sounds with their beginning letters.',
        visualCue: '🦁 🐘 🐒',
        interactionType: 'VOICE',
        learningObjective: 'Phonemic awareness: initial consonant sounds /b/, /m/, /s/',
        isPhysicalWorldTask: false,
      },
      {
        activityId: 'PRE-LIT-02',
        title: 'Rhyme Rhyme Time',
        domain: 'LITERACY',
        description: 'Listen and tap the word that rhymes with Cat (Bat, Hat, Mat).',
        visualCue: '🐱 🦇 🎩',
        interactionType: 'TOUCH_CHOICE',
        learningObjective: 'Rhyme recognition and phonological awareness',
        isPhysicalWorldTask: false,
      },

      // Numeracy
      {
        activityId: 'PRE-NUM-01',
        title: 'Count the Friendly Apples',
        domain: 'NUMERACY',
        description: 'Count apples on the tree and tap the matching number basket.',
        visualCue: '🍎 🍎 🍎',
        interactionType: 'TOUCH_CHOICE',
        learningObjective: '1-to-1 correspondence and counting up to 5',
        isPhysicalWorldTask: false,
      },
      {
        activityId: 'PRE-NUM-02',
        title: 'Shape Detective: Spot the Circles',
        domain: 'NUMERACY',
        description: 'Spot round circles in a busy playground picture.',
        visualCue: '⭕ ⚽ 🍩',
        interactionType: 'VOICE',
        learningObjective: 'Geometric shape identification: circles vs squares',
        isPhysicalWorldTask: false,
      },

      // Movement & Physical
      {
        activityId: 'PRE-MOVE-01',
        title: 'Frog Hop Counting',
        domain: 'MOVEMENT',
        description: 'Stand up and hop 3 times like a friendly green frog!',
        visualCue: '🐸 🦘',
        interactionType: 'PHYSICAL_TASK',
        learningObjective: 'Gross motor coordination linked to counting numbers',
        isPhysicalWorldTask: true,
      },

      // SEL (Strictly Educational & Non-Diagnostic)
      {
        activityId: 'PRE-SEL-01',
        title: 'The Calm Breathing Teddy',
        domain: 'SEL',
        description: 'Breathe in slowly with Teddy and blow out gently like blowing bubbles.',
        visualCue: '🧸 🫧',
        interactionType: 'PHYSICAL_TASK',
        learningObjective: 'Emotional self-regulation and body calming techniques',
        isPhysicalWorldTask: true,
      },
    ];

    for (const act of defaultActivities) {
      this.activities.set(act.activityId, act);
    }
    this.logger.log(`Initialized Pre-School Curriculum with ${this.activities.size} play-based activities.`);
  }

  listActivities(domain?: string): PreschoolActivity[] {
    let list = Array.from(this.activities.values());
    if (domain) {
      list = list.filter(a => a.domain === domain);
    }
    return list;
  }

  getActivity(activityId: string): PreschoolActivity {
    const act = this.activities.get(activityId);
    if (!act) {
      throw new NotFoundException(`Preschool activity '${activityId}' not found.`);
    }
    return act;
  }

  /**
   * Starts an interactive story framework session (Clause N13.21).
   * Framework: Character -> Problem -> Exploration -> Choice -> Consequence -> Concept -> Reflection.
   */
  startInteractiveStory(learnerId: string, storyTitle: string = 'The Lost Star in the Forest'): InteractiveStoryState {
    const storyId = `story-${crypto.randomUUID()}`;
    const state: InteractiveStoryState = {
      storyId,
      learnerId,
      title: storyTitle,
      currentStep: 'CHARACTER',
      narrativeText: 'Meet Pip the friendly little hedgehog who loves exploring under the giant oak trees.',
      choices: [
        { id: 'c1', text: 'Help Pip look up at the tree branches', visualIcon: '🌳' },
        { id: 'c2', text: 'Follow the gentle sparkling lights near the brook', visualIcon: '💧' },
      ],
      isComplete: false,
    };

    this.activeStories.set(storyId, state);
    this.logger.log(`Started interactive story ${storyId} for learner ${learnerId}`);
    return state;
  }

  advanceStory(storyId: string, selectedChoiceId: string): InteractiveStoryState {
    const story = this.activeStories.get(storyId);
    if (!story) {
      throw new NotFoundException(`Story session '${storyId}' not found.`);
    }

    if (story.currentStep === 'CHARACTER') {
      story.currentStep = 'PROBLEM';
      story.narrativeText = 'Pip hears a tiny peep! A baby squirrel is trying to carry three big acorns but can only hold two.';
      story.choices = [
        { id: 'p1', text: 'Offer to carry one acorn for the baby squirrel', visualIcon: '🌰' },
        { id: 'p2', text: 'Show the squirrel how to roll the acorns together', visualIcon: '🤝' },
      ];
    } else if (story.currentStep === 'PROBLEM') {
      story.currentStep = 'EXPLORATION';
      story.narrativeText = 'Working together, Pip and the squirrel count the acorns: One! Two! Three! Sharing made the job easy.';
      story.choices = [
        { id: 'e1', text: 'Continue along the pebble path', visualIcon: '🚶' },
      ];
    } else if (story.currentStep === 'EXPLORATION') {
      story.currentStep = 'CONCEPT';
      story.conceptLearned = 'Cooperation & Counting Sets of 3';
      story.currentStep = 'REFLECTION';
      story.narrativeText = 'Pip felt warm and happy inside. "When we share, everyone has enough!" What made you smile today?';
      story.isComplete = true;
      story.choices = undefined;
    }

    return story;
  }

  evaluatePhonicsSafari(spokenWord: string, targetPhoneme: string): { matches: boolean; feedback: string } {
    const cleanedWord = (spokenWord || '').trim().toLowerCase();
    const cleanedPhoneme = (targetPhoneme || '').trim().toLowerCase();
    const matches = cleanedWord.startsWith(cleanedPhoneme);

    return {
      matches,
      feedback: matches
        ? `Super job! "${spokenWord}" begins with the /${targetPhoneme}/ sound!`
        : `Let's listen together! "${spokenWord}" has a different beginning sound. Can you try again?`,
    };
  }

  evaluateRhyme(wordA: string, wordB: string): { rhymes: boolean; feedback: string } {
    const a = (wordA || '').trim().toLowerCase();
    const b = (wordB || '').trim().toLowerCase();
    // Simple phonetic rhyme ending heuristic (last 2-3 characters)
    const rhymes = a.length >= 2 && b.length >= 2 && a.slice(-2) === b.slice(-2);

    return {
      rhymes,
      feedback: rhymes
        ? `You found a rhyme! "${wordA}" and "${wordB}" rhyme beautifully!`
        : `"${wordA}" and "${wordB}" sound a little different at the end. Let's try another pair!`,
    };
  }

  evaluateCounting(targetCount: number, countedItems: number): { isCorrect: boolean; feedback: string } {
    const isCorrect = targetCount === countedItems;
    return {
      isCorrect,
      feedback: isCorrect
        ? `Hooray! You counted exactly ${targetCount} items!`
        : `Let's count them one by one together! We are looking for ${targetCount}.`,
    };
  }
}

