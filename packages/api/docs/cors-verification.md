# CORS Configuration Verification

**Date**: 2025-05-30  
**Task**: 24.2 Verify CORS configuration  
**Status**: ✅ Verified and Passing

## Overview

This document verifies that the CORS (Cross-Origin Resource Sharing) configuration for the Sentient authentication system is properly configured to allow the frontend to communicate with the API using cookies for authentication.

## Configuration Location

**File**: `packages/api/src/app.ts`

## Current CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours - cache preflight requests
  }),
);
```

## Configuration Details

### 1. Origin Configuration ✅

- **Setting**: `origin: process.env.FRONTEND_URL ?? "http://localhost:3000"`
- **Purpose**: Restricts which origins can make cross-origin requests
- **Environment Variable**: `FRONTEND_URL`
- **Default**: `http://localhost:3000` (development)
- **Production**: Should be set to the actual frontend domain (e.g., `https://app.sentient.com`)

**Verification**: 
- ✅ Allows requests from configured frontend origin
- ✅ Rejects requests from unauthorized origins
- ✅ Prevents CORS attacks from malicious sites

### 2. Credentials Support ✅

- **Setting**: `credentials: true`
- **Purpose**: Allows cookies to be sent with cross-origin requests
- **Critical For**: HTTP-only cookie-based authentication (access_token, refresh_token)

**Verification**:
- ✅ `Access-Control-Allow-Credentials: true` header is sent
- ✅ Cookies are accepted in cross-origin requests
- ✅ Frontend can send and receive authentication cookies

### 3. Allowed Methods ✅

- **Setting**: `["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]`
- **Purpose**: Specifies which HTTP methods are allowed for cross-origin requests

**Verification**:
- ✅ GET - Reading user data, sessions, current user
- ✅ POST - Registration, login, logout, token refresh, password reset
- ✅ DELETE - Logout, session revocation
- ✅ OPTIONS - Preflight requests for CORS
- ✅ PUT/PATCH - Future updates to user profile

### 4. Allowed Headers ✅

- **Setting**: `["Content-Type", "Authorization"]`
- **Purpose**: Specifies which request headers can be used

**Verification**:
- ✅ `Content-Type` - Required for JSON request bodies
- ✅ `Authorization` - Available for future token-in-header implementations
- ✅ Headers are properly validated in preflight requests

### 5. Exposed Headers ✅

- **Setting**: `["Set-Cookie"]`
- **Purpose**: Allows the frontend to see Set-Cookie headers in responses
- **Note**: While HTTP-only cookies are not accessible via JavaScript, this header exposure is for CORS compliance

**Verification**:
- ✅ Set-Cookie headers are properly exposed
- ✅ Cookies are set correctly on authentication endpoints

### 6. Preflight Cache ✅

- **Setting**: `maxAge: 86400` (24 hours)
- **Purpose**: Caches preflight OPTIONS requests to reduce overhead
- **Benefit**: Improves performance by reducing preflight requests

**Verification**:
- ✅ Preflight requests are cached for 24 hours
- ✅ Reduces network overhead for authenticated requests

## Integration with Cookie Configuration

The CORS configuration works in conjunction with the cookie settings defined in the authentication service:

### Access Token Cookie
```typescript
{
  httpOnly: true,                          // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',                         // CSRF protection
  maxAge: 15 * 60 * 1000,                  // 15 minutes
  path: '/',                               // Available to all routes
}
```

### Refresh Token Cookie
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,        // 30 days
  path: '/v1/auth',                        // Only sent to auth endpoints
}
```

### Cookie Security Features

1. **httpOnly**: Prevents XSS attacks by making cookies inaccessible to JavaScript
2. **secure**: Ensures cookies are only sent over HTTPS in production
3. **sameSite: 'lax'**: Protects against CSRF while allowing normal navigation
4. **Scoped path**: Refresh token only sent to auth endpoints, minimizing exposure

## Test Coverage

**Test File**: `packages/api/src/tests/cors.test.ts`

### Test Results: ✅ All 14 Tests Passing

1. ✅ **Credentials Support**
   - Allows credentials from frontend origin
   - Includes Access-Control-Allow-Origin header

2. ✅ **Allowed Methods**
   - Allows GET requests
   - Allows POST requests
   - Allows DELETE requests

3. ✅ **Allowed Headers**
   - Allows Content-Type header
   - Allows Authorization header

4. ✅ **Cookie Handling**
   - Accepts cookies in cross-origin requests

5. ✅ **Origin Validation**
   - Rejects requests from unauthorized origins
   - Accepts requests from configured frontend origin

6. ✅ **Preflight Requests**
   - Handles OPTIONS preflight for POST requests
   - Handles OPTIONS preflight for DELETE requests

7. ✅ **Cookie Security Attributes**
   - Verifies SameSite attribute is set to lax
   - Verifies httpOnly flag is set on auth cookies

## Environment Configuration

### Required Environment Variables

```bash
# Frontend origin for CORS
FRONTEND_URL=http://localhost:3000

