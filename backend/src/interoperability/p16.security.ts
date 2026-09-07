import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (n) =>
        !Number.isInteger(n) ||
        n < 0 ||
        n > 255,
    )
  ) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host
    .toLowerCase()
    .replace(/^\[/, '')
    .replace(/\]$/, '');

  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

export function assertSafeExternalUrl(
  rawUrl: string,
  allowedHosts: string[],
): URL {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException(
      'Integration URL is invalid.',
    );
  }

  if (url.protocol !== 'https:') {
    throw new BadRequestException(
      'Only HTTPS integration URLs are allowed.',
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (
    BLOCKED_HOSTS.has(hostname) ||
    isPrivateIpv4(hostname) ||
    isPrivateIpv6(hostname)
  ) {
    throw new ForbiddenException(
      'Integration URL targets a blocked network address.',
    );
  }

  if (isIP(hostname) !== 0) {
    throw new ForbiddenException(
      'Direct IP integration endpoints are not allowed.',
    );
  }

  const normalizedAllowed = allowedHosts
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedAllowed.includes(hostname)) {
    throw new ForbiddenException(
      'Integration host is not allowlisted.',
    );
  }

  return url;
}

export function checksumPayload(
  payload: unknown,
): string {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export function stableEventKey(
  parts: string[],
): string {
  return createHash('sha256')
    .update(parts.join('|'))
    .digest('hex');
}

export function assertPrivileged(
  role: string,
): asserts role is 'ADMIN' | 'TEACHER' {
  if (
    role !== 'ADMIN' &&
    role !== 'TEACHER'
  ) {
    throw new ForbiddenException(
      'Integration access requires a teacher or administrator role.',
    );
  }
}
