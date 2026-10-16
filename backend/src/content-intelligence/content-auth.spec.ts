import { ContentSearchController } from './controllers/content-search.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('content search and engagement', () => {
  it('require login', () => {
    expect(Reflect.getMetadata('__guards__', ContentSearchController)).toContain(JwtAuthGuard);
  });

  it('always act as the logged-in user, ignoring a userId sent by the caller', async () => {
    const orchestrator: any = { searchContent: jest.fn(async () => []), trackEngagement: jest.fn(async () => ({})) };
    const ctrl = new ContentSearchController(orchestrator);
    const req = { user: { id: 'me' } };
    await ctrl.search(req, 'fractions', 'general');
    expect(orchestrator.searchContent).toHaveBeenCalledWith('fractions', 'me', 'general');
    await ctrl.trackEngagement(req, { resourceId: 'r1', type: 'VIEW', userId: 'someone-else' } as any);
    expect(orchestrator.trackEngagement).toHaveBeenCalledWith('r1', 'VIEW', 'me');
  });
});
