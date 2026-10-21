import { ForbiddenException } from '@nestjs/common';
import { ForumController } from '../forum/forum.controller';
import { ForumFeatureGuard } from '../common/guards/feature-flag.guard';

describe('forum feature switch', () => {
  const OLD = process.env.ENABLE_FORUM;
  afterEach(() => { if (OLD === undefined) delete process.env.ENABLE_FORUM; else process.env.ENABLE_FORUM = OLD; });

  it('is off by default and only an exact "true" turns it on', () => {
    const guard = new ForumFeatureGuard();
    delete process.env.ENABLE_FORUM;
    expect(() => guard.canActivate({} as any)).toThrow(ForbiddenException);
    process.env.ENABLE_FORUM = '1';
    expect(() => guard.canActivate({} as any)).toThrow(ForbiddenException);
    process.env.ENABLE_FORUM = 'True';
    expect(guard.canActivate({} as any)).toBe(true);
  });

  it('is attached to the whole forum controller, before the login check', () => {
    const guards: any[] = Reflect.getMetadata('__guards__', ForumController);
    expect(guards[0]).toBe(ForumFeatureGuard);
    expect(ForumFeatureGuard.name).toBe('ForumFeatureGuard');
  });
});
