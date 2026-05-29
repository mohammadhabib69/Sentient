import { Resend } from 'resend';
import { env } from '../config/env.js';

/**
 * Email Service
 * 
 * Handles transactional email sending via Resend API with branded HTML templates.
 * Implements development mode fallback that logs emails to console.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
 */
export class EmailService {
  private resend: Resend | null = null;
  private readonly fromAddress: string;
  private readonly isDevelopment: boolean;
  private readonly frontendUrl: string;

  constructor() {
    // Initialize Resend only if API key is provided
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }

    this.fromAddress = env.EMAIL_FROM || 'noreply@sentient.dev';
    this.isDevelopment = env.NODE_ENV === 'development';
    this.frontendUrl = env.FRONTEND_URL;
  }

  /**
   * Sends verification email with branded HTML template
   * 
   * @param to - Recipient email address
   * @param token - Unhashed verification token
   * @param name - User's name for personalization
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.9
   */
  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const verificationLink = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const subject = 'Verify your email address';
    const html = this.renderVerificationEmailTemplate(name, verificationLink);
    const text = this.renderVerificationEmailText(name, verificationLink);

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Sends password reset email with branded HTML template
   * 
   * @param to - Recipient email address
   * @param token - Unhashed reset token
   * @param name - User's name for personalization
   * 
   * Requirements: 15.5, 15.6, 15.9, 15.10
   */
  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset your password';
    const html = this.renderPasswordResetEmailTemplate(name, resetLink);
    const text = this.renderPasswordResetEmailText(name, resetLink);

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Sends welcome email after successful email verification
   * 
   * @param to - Recipient email address
   * @param name - User's name for personalization
   * 
   * Requirements: 15.1, 15.4
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const dashboardLink = `${this.frontendUrl}/dashboard`;
    
    const subject = 'Welcome to Sentient!';
    const html = this.renderWelcomeEmailTemplate(name, dashboardLink);
    const text = this.renderWelcomeEmailText(name, dashboardLink);

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Internal method to send email via Resend or log to console in development
   * 
   * Handles email sending failures gracefully without throwing errors.
   * 
   * @param options - Email options (to, subject, html, text)
   * 
   * Requirements: 15.7, 15.8
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      // Development mode fallback: log to console
      // Log to console if no Resend API key OR in development/test environment
      if (!this.resend || this.isDevelopment || env.NODE_ENV === 'test') {
        console.log('\n=== EMAIL (Development Mode) ===');
        console.log(`From: ${this.fromAddress}`);
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('\n--- Text Content ---');
        console.log(options.text);
        console.log('\n--- HTML Content ---');
        console.log(options.html);
        console.log('================================\n');
        return;
      }

      // Production mode: send via Resend API
      await this.resend.emails.send({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      // Handle email sending failures gracefully without blocking registration
      console.error('Failed to send email:', error);
      console.error('Email details:', {
        to: options.to,
        subject: options.subject,
      });
      // Do not throw error - email failures should not block user operations
    }
  }

  /**
   * Renders verification email HTML template with Sentient branding
   * 
   * Brand colors: #1E201F (background), #74959B (primary), #49776B (accent)
   * 
   * Requirements: 15.4, 15.9
   */
  private renderVerificationEmailTemplate(name: string, verificationLink: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1E201F; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #74959B; font-size: 28px; font-weight: 600;">Sentient</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1E201F; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thank you for signing up for Sentient! To complete your registration and start using your account, please verify your email address by clicking the button below.
              </p>
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                This verification link will expire in <strong>24 hours</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #49776B;">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #74959B; font-size: 14px; word-break: break-all;">
                ${verificationLink}
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">
                <strong>Security Notice:</strong> If you didn't create an account with Sentient, please ignore this email. Your email address will not be used without verification.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sentient. All rights reserved.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Renders verification email plain text version
   */
  private renderVerificationEmailText(name: string, verificationLink: string): string {
    return `
Hi ${name},

Thank you for signing up for Sentient! To complete your registration and start using your account, please verify your email address by clicking the link below.

Verify your email: ${verificationLink}

This verification link will expire in 24 hours.

Security Notice: If you didn't create an account with Sentient, please ignore this email. Your email address will not be used without verification.

© ${new Date().getFullYear()} Sentient. All rights reserved.
This is an automated message, please do not reply.
    `.trim();
  }

  /**
   * Renders password reset email HTML template with Sentient branding
   * 
   * Requirements: 15.4, 15.9, 15.10
   */
  private renderPasswordResetEmailTemplate(name: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1E201F; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #74959B; font-size: 28px; font-weight: 600;">Sentient</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1E201F; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Sentient account. Click the button below to create a new password.
              </p>
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                This password reset link will expire in <strong>1 hour</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #49776B;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #74959B; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged. For security, this link will expire in 1 hour.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sentient. All rights reserved.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Renders password reset email plain text version
   */
  private renderPasswordResetEmailText(name: string, resetLink: string): string {
    return `
Hi ${name},

We received a request to reset your password for your Sentient account. Click the link below to create a new password.

Reset your password: ${resetLink}

This password reset link will expire in 1 hour.

Security Notice: If you didn't request a password reset, please ignore this email. Your password will remain unchanged. For security, this link will expire in 1 hour.

© ${new Date().getFullYear()} Sentient. All rights reserved.
This is an automated message, please do not reply.
    `.trim();
  }

  /**
   * Renders welcome email HTML template with Sentient branding
   * 
   * Requirements: 15.4
   */
  private renderWelcomeEmailTemplate(name: string, dashboardLink: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sentient</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1E201F; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #74959B; font-size: 28px; font-weight: 600;">Sentient</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1E201F; font-size: 24px; font-weight: 600;">Welcome to Sentient! 🎉</h2>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your email has been verified successfully! You're all set to start using Sentient.
              </p>
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Click the button below to access your dashboard and explore all the features we have to offer.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #49776B;">
                    <a href="${dashboardLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #74959B; font-size: 14px; word-break: break-all;">
                ${dashboardLink}
              </p>
            </td>
          </tr>
          
          <!-- Getting Started -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
              <h3 style="margin: 0 0 15px; color: #1E201F; font-size: 18px; font-weight: 600;">Getting Started</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                <li>Complete your profile settings</li>
                <li>Invite team members to collaborate</li>
                <li>Create your first workspace</li>
                <li>Explore our documentation and tutorials</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sentient. All rights reserved.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Renders welcome email plain text version
   */
  private renderWelcomeEmailText(name: string, dashboardLink: string): string {
    return `
Hi ${name},

Welcome to Sentient! 🎉

Your email has been verified successfully! You're all set to start using Sentient.

Click the link below to access your dashboard and explore all the features we have to offer.

Go to Dashboard: ${dashboardLink}

Getting Started:
- Complete your profile settings
- Invite team members to collaborate
- Create your first workspace
- Explore our documentation and tutorials

© ${new Date().getFullYear()} Sentient. All rights reserved.
This is an automated message, please do not reply.
    `.trim();
  }
}

// Export singleton instance
export const emailService = new EmailService();
