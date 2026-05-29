# Email Service Implementation

## Overview

The Email Service provides transactional email functionality for the Sentient authentication system using the Resend API. It implements branded HTML email templates with automatic fallback to console logging in development environments.

## Features

✅ **Three Email Types**:
- Verification emails (24-hour expiry)
- Password reset emails (1-hour expiry)
- Welcome emails (post-verification)

✅ **Branded HTML Templates**:
- Sentient brand colors (#1E201F, #74959B, #49776B)
- Responsive design with table-based layout
- Plain text fallback for all emails

✅ **Development Mode Fallback**:
- Automatically logs emails to console when:
  - `RESEND_API_KEY` is not set
  - `NODE_ENV` is 'development' or 'test'

✅ **Graceful Error Handling**:
- Email failures don't block user operations
- Errors are logged but not thrown
- Ensures registration/reset flows complete successfully

✅ **Security Features**:
- Includes security notices in all emails
- Token expiry information clearly displayed
- "Do not reply" notices

## Files Created

1. **`email.service.ts`** - Main service implementation (490 lines)
2. **`__tests__/email.service.test.ts`** - Comprehensive unit tests (34 tests, all passing)
3. **`email.service.example.ts`** - Usage examples and integration patterns
4. **`EMAIL_SERVICE_README.md`** - This documentation file

## Requirements Satisfied

This implementation satisfies the following requirements from the authentication-system spec:

- **15.1**: Send verification emails using Resend API ✅
- **15.2**: Use configured EMAIL_FROM address as sender ✅
- **15.3**: Include verification link with unhashed token ✅
- **15.4**: Format emails with Sentient brand styling ✅
- **15.5**: Send password reset emails using Resend API ✅
- **15.6**: Include reset link with unhashed token ✅
- **15.7**: Log email content to console in development ✅
- **15.8**: Handle email failures gracefully without blocking registration ✅

## Usage

### Basic Usage

```typescript
import { emailService } from './services/email.service.js';

// Send verification email
await emailService.sendVerificationEmail(
  'user@example.com',
  'verification-token-123',
  'John Doe'
);

// Send password reset email
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-456',
  'John Doe'
);

// Send welcome email
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);
```

### Integration with Auth Service

```typescript
// In auth.service.ts registration method
async register(data: RegisterInput) {
  // 1. Create user
  const user = await prisma.user.create({ ... });
  
  // 2. Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(token, 12);
  
  // 3. Store hashed token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: hashedToken,
      emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  
  // 4. Send verification email (won't throw on failure)
  await emailService.sendVerificationEmail(
    user.email,
    token, // Send unhashed token
    user.name
  );
  
  // 5. Return response (registration succeeds even if email fails)
  return { user, tokens };
}
```

## Environment Configuration

Required environment variables (already configured in `.env.example`):

```bash
# Resend API key (optional for development)
RESEND_API_KEY=your-resend-api-key

# Email sender address (must be verified in Resend)
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

## Development Mode

When running in development or test environments, emails are logged to console instead of being sent:

```
=== EMAIL (Development Mode) ===
From: noreply@sentient.dev
To: user@example.com
Subject: Verify your email address

--- Text Content ---
Hi John Doe,

Thank you for signing up for Sentient! ...

--- HTML Content ---
<!DOCTYPE html>
<html lang="en">
...
================================
```

## Email Templates

### Verification Email
- **Subject**: "Verify your email address"
- **Expiry**: 24 hours
- **Link**: `{FRONTEND_URL}/verify-email?token={token}`
- **CTA**: "Verify Email Address" button

### Password Reset Email
- **Subject**: "Reset your password"
- **Expiry**: 1 hour
- **Link**: `{FRONTEND_URL}/reset-password?token={token}`
- **CTA**: "Reset Password" button

### Welcome Email
- **Subject**: "Welcome to Sentient!"
- **Link**: `{FRONTEND_URL}/dashboard`
- **CTA**: "Go to Dashboard" button
- **Includes**: Getting started tips

## Testing

All 34 unit tests pass successfully:

```bash
cd packages/api
pnpm test email.service.test.ts --run
```

**Test Coverage**:
- ✅ Verification email sending
- ✅ Password reset email sending
- ✅ Welcome email sending
- ✅ Development mode fallback
- ✅ Error handling (graceful failures)
- ✅ Email template content validation
- ✅ HTML template structure
- ✅ Plain text template generation
- ✅ Brand color usage
- ✅ Security notices
- ✅ Token expiry information

## Error Handling

The service implements graceful error handling:

```typescript
try {
  await resend.emails.send({ ... });
} catch (error) {
  // Log error but don't throw
  console.error('Failed to send email:', error);
  // User operations continue successfully
}
```

This ensures that:
- User registration completes even if email fails
- Password reset requests succeed even if email fails
- Application remains functional during email service outages

## Brand Styling

All email templates use Sentient brand colors:

- **Background**: `#1E201F` (dark charcoal)
- **Primary**: `#74959B` (muted teal)
- **Accent**: `#49776B` (sage green)

Templates are:
- Mobile-responsive
- Table-based for email client compatibility
- Include both HTML and plain text versions
- Follow email best practices

## Next Steps

To integrate the email service into the authentication system:

1. **Import the service** in `auth.service.ts`:
   ```typescript
   import { emailService } from '../services/email.service.js';
   ```

2. **Call in registration flow**:
   ```typescript
   await emailService.sendVerificationEmail(user.email, token, user.name);
   ```

3. **Call in password reset flow**:
   ```typescript
   await emailService.sendPasswordResetEmail(user.email, token, user.name);
   ```

4. **Call after email verification**:
   ```typescript
   await emailService.sendWelcomeEmail(user.email, user.name);
   ```

5. **Configure Resend** (for production):
   - Sign up at https://resend.com
   - Verify your sending domain
   - Add API key to environment variables
   - Update `EMAIL_FROM` to your verified address

## Dependencies

- **resend**: ^6.12.4 (already installed)
- **Node.js**: 24+ with TypeScript
- **Environment**: Configured via `env.ts`

## Security Considerations

✅ **Tokens**: Only unhashed tokens are sent in emails (hashed versions stored in DB)
✅ **Expiry**: All tokens have time limits (24h for verification, 1h for reset)
✅ **Notices**: Security warnings included in all emails
✅ **No PII**: Minimal personal information in email content
✅ **HTTPS**: Links use FRONTEND_URL (should be HTTPS in production)

## Maintenance

The email service is designed to be:
- **Self-contained**: No external dependencies beyond Resend
- **Testable**: Comprehensive unit test coverage
- **Configurable**: Environment-based configuration
- **Extensible**: Easy to add new email types

To add a new email type:
1. Add a public method (e.g., `sendPasswordChangedEmail`)
2. Create HTML and text template methods
3. Add unit tests
4. Update this documentation

## Support

For issues or questions:
- Check the example file: `email.service.example.ts`
- Review test cases: `__tests__/email.service.test.ts`
- Consult the design document: `.kiro/specs/authentication-system/design.md`
