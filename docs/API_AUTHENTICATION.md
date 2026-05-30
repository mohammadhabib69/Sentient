# Authentication API Documentation

## Overview

The Sentient Authentication API provides comprehensive user authentication and authorization capabilities including:

- **Email/Password Authentication**: Traditional registration and login
- **Google OAuth 2.0**: Social authentication
- **JWT-based Sessions**: Secure token-based authentication with automatic refresh
- **Email Verification**: Secure email confirmation flow
- **Password Reset**: Self-service password recovery
- **Multi-device Session Management**: View and revoke sessions across devices
- **Role-Based Access Control (RBAC)**: Five-tier permission system
- **Rate Limiting**: Protection against brute force attacks

## Base URL

All authentication endpoints are prefixed with:

```
/v1/auth
```

**Example**: `https://api.sentient.com/v1/auth/register`

## Authentication Method

The API uses **HTTP-only cookies** for token storage, providing protection against XSS attacks. Two cookies are used:

1. **`access_token`**: Short-lived JWT (15 minutes) for API authentication
2. **`refresh_token`**: Long-lived opaque token (30 days) for obtaining new access tokens

### Cookie Configuration

| Cookie | Duration | Path | Attributes |
|--------|----------|------|------------|
| `access_token` | 15 minutes | `/` | `httpOnly`, `secure` (production), `sameSite=lax` |
| `refresh_token` | 30 days | `/v1/auth` | `httpOnly`, `secure` (production), `sameSite=lax` |

**Important**: The frontend does NOT need to manually handle these cookies. The browser automatically includes them in requests.


## Token Refresh Flow

When an access token expires (after 15 minutes), the frontend should:

1. Detect a `401 Unauthorized` response with `TOKEN_EXPIRED` error code
2. Call `POST /v1/auth/refresh` to obtain new tokens
3. Retry the original request with the new access token

**Example Flow**:

```javascript
async function apiRequest(url, options) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include', // CRITICAL: Include cookies
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    const errorData = await response.json();
    if (errorData.error?.code === 'TOKEN_EXPIRED') {
      // Refresh tokens
      const refreshResponse = await fetch('/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry original request
        response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
      }
    }
  }

  return response;
}
```


## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional context
    }
  }
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_TOKEN` | Token is invalid or expired |
| 400 | `EMAIL_ALREADY_VERIFIED` | Email is already verified |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 401 | `TOKEN_EXPIRED` | Access token has expired (trigger refresh) |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 403 | `RESOURCE_ACCESS_DENIED` | User cannot access this resource |
| 409 | `EMAIL_EXISTS` | Email already registered |
| 429 | `RATE_LIMITED` | Too many requests |
| 429 | `ACCOUNT_LOCKED` | Account locked due to failed login attempts |
| 500 | `INTERNAL_ERROR` | Unexpected server error |


---

## API Endpoints

### 1. Register

Create a new user account with email and password.

**Endpoint**: `POST /v1/auth/register`

**Rate Limit**: 5 requests per hour per IP address

**Authentication**: None required

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules**:
- `name`: 2-100 characters
- `email`: Valid email format, automatically converted to lowercase
- `password`: Minimum 8 characters, must contain:
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character

**Success Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "super_admin",
      "emailVerified": false,
      "avatarUrl": null
    },
    "org": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe's Organization",
      "slug": "john-does-organization",
      "plan": "free"
    }
  }
}
```

