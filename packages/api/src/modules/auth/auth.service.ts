import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { tokenService } from '../../services/token.service.js';
import { sessionService } from '../../services/session.service.js';
import { emailService } from '../../services/email.service.js';
import { AppError, ConflictError, UnauthorizedError } from '../../utils/errors.js';
import type { DeviceInfo } from '../../services/session.service.js';
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema.js';
import type { AuthResult, UserWithOrg, toUserResponse, toOrganizationResponse } from './auth.types.js';
import { toUserResponse as convertUserResponse, toOrganizationResponse as convertOrgResponse } from './auth.types.js';

/**
 * Auth Service
 * 
 * Handles core authentication business logic including user registration,
 * login, email verification, password reset, and session management.
 * 
 * Requirements: 1, 2, 3, 8, 14
 */
export class AuthService {
  private readonly bcryptRounds = 12;

  /**
   * Registers a new user with email and password
   * 
   * Creates user account, organization (if first user), generates tokens,
   * sends verification email, and creates session.
   * 
   * @param data - Registration input (name, email, password)
   * @param deviceInfo - Device information from request
   * @returns Authentication result with user, org, and tokens
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12
   */
  async register(data: RegisterInput, deviceInfo: DeviceInfo): Promise<AuthResult> {
    const { name, email, password } = data;

    // Check if user already exists in any organization
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password with bcrypt (12 rounds)
    // Requirements: 1.8
    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

    // Check if this is the first user (no organizations exist)
    const orgCount = await prisma.organization.count();
    const isFirstUser = orgCount === 0;

    let user;
    let organization;

    if (isFirstUser) {
      // Create organization and user with super_admin role
      // Requirements: 1.6
      const orgSlug = this.generateSlug(name);
      
      const result = await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
          data: {
            name: `${name}'s Organization`,
            slug: orgSlug,
            plan: 'FREE',
          },
        });

        const newUser = await tx.user.create({
          data: {
            orgId: newOrg.id,
            email,
            name,
            passwordHash,
            role: 'SUPER_ADMIN',
            emailVerified: false,
          },
          include: {
            organization: true,
          },
        });

