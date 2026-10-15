import { ForbiddenException } from '@nestjs/common';
import { AiFeaturesGuard } from './ai-features.guard';
import { AiMentorController } from '../../ai-mentor/ai-mentor.controller';
import { AiController } from '../../ai/ai.controller';
import { LearningController } from '../../learning/learning.controller';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

const guardsOf = (target: any): any[] => Reflect.getMetadata('__guards__', target) ?? [];

describe('AiFeaturesGuard', () => {
  const OLD = process.env.ENABLE_AI_FEATURES;
  afterEach(() => { if (OLD === undefined) delete process.env.ENABLE_AI_FEATURES; else process.env.ENABLE_AI_FEATURES = OLD; });

  it('blocks by default and when set to anything but true', () => {
    delete process.env.ENABLE_AI_FEATURES;
    expect(() => new AiFeaturesGuard().canActivate()).toThrow(ForbiddenException);
    process.env.ENABLE_AI_FEATURES = 'false';
    expect(() => new AiFeaturesGuard().canActivate()).toThrow(ForbiddenException);
    process.env.ENABLE_AI_FEATURES = '1';
    expect(() => new AiFeaturesGuard().canActivate()).toThrow(ForbiddenException);
  });

  it('allows only when ENABLE_AI_FEATURES=true', () => {
    process.env.ENABLE_AI_FEATURES = 'TRUE';
    expect(new AiFeaturesGuard().canActivate()).toBe(true);
  });

  it('is attached to every student-facing endpoint where free text or voice reaches the AI', () => {
    expect(guardsOf(AiMentorController)).toContain(AiFeaturesGuard);
    expect(guardsOf(AiController)).toContain(AiFeaturesGuard);
    expect(guardsOf(LearningController.prototype.chat)).toContain(AiFeaturesGuard);
    expect(guardsOf(LearningController.prototype.startSession)).toContain(AiFeaturesGuard);
  });

  it('requires login on /ai/generate (it used to accept any prompt from anyone)', () => {
    expect(guardsOf(AiController)).toContain(JwtAuthGuard);
    expect(guardsOf(AiController).indexOf(JwtAuthGuard)).toBeLessThan(guardsOf(AiController).indexOf(AiFeaturesGuard));
  });
});
