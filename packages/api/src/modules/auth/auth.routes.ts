import { Router } from 'express';
import passport from '../../config/passport.js';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  registerRateLimit,
  loginRateLimit,
  forgotPasswordRateLimit,
  verificationRateLimit,
} from '../../middleware/rateLimit.middleware.js';

/**
 * Auth Routes
 * 
 * Defines all authentication endpoints including registration, login,
 * Google OAuth, email verification, password reset, and session management.
 * 
 * Requirements: All endpoint requirements from tasks.md
 */
export const authRouter = Router();

// Registration and login
// Requirements: 1.1-1.12, 3.1-3.10, 12.1, 12.2
authRouter.post('/register', registerRateLimit, authController.register.bind(authController));
authRouter.post('/login', loginRateLimit, authController.login.bind(authController));

// Token refresh and logout
// Requirements: 6.1-6.10, 7.1-7.9
authRouter.post('/refresh', authController.refresh.bind(authController));
authRouter.post('/logout', requireAuth, authController.logout.bind(authController));
authRouter.post('/logout-all', requireAuth, authController.logoutAll.bind(authController));

// Google OAuth
// Requirements: 4.1-4.10, 12.2
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: process.env.FRONTEND_LOGIN_URL || process.env.FRONTEND_URL || 'http://localhost:3000/login?error=auth_failed'
  }),
  authController.googleCallback.bind(authController)
);

// Current user
// Requirements: 14.1-14.6
authRouter.get('/me', requireAuth, authController.getCurrentUser.bind(authController));

// Email verification
// Requirements: 2.5-2.10, 12.4
authRouter.get('/verify-email', authController.verifyEmail.bind(authController));
authRouter.post('/send-verification', requireAuth, verificationRateLimit, authController.sendVerificationEmail.bind(authController));

// Password reset
// Requirements: 8.1-8.11, 12.3
authRouter.post('/forgot-password', forgotPasswordRateLimit, authController.forgotPassword.bind(authController));
authRouter.post('/reset-password', authController.resetPassword.bind(authController));

// Session management
// Requirements: 9.1-9.5
authRouter.get('/sessions', requireAuth, authController.listSessions.bind(authController));
authRouter.delete('/sessions/:sessionId', requireAuth, authController.revokeSession.bind(authController));