        return { user: newUser, org: newOrg };
      });

      user = result.user;
      organization = result.org;
    } else {
      // Add user to existing organization with member role
      // Requirements: 1.7
      // For now, we'll use the first organization (in production, this would be determined by invite/domain)
      const defaultOrg = await prisma.organization.findFirst();
      
      if (!defaultOrg) {
        throw new AppError('No organization found', 500, 'INTERNAL_ERROR');
      }

      // Check if email already exists in this organization
      const existingInOrg = await prisma.user.findUnique({
        where: {
          orgId_email: {
            orgId: defaultOrg.id,
            email,
          },
        },
      });

      if (existingInOrg) {
        throw new ConflictError('Email already registered in this organization');
      }

      user = await prisma.user.create({
        data: {
          orgId: defaultOrg.id,
          email,
          name,
          passwordHash,
          role: 'MEMBER',
          emailVerified: false,
        },
        include: {
          organization: true,
        },
      });

      organization = defaultOrg;
    }

    // Generate email verification token
    // Requirements: 2.1, 2.2, 2.3
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = await bcrypt.hash(verificationToken, this.bcryptRounds);
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verificationTokenHash,
        emailVerifyExpiry: verificationExpiry,
      },
    });

    // Send verification email (non-blocking)
    // Requirements: 2.4, 15.1, 15.8
    emailService.sendVerificationEmail(email, verificationToken, name).catch((error) => {
      console.error('Failed to send verification email:', error);
      // Don't throw - email failures should not block registration
    });

    // Generate access and refresh tokens
    // Requirements: 1.9, 5.1, 5.4
    const accessToken = tokenService.generateAccessToken({
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    const refreshToken = tokenService.generateRefreshToken();
    const refreshTokenHash = await tokenService.hashToken(refreshToken);

    // Calculate refresh token expiry (30 days)
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    // Create session record
    // Requirements: 1.10, 5.9
    await sessionService.createSession({
      userId: user.id,
      refreshTokenHash,
      deviceInfo,
      expiresAt: refreshExpiry,
    });

    return {
      user: convertUserResponse(user),
      org: convertOrgResponse(organization),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generates a URL-safe slug from a string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '-' + crypto.randomBytes(4).toString('hex');
  }

  /**
   * Authenticates user with email and password
   * 
   * Validates credentials, checks account lock status, generates tokens,
   * and creates session.
   * 
   * @param data - Login input (email, password)
   * @param deviceInfo - Device information from request
   * @returns Authentication result with user, org, and tokens
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
   */
  async login(data: LoginInput, deviceInfo: DeviceInfo): Promise<AuthResult> {
    const { email, password } = data;

    // Find user by email
    // Requirements: 3.1
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        organization: true,
      },
    });

    // Generic error message to prevent user enumeration
    // Requirements: 3.2, 16.4
    const invalidCredentialsError = new UnauthorizedError();
    invalidCredentialsError.message = 'Invalid email or password';

    if (!user) {
      throw invalidCredentialsError;
    }

    // Check if account is locked
    // Requirements: 3.5, 12.8, 12.9
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes.`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    // Verify password
    // Requirements: 3.3
    if (!user.passwordHash) {
      throw invalidCredentialsError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      // Requirements: 3.4, 12.7
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = {
        failedLoginAttempts: newFailedAttempts,
      };

      // Lock account after 5 failed attempts
      // Requirements: 3.5, 12.8
      if (newFailedAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes
        updateData.lockedUntil = lockUntil;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw invalidCredentialsError;
    }

    // Reset failed login attempts on successful login
    // Requirements: 3.6, 12.10
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Generate access and refresh tokens
    // Requirements: 3.7
    const accessToken = tokenService.generateAccessToken({
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    const refreshToken = tokenService.generateRefreshToken();
    const refreshTokenHash = await tokenService.hashToken(refreshToken);

    // Calculate refresh token expiry (30 days)
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    // Create session record with device info
    // Requirements: 3.8
    await sessionService.createSession({
      userId: user.id,
      refreshTokenHash,
      deviceInfo,
      expiresAt: refreshExpiry,
    });

    return {
      user: convertUserResponse(user),
      org: convertOrgResponse(user.organization),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Retrieves current user and organization data
   * 
   * @param userId - User ID from access token
   * @returns User and organization data
   * 
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
   */
  async getCurrentUser(userId: string): Promise<UserWithOrg> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    return {
      user: convertUserResponse(user),
      org: convertOrgResponse(user.organization),
    };
  }

  /**
   * Verifies user email with token
   * 
   * @param token - Unhashed verification token from email
   * 
   * Requirements: 2.5, 2.6, 2.7, 2.8
   */
  async verifyEmail(token: string): Promise<void> {
    // Hash the received token to find matching user
    const tokenHash = await bcrypt.hash(token, this.bcryptRounds);

    // Find user with matching token that hasn't expired
    // Note: We need to find all users with non-null tokens and check each one
    // because bcrypt hashes are non-deterministic
    const users = await prisma.user.findMany({
      where: {
        emailVerifyToken: { not: null },
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    let matchedUser = null;
    for (const user of users) {
      if (user.emailVerifyToken && await bcrypt.compare(token, user.emailVerifyToken)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    // Mark email as verified and clear token
    // Requirements: 2.6, 2.8
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(matchedUser.email, matchedUser.name).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });
  }

  /**
   * Sends or resends email verification
   * 
   * @param userId - User ID requesting verification email
   * 
   * Requirements: 2.9, 2.10
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    // Check if already verified
    // Requirements: 2.10
    if (user.emailVerified) {
      throw new AppError('Email already verified', 400, 'EMAIL_ALREADY_VERIFIED');
    }

    // Generate new verification token
    // Requirements: 2.9
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = await bcrypt.hash(verificationToken, this.bcryptRounds);
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: verificationTokenHash,
        emailVerifyExpiry: verificationExpiry,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken, user.name);
  }

  /**
   * Initiates password reset flow
   * 
   * @param data - Forgot password input (email)
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const { email } = data;

    // Find user by email
    // Requirements: 8.1
    const user = await prisma.user.findFirst({
      where: { email },
    });

    // Return same success response whether user exists or not
    // Requirements: 8.2, 16.4
    if (!user) {
      return; // Silent success to prevent email enumeration
    }

    // Generate reset token
    // Requirements: 8.3, 8.4, 8.5
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, this.bcryptRounds);
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpiry: resetExpiry,
      },
    });

    // Send reset email
    // Requirements: 8.6
    await emailService.sendPasswordResetEmail(email, resetToken, user.name);
  }

  /**
   * Resets user password with token
   * 
   * @param data - Reset password input (token, new password)
   * 
   * Requirements: 8.7, 8.8, 8.9, 8.10, 8.11
   */
  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const { token, password } = data;

    // Find user with matching reset token that hasn't expired
    // Note: Similar to email verification, we need to check each user
    const users = await prisma.user.findMany({
      where: {
        resetPasswordToken: { not: null },
        resetPasswordExpiry: { gt: new Date() },
      },
    });

    let matchedUser = null;
    for (const user of users) {
      if (user.resetPasswordToken && await bcrypt.compare(token, user.resetPasswordToken)) {
        matchedUser = user;
        break;
      }
    }

    // Requirements: 8.8
    if (!matchedUser) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // Hash new password
    // Requirements: 8.9
    const newPasswordHash = await bcrypt.hash(password, this.bcryptRounds);

    // Update password and clear reset token
    // Requirements: 8.9, 8.11
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    // Revoke all active sessions for security
    // Requirements: 8.10
    await sessionService.revokeAllUserSessions(matchedUser.id);
  }
}

// Export singleton instance
export const authService = new AuthService();
