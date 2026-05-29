import type { User, Organization, Session, UserRole } from '@prisma/client';

/**
 * User data returned in auth responses (excludes sensitive fields)
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
}

/**
 * Organization data returned in auth responses
 */
export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

/**
 * Authentication result returned after successful registration/login
 * 
 * Requirements: 1.12, 3.10
 */
export interface AuthResult {
  user: UserResponse;
  org: OrganizationResponse;
  accessToken: string;
  refreshToken: string;
}

/**
 * User with organization data
 * 
 * Requirements: 14.3, 14.4, 14.5
 */
export interface UserWithOrg {
  user: UserResponse;
  org: OrganizationResponse;
}

/**
 * Session data returned in session list
 * 
 * Requirements: 9.2
 */
export interface SessionResponse {
  id: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    browser?: string;
    os?: string;
    deviceType?: string;
  };
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

/**
 * Helper to convert User to UserResponse (strips sensitive fields)
 */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Helper to convert Organization to OrganizationResponse
 */
export function toOrganizationResponse(org: Organization): OrganizationResponse {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
  };
}

/**
 * Helper to convert Session to SessionResponse
 */
export function toSessionResponse(session: Session, isCurrent: boolean = false): SessionResponse {
  return {
    id: session.id,
    deviceInfo: session.deviceInfo as any,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrent,
  };
}
