# Authentication System Setup

This document summarizes the authentication dependencies and environment configuration completed for the Sentient authentication system.

## Installed Dependencies

### Production Dependencies
- **passport** (^0.7.0) - Authentication middleware for Node.js
- **passport-google-oauth20** (^2.0.0) - Google OAuth 2.0 authentication strategy
- **passport-jwt** (^4.0.1) - JWT authentication strategy for Passport
- **jsonwebtoken** (^9.0.3) - JWT token generation and verification (already installed)
- **bcryptjs** (^3.0.3) - Password hashing library (already installed)
- **cookie-parser** (^1.4.7) - Parse HTTP request cookies
- **resend** (^6.12.4) - Email service for transactional emails
- **rate-limit-redis** (^5.0.0) - Redis-backed rate limiting

### Development Dependencies
- **@types/passport** (^1.0.17) - TypeScript definitions for Passport
- **@types/passport-google-oauth20** (^2.0.17) - TypeScript definitions for Google OAuth strategy
- **@types/passport-jwt** (^4.0.1) - TypeScript definitions for JWT strategy
- **@types/cookie-parser** (^1.4.10) - TypeScript definitions for cookie-parser
- **@types/jsonwebtoken** (^9.0.10) - TypeScript definitions for jsonwebtoken (already installed)
- **@types/bcryptjs** (^3.0.0) - TypeScript definitions for bcryptjs (already installed)

## Environment Variables

### Updated Configuration Files

#### `/packages/api/src/config/env.ts`
Added validation for the following new environment variables:
- `GOOGLE_CLIENT_ID` (optional) - Google OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET` (optional) - Google OAuth 2.0 client secret
- `GOOGLE_CALLBACK_URL` (optional) - OAuth callback URL
- `EMAIL_FROM` (optional) - Email sender address for transactional emails
- `FRONTEND_DASHBOARD_URL` (optional) - Frontend dashboard URL for OAuth redirects
- `FRONTEND_LOGIN_URL` (optional) - Frontend login URL for OAuth error redirects

#### `/.env.example`
Updated with the following new variables:
```env
# Google OAuth 2.0 credentials (optional for development)
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/v1/auth/google/callback

# Email sender address (must be verified in Resend)
EMAIL_FROM=noreply@yourdomain.com

# Frontend dashboard URL for OAuth redirects after successful authentication
FRONTEND_DASHBOARD_URL=http://localhost:3000/dashboard

# Frontend login URL for OAuth redirects after failed authentication
FRONTEND_LOGIN_URL=http://localhost:3000/login
```

## Validation

### Environment Variable Validation
All environment variables are validated using Zod schemas in `/packages/api/src/config/env.ts`:
- Required variables will throw an error if missing
- Optional variables can be undefined
- URL fields are validated for proper URL format
- Email fields are validated for proper email format
- JWT_SECRET must be at least 32 characters
- Default values are applied where appropriate

### Tests
Created comprehensive unit tests in `/packages/api/src/config/__tests__/env.test.ts` covering:
- Required environment variable validation
- JWT_SECRET minimum length validation
- Google OAuth URL validation
- Email format validation
- Default value application
- Optional field handling

All tests pass successfully.

## Next Steps

To use these dependencies in your authentication implementation:

1. **Create .env file**: Copy `.env.example` to `.env` and fill in the required values
2. **Google OAuth Setup** (optional):
   - Create a project in Google Cloud Console
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs
   - Copy client ID and secret to .env
3. **Resend Setup** (optional):
   - Sign up for Resend account
   - Verify your sending domain
   - Generate API key
   - Add API key and sender email to .env
4. **JWT Secret**: Generate a secure random string (at least 32 characters) for JWT_SECRET

## Verification

Run the following commands to verify the setup:
```bash
# Type checking
pnpm typecheck

# Run environment validation tests
pnpm test:run src/config/__tests__/env.test.ts

# Run all tests
pnpm test
```

## Requirements Satisfied

This setup satisfies **Requirement 16.9** from the authentication system requirements:
- ✅ All authentication dependencies installed
- ✅ TypeScript type definitions added
- ✅ Environment variables validated with Zod schemas
- ✅ Configuration documented
- ✅ Tests created and passing
