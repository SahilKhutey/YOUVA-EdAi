import { JwtService } from '@nestjs/jwt';
import { ClassroomGateway } from './classroom.gateway';
import { BoardGateway } from '../board/board.gateway';
import { tokenFromHandshake } from '../security/socket-auth';

const jwt = new JwtService({ secret: 'gateway-test-secret' });
const token = (sub: string, role: string) => jwt.sign({ sub, role });

/** A stand-in for a socket.io client that records what it sends and which rooms it joined. */
function fakeClient(opts: { token?: string; header?: string } = {}) {
  const sent: { room: string; event: string; payload?: any }[] = [];
  const rooms = new Set<string>();
  const client: any = {
    id: 'sock-' + Math.random().toString(36).slice(2, 7),
    data: {},
    handshake: { auth: opts.token ? { token: opts.token } : {}, headers: opts.header ? { authorization: opts.header } : {} },
    emitted: [] as any[],
    disconnected: false,
    emit(event: string, payload?: any) { client.emitted.push({ event, payload }); },
    disconnect() { client.disconnected = true; },
    join(room: string) { rooms.add(room); },
    to(room: string) { return { emit: (event: string, payload?: any) => sent.push({ room, event, payload }) }; },
    sent, rooms,
  };
  return client;
}

function makeClassroom() {
  const session: any = { id: 'sess1', teacherId: 't1', studentId: 's1' };
  const prisma: any = { digitalClassroomSession: {
    findUnique: jest.fn(async ({ where }: any) => (where.id === 'sess1' ? session : null)),
    update: jest.fn(async () => ({})),
  } };
  return { gw: new ClassroomGateway(prisma, jwt), prisma };
}

describe('ClassroomGateway authentication', () => {
  it('disconnects a client with no token, a bad token, or an expired token', () => {
    const { gw } = makeClassroom();
    for (const c of [fakeClient(), fakeClient({ token: 'garbage' }), fakeClient({ token: jwt.sign({ sub: 'x', role: 'STUDENT' }, { expiresIn: -10 }) })]) {
      gw.handleConnection(c);
      expect(c.disconnected).toBe(true);
      expect(c.data.user).toBeUndefined();
    }
  });

  it('accepts a valid token from the handshake or an Authorization header', () => {
    const { gw } = makeClassroom();
    const a = fakeClient({ token: token('s1', 'STUDENT') });
    const b = fakeClient({ header: `Bearer ${token('t1', 'TEACHER')}` });
    gw.handleConnection(a); gw.handleConnection(b);
    expect([a.disconnected, b.disconnected]).toEqual([false, false]);
    expect(a.data.user).toEqual({ id: 's1', role: 'STUDENT' });
    expect(tokenFromHandshake({ headers: { authorization: 'Basic abc' } })).toBeUndefined();
  });
});

