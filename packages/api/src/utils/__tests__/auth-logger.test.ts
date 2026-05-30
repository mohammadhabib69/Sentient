import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authLogger } from '../auth-logger.js';

describe('authLogger', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('authError', () => {
    it('should log error with all context fields', () => {
      const error = new Error('Test error');
      const ip = '192.168.1.1';
      const userId = 'user-123';
      const method = 'POST';
      const path = '/v1/auth/login';

      authLogger.authError(error, ip, userId, method, path);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        event: 'auth_error',
        userId: 'user-123',
        ip: '192.168.1.1',
        errorMessage: 'Test error',
        method: 'POST',
        path: '/v1/auth/login',
      });
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.stackTrace).toBeDefined();
    });

    it('should log error without optional fields', () => {
      const error = new Error('Test error');
      const ip = '192.168.1.1';

      authLogger.authError(error, ip);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        event: 'auth_error',
        ip: '192.168.1.1',
        errorMessage: 'Test error',
      });
      expect(loggedData.userId).toBeUndefined();
      expect(loggedData.method).toBeUndefined();
      expect(loggedData.path).toBeUndefined();
    });

    it('should handle error with code property', () => {
      const error = { message: 'Unauthorized', code: 'UNAUTHORIZED' };
      const ip = '192.168.1.1';

      authLogger.authError(error, ip);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        event: 'auth_error',
        ip: '192.168.1.1',
        errorMessage: 'Unauthorized',
        errorCode: 'UNAUTHORIZED',
      });
    });

    it('should handle null/undefined errors gracefully', () => {
      const ip = '192.168.1.1';

      authLogger.authError(null, ip);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        event: 'auth_error',
        ip: '192.168.1.1',
        errorMessage: 'null',
      });
      expect(loggedData.errorCode).toBeUndefined();
    });

    it('should handle string errors', () => {
      const error = 'Something went wrong';
      const ip = '192.168.1.1';

      authLogger.authError(error, ip);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        event: 'auth_error',
        ip: '192.168.1.1',
        errorMessage: 'Something went wrong',
      });
    });

    it('should output valid JSON format', () => {
      const error = new Error('Test error');
      const ip = '192.168.1.1';

      authLogger.authError(error, ip);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = consoleLogSpy.mock.calls[0][0];

      // Should be valid JSON
      expect(() => JSON.parse(logOutput)).not.toThrow();

      const parsed = JSON.parse(logOutput);
      expect(parsed.event).toBe('auth_error');
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
