/**
 * Unit Tests: requireOwnerOrRole (ABAC Middleware) — Task 23.5
 *
 * Requirements: 11.1–11.8
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { requireOwnerOrRole } from '../abac.middleware.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(userId: string, role: UserRole): Partial<Request> {
  return { user: { id: userId, orgId: 'org-1', role } as any };
}

function makeRes(): Partial<Response> {
  return {};
}

function makeNext(): NextFunction {
  return vi.fn();
}

/** Creates an owner getter that always returns the given ownerId */
function ownerGetter(ownerId: string | null) {
  return vi.fn().mockResolvedValue(ownerId);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ABAC Middleware — requireOwnerOrRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should grant access to SUPER_ADMIN without checking ownership', async () => {
    const getter = ownerGetter('other-user');
    const next = makeNext();

    await requireOwnerOrRole(getter)(
      makeReq('admin-user', 'SUPER_ADMIN') as Request,
      makeRes() as Response,
      next,
    );

    expect(getter).not.toHaveBeenCalled(); // bypass ownership check
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('should grant access to ORG_ADMIN without checking ownership', async () => {
    const getter = ownerGetter('other-user');
    const next = makeNext();

    await requireOwnerOrRole(getter)(
      makeReq('admin-user', 'ORG_ADMIN') as Request,
      makeRes() as Response,
      next,
    );

    expect(getter).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should grant access when user is the resource owner (MEMBER)', async () => {
    const getter = ownerGetter('user-123');
    const next = makeNext();

    await requireOwnerOrRole(getter, 'MANAGER')(
      makeReq('user-123', 'MEMBER') as Request,
      makeRes() as Response,
      next,
    );

    expect(getter).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('should deny access when user is NOT the owner and below minimum role', async () => {
    const getter = ownerGetter('other-user'); // different owner
    const next = makeNext();

    await expect(
      requireOwnerOrRole(getter, 'MANAGER')(
        makeReq('user-123', 'MEMBER') as Request,
        makeRes() as Response,
        next,
      ),
    ).rejects.toThrow('Forbidden');

    expect(next).not.toHaveBeenCalledWith(); // next called with error (via throw)
  });

  it('should grant access when user meets or exceeds the minimum role', async () => {
    const getter = ownerGetter('other-user'); // not owner, but high enough role
    const next = makeNext();

    await requireOwnerOrRole(getter, 'MANAGER')(
      makeReq('user-123', 'MANAGER') as Request,
      makeRes() as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('should use MANAGER as default minimum role', async () => {
    // MEMBER is below MANAGER, and is not owner → should be denied
    const getter = ownerGetter('other-user');
    const next = makeNext();

    await expect(
      requireOwnerOrRole(getter)(
        makeReq('user-123', 'MEMBER') as Request,
        makeRes() as Response,
        next,
      ),
    ).rejects.toThrow('Forbidden');
  });

  it('should throw UnauthorizedError when req.user is missing', async () => {
    const getter = ownerGetter('owner-1');
    const next = makeNext();
    const req = {} as Partial<Request>; // no user

    await expect(
      requireOwnerOrRole(getter)(req as Request, makeRes() as Response, next),
    ).rejects.toThrow('Unauthorized');
  });

  it('should grant GUEST access when they own the resource (below min role)', async () => {
    // GUEST role is below MANAGER (default min), but IS the owner → grant
    const getter = ownerGetter('guest-user');
    const next = makeNext();

    await requireOwnerOrRole(getter, 'MANAGER')(
      makeReq('guest-user', 'GUEST') as Request,
      makeRes() as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('should deny GUEST when they are NOT the owner and below min role', async () => {
    const getter = ownerGetter('someone-else');
    const next = makeNext();

    await expect(
      requireOwnerOrRole(getter, 'MEMBER')(
        makeReq('guest-user', 'GUEST') as Request,
        makeRes() as Response,
        next,
      ),
    ).rejects.toThrow('Forbidden');
  });

  it('should call ownership getter with the request object', async () => {
    const getter = ownerGetter('user-123');
    const req = makeReq('user-123', 'MEMBER');
    const next = makeNext();

    await requireOwnerOrRole(getter, 'MANAGER')(req as Request, makeRes() as Response, next);

    expect(getter).toHaveBeenCalledWith(req);
  });

  it('should deny access when ownership getter returns null', async () => {
    const getter = ownerGetter(null); // resource not found / no owner
    const next = makeNext();

    await expect(
      requireOwnerOrRole(getter, 'MANAGER')(
        makeReq('user-123', 'MEMBER') as Request,
        makeRes() as Response,
        next,
      ),
    ).rejects.toThrow('Forbidden');
  });
});