describe('ClassroomGateway rooms', () => {
  async function connect(sub: string, role: string) {
    const c = fakeClient({ token: token(sub, role) });
    return c;
  }

  it('lets the session\'s teacher, its student and an admin join, and refuses everyone else', async () => {
    const { gw } = makeClassroom();
    const results: any = {};
    for (const [name, sub, role] of [['teacher', 't1', 'TEACHER'], ['student', 's1', 'STUDENT'], ['admin', 'a1', 'ADMIN'], ['stranger', 's2', 'STUDENT'], ['otherTeacher', 't2', 'TEACHER']] as const) {
      const c = await connect(sub, role); gw.handleConnection(c);
      results[name] = { reply: await gw.handleJoinRoom({ sessionId: 'sess1' }, c), rooms: [...c.rooms] };
    }
    expect(results.teacher.reply).toEqual({ status: 'joined', role: 'teacher' });
    expect(results.student.reply).toEqual({ status: 'joined', role: 'student' });
    expect(results.admin.reply).toEqual({ status: 'joined', role: 'admin' });
    expect(results.stranger.reply).toEqual({ status: 'denied' });
    expect(results.stranger.rooms).toEqual([]);
    expect(results.otherTeacher.reply).toEqual({ status: 'denied' });
  });

  it('refuses unknown sessions and clients that never authenticated', async () => {
    const { gw } = makeClassroom();
    const c = await connect('t1', 'TEACHER'); gw.handleConnection(c);
    expect(await gw.handleJoinRoom({ sessionId: 'nope' }, c)).toEqual({ status: 'denied' });
    const anon = fakeClient(); gw.handleConnection(anon);
    expect(await gw.handleJoinRoom({ sessionId: 'sess1' }, anon)).toEqual({ status: 'denied' });
  });

  it('forwards whiteboard, signalling and clear events only from a client that has joined that session', async () => {
    const { gw } = makeClassroom();
    const member = await connect('s1', 'STUDENT'); gw.handleConnection(member); await gw.handleJoinRoom({ sessionId: 'sess1' }, member);
    member.sent.length = 0; // forget the join announcement; we only want what is forwarded afterwards
    const outsider = await connect('s2', 'STUDENT'); gw.handleConnection(outsider);
    for (const c of [member, outsider]) {
      gw.handleDraw({ sessionId: 'sess1', drawData: { x: 1 } }, c);
      gw.handleOffer({ sessionId: 'sess1', offer: 'sdp' }, c);
      gw.handleAnswer({ sessionId: 'sess1', answer: 'sdp' }, c);
      gw.handleIceCandidate({ sessionId: 'sess1', candidate: 'c' }, c);
      gw.handleClearBoard({ sessionId: 'sess1' }, c);
    }
    expect(member.sent.map((m: any) => m.event).sort()).toEqual(['answer', 'clear-board', 'draw', 'ice-candidate', 'offer']);
    expect(outsider.sent).toEqual([]);
  });

  it('lets only the teacher (or admin) change the lesson step, and saves a valid step', async () => {
    const { gw, prisma } = makeClassroom();
    const student = await connect('s1', 'STUDENT'); gw.handleConnection(student); await gw.handleJoinRoom({ sessionId: 'sess1' }, student);
    await gw.handleChangeStep({ sessionId: 'sess1', stepIndex: 2 }, student);
    expect(prisma.digitalClassroomSession.update).not.toHaveBeenCalled();
    const teacher = await connect('t1', 'TEACHER'); gw.handleConnection(teacher); await gw.handleJoinRoom({ sessionId: 'sess1' }, teacher);
    await gw.handleChangeStep({ sessionId: 'sess1', stepIndex: -1 }, teacher);
    await gw.handleChangeStep({ sessionId: 'sess1', stepIndex: 1.5 }, teacher);
    expect(prisma.digitalClassroomSession.update).not.toHaveBeenCalled();
    await gw.handleChangeStep({ sessionId: 'sess1', stepIndex: 2 }, teacher);
    expect(prisma.digitalClassroomSession.update).toHaveBeenCalledWith({ where: { id: 'sess1' }, data: { currentStep: 2 } });
  });
});

describe('BoardGateway', () => {
  afterEach(() => { delete process.env.ENABLE_SHARED_BOARD; });
  it('is off by default: every client is disconnected', () => {
    const gw = new BoardGateway(jwt);
    (gw as any).server = { emit: jest.fn() };
    const c = fakeClient({ token: token('s1', 'STUDENT') });
    gw.handleConnection(c);
    expect(c.disconnected).toBe(true);
  });
  it('when enabled, still requires a valid login token', () => {
    process.env.ENABLE_SHARED_BOARD = 'true';
    const gw = new BoardGateway(jwt);
    const anon = fakeClient(); gw.handleConnection(anon);
    const ok = fakeClient({ token: token('s1', 'STUDENT') }); gw.handleConnection(ok);
    expect([anon.disconnected, ok.disconnected]).toEqual([true, false]);
  });
});
