import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailService } from '../email.service.js';

// Mock Resend - vi.hoisted ensures the mock is created before vi.mock hoisting
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: mockSend,
    };
  },
}));

// Mock environment config
vi.mock('../../config/env.js', () => ({
  env: {
    RESEND_API_KEY: 'test-resend-api-key',
    EMAIL_FROM: 'test@sentient.dev',
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@sentient.dev',
        to,
        subject: 'Verify your email address',
        html: expect.stringContaining('Verify Your Email Address'),
        text: expect.stringContaining('verify your email address'),
      });
    });

    it('should include verification link in email content', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain(`http://localhost:3000/verify-email?token=${token}`);
      expect(call.text).toContain(`http://localhost:3000/verify-email?token=${token}`);
    });

    it('should personalize email with user name', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'Jane Smith';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Jane Smith');
      expect(call.text).toContain('Jane Smith');
    });

    it('should include 24-hour expiry notice', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('24 hours');
      expect(call.text).toContain('24 hours');
    });

    it('should include security notice', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Security Notice');
      expect(call.html).toContain("didn't create an account");
    });

    it('should include both HTML and text versions', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toBeDefined();
      expect(call.text).toBeDefined();
    });

    it('should use Sentient brand colors in HTML template', async () => {
      const to = 'user@example.com';
      const token = 'verification-token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('#1E201F'); // Background
      expect(call.html).toContain('#74959B'); // Primary
      expect(call.html).toContain('#49776B'); // Accent
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@sentient.dev',
        to,
        subject: 'Reset your password',
        html: expect.stringContaining('Reset Your Password'),
        text: expect.stringContaining('reset your password'),
      });
    });

    it('should include reset link in email content', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain(`http://localhost:3000/reset-password?token=${token}`);
      expect(call.text).toContain(`http://localhost:3000/reset-password?token=${token}`);
    });

    it('should personalize email with user name', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'Jane Smith';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Jane Smith');
      expect(call.text).toContain('Jane Smith');
    });

    it('should include 1-hour expiry notice', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('1 hour');
      expect(call.text).toContain('1 hour');
    });

    it('should include security notice about ignoring if not requested', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Security Notice');
      expect(call.html).toContain("didn't request a password reset");
    });

    it('should include both HTML and text versions', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toBeDefined();
      expect(call.text).toBeDefined();
    });

    it('should use Sentient brand colors in HTML template', async () => {
      const to = 'user@example.com';
      const token = 'reset-token-456';
      const name = 'John Doe';

      await emailService.sendPasswordResetEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('#1E201F');
      expect(call.html).toContain('#74959B');
      expect(call.html).toContain('#49776B');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const to = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(to, name);

      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@sentient.dev',
        to,
        subject: 'Welcome to Sentient!',
        html: expect.stringContaining('Welcome to Sentient'),
        text: expect.stringContaining('Welcome to Sentient'),
      });
    });

    it('should include dashboard link in email content', async () => {
      const to = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(to, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:3000/dashboard');
      expect(call.text).toContain('http://localhost:3000/dashboard');
    });

    it('should personalize email with user name', async () => {
      const to = 'user@example.com';
      const name = 'Jane Smith';

      await emailService.sendWelcomeEmail(to, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Jane Smith');
      expect(call.text).toContain('Jane Smith');
    });

    it('should include getting started tips', async () => {
      const to = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(to, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Getting Started');
      expect(call.html).toContain('Complete your profile');
      expect(call.html).toContain('Invite team members');
    });

    it('should include both HTML and text versions', async () => {
      const to = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(to, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toBeDefined();
      expect(call.text).toBeDefined();
    });

    it('should use Sentient brand colors in HTML template', async () => {
      const to = 'user@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(to, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('#1E201F');
      expect(call.html).toContain('#74959B');
      expect(call.html).toContain('#49776B');
    });
  });

  describe('Development mode fallback', () => {
    it('should not throw when API key is not set', async () => {
      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token', 'John')
      ).resolves.not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle email sending failures gracefully', async () => {
      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token', 'John')
      ).resolves.not.toThrow();
    });

    it('should not block registration when email fails', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token', 'John');
      await emailService.sendPasswordResetEmail('user@example.com', 'token', 'John');
      await emailService.sendWelcomeEmail('user@example.com', 'John');

      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Email template content', () => {
    it('should include current year in footer', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      const currentYear = new Date().getFullYear();
      expect(call.html).toContain(currentYear.toString());
    });

    it('should include "do not reply" notice', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html.toLowerCase()).toContain('do not reply');
    });

    it('should use configured EMAIL_FROM address', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'test@sentient.dev' }),
      );
    });
  });

  describe('HTML template structure', () => {
    it('should generate valid HTML with DOCTYPE', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('<!DOCTYPE html>');
      expect(call.html).toContain('<html lang="en">');
    });

    it('should include responsive meta viewport tag', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('viewport');
      expect(call.html).toContain('width=device-width');
    });

    it('should use table-based layout for email compatibility', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('<table');
      expect(call.html).toContain('role="presentation"');
    });

    it('should include CTA button with proper styling', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Verify Email Address');
      expect(call.html).toContain('background-color: #49776B');
    });
  });

  describe('Plain text template', () => {
    it('should generate clean plain text without HTML tags', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.text).not.toContain('<html>');
      expect(call.text).not.toContain('<table>');
      expect(call.text).not.toContain('<div>');
    });

    it('should include all essential information in plain text', async () => {
      const to = 'user@example.com';
      const token = 'token-123';
      const name = 'John Doe';

      await emailService.sendVerificationEmail(to, token, name);

      const call = mockSend.mock.calls[0][0];
      expect(call.text).toContain('John Doe');
      expect(call.text).toContain('verify-email?token=');
      expect(call.text).toContain('Security Notice');
    });
  });
});
