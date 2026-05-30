/**
 * Unit Tests: authMiddleware / requireAuth (Task 23.5)
 *
 * Requirements: 13.1–13.10
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockVerifyAccessToken, mockFindUnique } = vi.hoisted(() => {
  return {
    mockVerifyAccessToken: vi.fn(),
    mockFindUnique: vi.fn(),
  };
});

vi.mock('../../services/token.service.js', () => ({
  tokenService: {
    verifyAccessToken: mockVerifyAccessToken,
  },
}));

vi.mock('../../config/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-with-at-least-32-characters-for-security',
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { authMiddleware } from '../../middleware/auth.middleware.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(cookies: Record<string, string> = {}, user?: object): Partial<Request> {
  return { cookies, user } as Partial<Request>;
}

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): NextFunction {
  return vi.fn();
}

const validDecoded = {
  sub: 'user-123',
  orgId: 'org-456',
  role: 'MEMBER',
  type: 'access',
  sid: 'session-abc',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900,
};

const validSession = {
  id: 'session-abc',
  userId: 'user-123',
  revoked: false,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call next(UnauthorizedError) when access_token cookie is missing', async () => {
    const req = makeReq({}); // no cookie
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Unauthorized');
  });

  it('should call next(UnauthorizedError) for invalid/malformed token', async () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('INVALID_TOKEN');
    });

    const req = makeReq({ access_token: 'bad-token' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  it('should call next(TOKEN_EXPIRED) for expired token', async () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('TOKEN_EXPIRED');
    });

    const req = makeReq({ access_token: 'expired-token' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.code).toBe('TOKEN_EXPIRED');
  });

  it('should distinguish TOKEN_EXPIRED from generic UNAUTHORIZED', async () => {
    // expired token → TOKEN_EXPIRED code
    mockVerifyAccessToken.mockImplementationOnce(() => { throw new Error('TOKEN_EXPIRED'); });
    const nextA = makeNext();
    await authMiddleware(makeReq({ access_token: 'exp' }) as Request, makeRes() as Response, nextA);
    const expiredErr = (nextA as any).mock.calls[0][0];

    // invalid token → UNAUTHORIZED code
    mockVerifyAccessToken.mockImplementationOnce(() => { throw new Error('INVALID_TOKEN'); });
    const nextB = makeNext();
    await authMiddleware(makeReq({ access_token: 'bad' }) as Request, makeRes() as Response, nextB);
    const invalidErr = (nextB as any).mock.calls[0][0];

    expect(expiredErr.code).toBe('TOKEN_EXPIRED');
    expect(invalidErr.code ?? invalidErr.message).not.toBe('TOKEN_EXPIRED');
  });

  it('should attach req.user when token is valid', async () => {
    mockVerifyAccessToken.mockReturnValue(validDecoded);
    mockFindUnique.mockResolvedValue(validSession);

    const req = makeReq({ access_token: 'valid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(); // no error
    expect((req as any).user).toEqual({
      id: 'user-123',
      orgId: 'org-456',
      role: 'MEMBER',
    });
  });

  it('should attach req.orgId when token is valid', async () => {
    mockVerifyAccessToken.mockReturnValue(validDecoded);
    mockFindUnique.mockResolvedValue(validSession);

    const req = makeReq({ access_token: 'valid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    expect((req as any).orgId).toBe('org-456');
  });

  it('should call next(UnauthorizedError) if decoded payload lacks required fields', async () => {
    mockVerifyAccessToken.mockReturnValue({ sub: null, orgId: 'org', role: 'MEMBER' });

    const req = makeReq({ access_token: 'incomplete-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  it('should call next(UnauthorizedError) if session is revoked', async () => {
    mockVerifyAccessToken.mockReturnValue(validDecoded);
    mockFindUnique.mockResolvedValue({ ...validSession, revoked: true });

    const req = makeReq({ access_token: 'valid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(401);
  });

  it('should call next(UnauthorizedError) if session not found in DB', async () => {
    mockVerifyAccessToken.mockReturnValue(validDecoded);
    mockFindUnique.mockResolvedValue(null);

    const req = makeReq({ access_token: 'valid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should call next(UnauthorizedError) if session is expired', async () => {
    mockVerifyAccessToken.mockReturnValue(validDecoded);
    mockFindUnique.mockResolvedValue({ ...validSession, expiresAt: new Date(Date.now() - 1000) });

    const req = makeReq({ access_token: 'valid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    const err = (next as any).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('should skip session DB lookup when sid is not present in token', async () => {
    const decodedWithoutSid = { ...validDecoded, sid: undefined };
    mockVerifyAccessToken.mockReturnValue(decodedWithoutSid);

    const req = makeReq({ access_token: 'no-sid-jwt' });
    const res = makeRes();
    const next = makeNext();

    await authMiddleware(req as Request, res as Response, next);

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(); // no error
  });
});
