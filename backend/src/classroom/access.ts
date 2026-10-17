import { ForbiddenException } from '@nestjs/common';

export interface Actor { id: string; role: string }

export const isAdmin = (a: Actor) => a.role === 'ADMIN';

/** Teacher-owned items: the owner (or an admin) can see and change them; everyone else only sees PUBLISHED ones. */
export function canRead(ownerId: string, status: string | null | undefined, actor: Actor): boolean {
  return ownerId === actor.id || isAdmin(actor) || status === 'PUBLISHED';
}

export function assertOwnerOrAdmin(ownerId: string, actor: Actor) {
  if (ownerId !== actor.id && !isAdmin(actor)) throw new ForbiddenException('You do not own this item.');
}
