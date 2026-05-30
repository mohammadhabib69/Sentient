# Sentient Documentation

Welcome to the Sentient project documentation. This directory contains comprehensive guides for developers working on different aspects of the platform.

## 📚 Documentation Index

### For Frontend Developers

#### 🔐 Authentication Integration
- **[Frontend API Integration Guide](./FRONTEND_API_GUIDE.md)** - **START HERE**
  - Complete guide for integrating with the authentication API
  - Cookie handling and token refresh implementation
  - All endpoints with request/response examples
  - React code examples and best practices
  - Error handling and troubleshooting
  - Testing guide

- **[Quick Reference](./AUTH_QUICK_REFERENCE.md)**
  - Quick lookup for endpoints, error codes, and rate limits
  - Essential code snippets
  - Common authentication flows

- **[API Authentication](./API_AUTHENTICATION.md)**
  - Backend API reference
  - Detailed endpoint specifications

### For Backend Developers

- **[Architecture](./ARCHITECTURE.md)**
  - System architecture overview
  - Component interactions
  - Technology stack

- **[Database](./DATABASE.md)**
  - Database schema
  - Migrations guide
  - Data models

- **[Development](./DEVELOPMENT.md)**
  - Development environment setup
  - Local development workflow
  - Debugging tips

- **[Setup](./SETUP.md)**
  - Initial project setup
  - Environment configuration
  - Dependencies installation

### For DevOps

- **[Branch Protection](./branch-protection.md)**
  - Git workflow
  - Branch protection rules
  - CI/CD pipeline

## 🚀 Quick Start for Frontend Developers

### 1. Read the Integration Guide

Start with the [Frontend API Integration Guide](./FRONTEND_API_GUIDE.md) to understand:
- How authentication works
- Cookie handling (HTTP-only cookies)
- Token refresh implementation
- All available endpoints

### 2. Set Up Your Environment

```bash
# Add to your .env file
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Configure API Client

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // CRITICAL: Always include this
});

// Add token refresh interceptor
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

export default api;
```

### 4. Implement Authentication

See complete examples in the [Frontend API Integration Guide](./FRONTEND_API_GUIDE.md#code-examples):
- Authentication Context (React)
- Protected Routes
- Login/Register Forms
- Error Handling

## 📖 Common Use Cases

### Registering a New User
```javascript
await api.post('/auth/register', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!'
});
```

### Logging In
```javascript
await api.post('/auth/login', {
  email: 'john@example.com',
  password: 'SecurePass123!'
});
```

### Getting Current User
```javascript
const { data } = await api.get('/auth/me');
console.log(data.user, data.org);
```

### Logging Out
```javascript
await api.post('/auth/logout');
```

## 🔍 Finding What You Need

| I want to... | Read this |
|--------------|-----------|
| Integrate authentication in my frontend app | [Frontend API Integration Guide](./FRONTEND_API_GUIDE.md) |
| Look up an endpoint quickly | [Quick Reference](./AUTH_QUICK_REFERENCE.md) |
| Understand the system architecture | [Architecture](./ARCHITECTURE.md) |
| Set up my development environment | [Setup](./SETUP.md) + [Development](./DEVELOPMENT.md) |
| Understand the database schema | [Database](./DATABASE.md) |
| Learn about API endpoints in detail | [API Authentication](./API_AUTHENTICATION.md) |

## 🆘 Getting Help

1. **Check the documentation** - Most questions are answered in the guides above
2. **Review code examples** - The Frontend API Integration Guide has complete working examples
3. **Check the troubleshooting section** - Common issues and solutions are documented
4. **Ask the team** - If you're still stuck, reach out to the backend team

## 📝 Contributing to Documentation

Found an error or want to improve the documentation?

1. Make your changes
2. Submit a pull request
3. Tag the documentation maintainer for review

## 🔗 Related Resources

- [Project README](../README.md) - Main project documentation
- [API Postman Collection](../postman/collections/) - Test API endpoints
- [PRD Documents](../PRD/) - Product requirements

---

**Last Updated**: May 30, 2026  
**Maintained By**: Backend Team
