import { JwtStrategy } from './jwt.strategy';

const config = (secret?: string): any => ({ get: () => secret });

describe('JwtStrategy', () => {
  it('exposes both id and userId (controllers use both names)', async () => {
    const out = await new JwtStrategy(config('a-test-secret')).validate({ sub: 'u1', email: 'a@b.c', role: 'TEACHER' });
    expect(out).toEqual({ id: 'u1', userId: 'u1', email: 'a@b.c', role: 'TEACHER' });
  });
  it('refuses to start without JWT_SECRET instead of falling back to a default secret', () => {
    expect(() => new JwtStrategy(config(undefined))).toThrow(/JWT_SECRET/);
  });
});
