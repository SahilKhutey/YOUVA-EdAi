/**
 * Create a teacher, admin or student account without exposing a public sign-up for staff.
 * Usage:  NEW_USER_PASSWORD='...' npx ts-node prisma/create-user.ts --email a@school.org --role TEACHER --name "Ms Rao"
 * The password is read from the environment so it does not end up in shell history or process lists.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ROLES = ['ADMIN', 'TEACHER', 'STUDENT'];
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const email = arg('email'); const role = (arg('role') || '').toUpperCase(); const name = arg('name');
  const password = process.env.NEW_USER_PASSWORD;
  if (!email || !ROLES.includes(role)) throw new Error(`Provide --email and --role (${ROLES.join(' | ')}).`);
  if (!password || password.length < 12 || password.length > 72) throw new Error('Set NEW_USER_PASSWORD (12 to 72 characters).');
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.create({ data: { email: email.trim(), password: await bcrypt.hash(password, 10), role, name: name ?? null } });
    console.log(`Created ${role} ${user.email} (id ${user.id}).`);
  } finally { await prisma.$disconnect(); }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