# Frontend URLs for redirects
FRONTEND_DASHBOARD_URL=http://localhost:3000/dashboard
FRONTEND_LOGIN_URL=http://localhost:3000/login
FRONTEND_VERIFY_EMAIL_URL=http://localhost:3000/verify-email
FRONTEND_RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

### Production Configuration

For production deployment, ensure:

1. **FRONTEND_URL** is set to the actual production frontend domain
2. **HTTPS** is enforced (cookies will have `secure: true`)
3. **Domain validation** is strict (no wildcards unless necessary)
4. **SameSite** remains 'lax' for proper cookie behavior

## Security Considerations

### ✅ Implemented Security Features

1. **Origin Restriction**: Only configured frontend can make requests
2. **Credential Protection**: Cookies are HTTP-only and secure in production
3. **CSRF Protection**: SameSite=lax prevents cross-site request forgery
4. **XSS Protection**: HTTP-only cookies prevent JavaScript access
5. **Generic Error Messages**: Login errors don't reveal if email exists
6. **Rate Limiting**: Prevents brute force attacks
7. **Token Rotation**: Refresh tokens are rotated on every use

### ⚠️ Important Notes

1. **Never use wildcard origins** (`*`) with `credentials: true` - this is a security risk
2. **Always validate** the FRONTEND_URL environment variable in production
3. **Monitor** CORS errors in production logs to detect misconfigurations
4. **Test** CORS configuration after any domain changes

## Frontend Integration Requirements

For the frontend to successfully communicate with the API:

1. **Include credentials in requests**:
   ```typescript
   fetch('http://localhost:3001/v1/auth/me', {
     credentials: 'include',  // Required for cookies
     headers: {
       'Content-Type': 'application/json'
     }
   })
   ```

2. **Handle CORS errors gracefully**:
   - Check for network errors
   - Verify FRONTEND_URL matches the actual frontend origin
   - Ensure cookies are being sent with requests

3. **Use the correct API base URL**:
   - Development: `http://localhost:3001`
   - Production: Set via environment variable

## Verification Checklist

- ✅ CORS middleware is configured in `app.ts`
- ✅ Origin is set to `FRONTEND_URL` environment variable
- ✅ Credentials are enabled (`credentials: true`)
- ✅ All required HTTP methods are allowed
- ✅ Content-Type and Authorization headers are allowed
- ✅ Set-Cookie header is exposed
- ✅ Preflight caching is configured (24 hours)
- ✅ Cookie security attributes are properly set
- ✅ All CORS tests are passing (14/14)
- ✅ Environment variables are documented
- ✅ Security considerations are addressed

## Conclusion

The CORS configuration for the Sentient authentication system is **properly configured and verified**. All tests are passing, and the configuration meets the requirements for:

1. ✅ Allowing credentials (cookies) from frontend origin
2. ✅ Configuring allowed origins, methods, and headers
3. ✅ Supporting HTTP-only cookie-based authentication
4. ✅ Protecting against CORS-related security vulnerabilities
5. ✅ Enabling seamless frontend-backend communication

The system is ready for frontend integration and production deployment with proper environment variable configuration.

## References

- **Requirements**: Integration requirements (Requirement 17)
- **Design Document**: `packages/api/docs/authentication-design.md`
- **CORS Middleware**: `packages/api/src/app.ts`
- **Test Suite**: `packages/api/src/tests/cors.test.ts`
- **Cookie Configuration**: Defined in auth service token generation methods
