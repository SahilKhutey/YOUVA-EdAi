import { JwtService } from '@nestjs/jwt';

export interface SocketUser { id: string; role: string }

/** Token from the socket.io handshake (`auth: { token }`) or an Authorization: Bearer header. */
export function tokenFromHandshake(handshake: any): string | undefined {
  const t = handshake?.auth?.token;
  if (typeof t === 'string' && t) return t;
  const h = handshake?.headers?.authorization;
  if (typeof h === 'string' && h.startsWith('Bearer ') && h.length > 7) return h.slice(7);
  return undefined;
}

/** Returns the logged-in user, or null if the token is missing, invalid or expired. */
export function authenticateSocket(client: any, jwt: JwtService): SocketUser | null {
  const token = tokenFromHandshake(client?.handshake);
  if (!token) return null;
  try {
    const payload: any = jwt.verify(token);
    return payload?.sub ? { id: payload.sub, role: payload.role } : null;
  } catch {
    return null;
  }
}
