import { z } from 'zod';

/**
 * Registration input validation schema
 * 
 * Requirements: 1.2, 1.3, 1.4
 */
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/**
 * Login input validation schema
 * 
 * Requirements: 3.1
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
  password: z.string()
    .min(1, 'Password is required'),
});

/**
 * Forgot password input validation schema
 * 
 * Requirements: 8.1
 */
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
});

/**
 * Reset password input validation schema
 * 
 * Requirements: 8.7, 8.9
 */
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/**
 * Verify email query validation schema
 * 
 * Requirements: 2.5
 */
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Token is required'),
});

/**
 * Revoke session param validation schema
 * 
 * Requirements: 9.3
 */
export const revokeSessionSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
