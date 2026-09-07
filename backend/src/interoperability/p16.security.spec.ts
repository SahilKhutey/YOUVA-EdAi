import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import {
  assertSafeExternalUrl,
  checksumPayload,
  stableEventKey,
} from './p16.security';

describe('P16 security', () => {
  it('accepts an allowlisted HTTPS hostname', () => {
    const url =
      assertSafeExternalUrl(
        'https://lms.example.com/api',
        ['lms.example.com'],
      );

    expect(url.hostname).toBe(
      'lms.example.com',
    );
  });

  it('rejects HTTP', () => {
    expect(() =>
      assertSafeExternalUrl(
        'http://lms.example.com',
        ['lms.example.com'],
      ),
    ).toThrow(
      BadRequestException,
    );
  });

  it('rejects localhost', () => {
    expect(() =>
      assertSafeExternalUrl(
        'https://localhost/x',
        ['localhost'],
      ),
    ).toThrow(
      ForbiddenException,
    );
  });

  it('rejects private IPv4', () => {
    expect(() =>
      assertSafeExternalUrl(
        'https://10.0.0.1/x',
        ['10.0.0.1'],
      ),
    ).toThrow(
      ForbiddenException,
    );
  });

  it('rejects private IPv6', () => {
    expect(() =>
      assertSafeExternalUrl(
        'https://[::1]/x',
        ['::1'],
      ),
    ).toThrow(
      ForbiddenException,
    );
  });

  it('rejects non-allowlisted hosts', () => {
    expect(() =>
      assertSafeExternalUrl(
        'https://evil.example/x',
        ['lms.example.com'],
      ),
    ).toThrow(
      ForbiddenException,
    );
  });

  it('creates deterministic checksums', () => {
    expect(
      checksumPayload({ a: 1 }),
    ).toBe(
      checksumPayload({ a: 1 }),
    );
  });

  it('creates deterministic event keys', () => {
    expect(
      stableEventKey(['a', 'b']),
    ).toBe(
      stableEventKey(['a', 'b']),
    );

    expect(
      stableEventKey(['a', 'b']),
    ).not.toBe(
      stableEventKey(['b', 'a']),
    );
  });
});
