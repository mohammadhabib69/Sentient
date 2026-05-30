// Test environment setup
// This file provides mock environment variables for testing

process.env.DATABASE_URL = 'postgresql://sentient:sentient@localhost:5432/sentient';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEO4J_URI = 'bolt://localhost:7687';
process.env.NEO4J_USER = 'neo4j';
process.env.NEO4J_PASSWORD = 'sentient-neo4j-password';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.COOKIE_SECRET = 'test-cookie-secret-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.FRONTEND_DASHBOARD_URL = 'http://localhost:3000/dashboard';
process.env.FRONTEND_LOGIN_URL = 'http://localhost:3000/login';
process.env.FRONTEND_VERIFY_EMAIL_URL = 'http://localhost:3000/verify-email';
process.env.FRONTEND_RESET_PASSWORD_URL = 'http://localhost:3000/reset-password';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/v1/auth/google/callback';
process.env.EMAIL_FROM = 'test@example.com';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.NODE_ENV = 'test';
