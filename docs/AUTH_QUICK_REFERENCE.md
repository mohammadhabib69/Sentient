# Authentication API - Quick Reference

> **For complete documentation, see [FRONTEND_API_GUIDE.md](./FRONTEND_API_GUIDE.md)**

## Base URL

```
/v1/auth
```

## Essential Setup

```javascript
// Always include credentials
fetch(url, { credentials: 'include' })

// Or with axios
axios.create({ withCredentials: true })
```

## Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/register` | POST | No | Create new account |
| `/login` | POST | No | Login with email/password |
| `/google` | GET | No | Initiate Google OAuth |
| `/google/callback` | GET | No | Google OAuth callback |
| `/refresh` | POST | Cookie | Get new access token |
| `/logout` | POST | Yes | End current session |
| `/logout-all` | POST | Yes | End all sessions |
| `/me` | GET | Yes | Get current user |
| `/send-verification` | POST | Yes | Resend verification email |
| `/verify-email` | GET | No | Verify email with token |
| `/forgot-password` | POST | No | Request password reset |
| `/reset-password` | POST | No | Reset password with token |
| `/sessions` | GET | Yes | List active sessions |
| `/sessions/:id` | DELETE | Yes | Revoke specific session |

## Cookie Configuration

| Cookie | Duration | Path | Attributes |
|--------|----------|------|------------|
| `access_token` | 15 min | `/` | HttpOnly, Secure, SameSite=Lax |
| `refresh_token` | 30 days | `/v1/auth` | HttpOnly, Secure, SameSite=Lax |

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INVALID_TOKEN` | 400 | Token invalid/expired |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | Trigger refresh |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `RATE_LIMITED` | 429 | Too many requests |
| `ACCOUNT_LOCKED` | 429 | Too many failed logins |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/register` | 5 per hour per IP |
| `/login` | 10 per 15 min per IP |
| `/forgot-password` | 3 per hour per IP |
| `/send-verification` | 3 per hour per user |

## Quick Examples

### Register
```javascript
await api.post('/auth/register', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!'
});
```

### Login
```javascript
await api.post('/auth/login', {
  email: 'john@example.com',
  password: 'SecurePass123!'
});
```

### Get Current User
```javascript
const { data } = await api.get('/auth/me');
console.log(data.user, data.org);
```

### Logout
```javascript
await api.post('/auth/logout');
```

### Token Refresh (Automatic)
```javascript
// Axios interceptor handles this automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.error?.code === 'TOKEN_EXPIRED') {
      await api.post('/auth/refresh');
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

## User Roles

| Role | Level | Permissions |
|------|-------|-------------|
| `super_admin` | 5 | All permissions |
| `org_admin` | 4 | Full org access |
| `manager` | 3 | Create projects, manage tasks |
| `member` | 2 | Create/edit own tasks |
| `guest` | 1 | Read-only access |

## Security Notes

✅ **DO**:
- Always use `credentials: 'include'`
- Implement automatic token refresh
- Use HTTPS in production
- Handle errors gracefully

❌ **DON'T**:
- Store tokens in localStorage
- Access cookies via JavaScript
- Hardcode API URLs
- Reveal whether emails exist

## Common Flows

### Registration → Verification → Login
1. POST `/auth/register` → User created, verification email sent
2. User clicks email link → GET `/auth/verify-email?token=xxx`
3. Email verified → User can login

### Login → Access Protected Resource
1. POST `/auth/login` → Cookies set
2. GET `/auth/me` → Returns user data
3. Access token expires after 15 min → Auto-refresh

### Forgot Password → Reset
1. POST `/auth/forgot-password` → Reset email sent
2. User clicks email link → Shows reset form
3. POST `/auth/reset-password` → Password updated, all sessions revoked
4. User must login again

## Need More Details?

See the complete [Frontend API Integration Guide](./FRONTEND_API_GUIDE.md) for:
- Detailed endpoint documentation
- Complete code examples
- Error handling strategies
- Testing guide
- Troubleshooting tips
