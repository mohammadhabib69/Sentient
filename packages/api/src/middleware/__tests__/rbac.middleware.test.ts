/**
 * Unit Tests: requirePermission / requireRole (RBAC Middleware) — Task 23.5
 *
 * Requirements: 10.1–10.10
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { requirePermission, requireRole, rolePermissions } from '../rbac.middleware.js';
import type { Permission } from '../rbac.middleware.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(role: UserRole | null = null): Partial<Request> {
  return {
    user: role ? ({ id: 'user-1', orgId: 'org-1', role } as any) : undefined,
  };
}

function makeRes(): Partial<Response> {
  return {};
}

function makeNext(): NextFunction {
  return vi.fn();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RBAC Middleware', () => {
  describe('rolePermissions map', () => {
    it('should grant wildcard (*) to SUPER_ADMIN', () => {
      expect(rolePermissions.SUPER_ADMIN).toContain('*');
    });

    it('should include org:write for ORG_ADMIN', () => {
      expect(rolePermissions.ORG_ADMIN).toContain('org:write');
    });

    it('should NOT include org:write for MEMBER', () => {
      expect(rolePermissions.MEMBER).not.toContain('org:write');
    });

    it('should NOT include org:write for GUEST', () => {
      expect(rolePermissions.GUEST).not.toContain('org:write');
    });

    it('should give MANAGER project:create but not billing:manage', () => {
      expect(rolePermissions.MANAGER).toContain('project:create');
      expect(rolePermissions.MANAGER).not.toContain('billing:manage');
    });

    it('should give GUEST only read-level permissions', () => {
      const guestPerms = rolePermissions.GUEST;
      expect(guestPerms).toContain('workspace:read');
      expect(guestPerms).toContain('project:read');
      expect(guestPerms).not.toContain('task:create');
      expect(guestPerms).not.toContain('members:invite');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // requirePermission
  // ──────────────────────────────────────────────────────────────────────────
  describe('requirePermission', () => {
    it('should grant access to SUPER_ADMIN for any permission (wildcard)', () => {
      const permissions: Permission[] = ['org:write', 'billing:manage', 'members:remove', 'agent:manage'];

      permissions.forEach((perm) => {
        const next = makeNext();
        requirePermission(perm)(makeReq('SUPER_ADMIN') as Request, makeRes() as Response, next);
        expect(next).toHaveBeenCalledWith(); // no error arg
      });
    });

    it('should grant access to ORG_ADMIN for org:write', () => {
      const next = makeNext();
      requirePermission('org:write')(makeReq('ORG_ADMIN') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny MEMBER for org:write (403)', () => {
      expect(() => {
        requirePermission('org:write')(makeReq('MEMBER') as Request, makeRes() as Response, makeNext());
      }).toThrow();
    });

    it('should deny GUEST for task:create (403)', () => {
      expect(() => {
        requirePermission('task:create')(makeReq('GUEST') as Request, makeRes() as Response, makeNext());
      }).toThrow();
    });

    it('should grant MANAGER access to project:create', () => {
      const next = makeNext();
      requirePermission('project:create')(makeReq('MANAGER') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should grant MEMBER access to task:create', () => {
      const next = makeNext();
      requirePermission('task:create')(makeReq('MEMBER') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw UnauthorizedError when user is not set on request', () => {
      expect(() => {
        requirePermission('org:read')(makeReq(null) as Request, makeRes() as Response, makeNext());
      }).toThrow('Unauthorized');
    });

    it('should deny MEMBER for billing:manage', () => {
      expect(() => {
        requirePermission('billing:manage')(makeReq('MEMBER') as Request, makeRes() as Response, makeNext());
      }).toThrow();
    });

    it('should deny GUEST for members:invite', () => {
      expect(() => {
        requirePermission('members:invite')(makeReq('GUEST') as Request, makeRes() as Response, makeNext());
      }).toThrow();
    });

    it('should grant ORG_ADMIN access to billing:manage', () => {
      const next = makeNext();
      requirePermission('billing:manage')(makeReq('ORG_ADMIN') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // requireRole
  // ──────────────────────────────────────────────────────────────────────────
  describe('requireRole', () => {
    it('should allow access when user role is in the allowed list', () => {
      const next = makeNext();
      requireRole('ORG_ADMIN', 'SUPER_ADMIN')(makeReq('ORG_ADMIN') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access when user role is NOT in the allowed list (403)', () => {
      expect(() => {
        requireRole('ORG_ADMIN', 'SUPER_ADMIN')(makeReq('MEMBER') as Request, makeRes() as Response, makeNext());
      }).toThrow();
    });

    it('should throw UnauthorizedError when req.user is not set', () => {
      expect(() => {
        requireRole('MEMBER')(makeReq(null) as Request, makeRes() as Response, makeNext());
      }).toThrow('Unauthorized');
    });

    it('should allow SUPER_ADMIN when SUPER_ADMIN is in the list', () => {
      const next = makeNext();
      requireRole('SUPER_ADMIN')(makeReq('SUPER_ADMIN') as Request, makeRes() as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should accept multiple allowed roles', () => {
      const next1 = makeNext();
      const next2 = makeNext();

      requireRole('MEMBER', 'MANAGER', 'ORG_ADMIN')(makeReq('MEMBER') as Request, makeRes() as Response, next1);
      requireRole('MEMBER', 'MANAGER', 'ORG_ADMIN')(makeReq('MANAGER') as Request, makeRes() as Response, next2);

      expect(next1).toHaveBeenCalledWith();
      expect(next2).toHaveBeenCalledWith();
    });
  });
});
