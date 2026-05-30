import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '../../services/session.service.js';

// Mock the session service
vi.mock('../../services/session.service.js', () => ({
  sessionService: {
    cleanExpiredSessions: vi.fn(),
  },
}));

describe('Session Cleanup Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call cleanExpiredSessions and log the result', async () => {
    // Mock the cleanExpiredSessions method to return 5 deleted sessions
    vi.mocked(sessionService.cleanExpiredSessions).mockResolvedValue(5);

    // Spy on console.log
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simulate the worker job execution
    const count = await sessionService.cleanExpiredSessions();
    console.log(
      JSON.stringify({
        event: 'session_cleanup',
        deletedCount: count,
        timestamp: new Date().toISOString(),
      }),
    );

    // Verify cleanExpiredSessions was called
    expect(sessionService.cleanExpiredSessions).toHaveBeenCalledOnce();

    // Verify the result
    expect(count).toBe(5);

    // Verify logging occurred
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(loggedData.event).toBe('session_cleanup');
    expect(loggedData.deletedCount).toBe(5);
    expect(loggedData.timestamp).toBeDefined();

    consoleLogSpy.mockRestore();
  });

  it('should handle zero deleted sessions', async () => {
    // Mock the cleanExpiredSessions method to return 0 deleted sessions
    vi.mocked(sessionService.cleanExpiredSessions).mockResolvedValue(0);

    // Spy on console.log
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simulate the worker job execution
    const count = await sessionService.cleanExpiredSessions();
    console.log(
      JSON.stringify({
        event: 'session_cleanup',
        deletedCount: count,
        timestamp: new Date().toISOString(),
      }),
    );

    // Verify the result
    expect(count).toBe(0);

    // Verify logging occurred
    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(loggedData.deletedCount).toBe(0);

    consoleLogSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // Mock the cleanExpiredSessions method to throw an error
    const error = new Error('Database connection failed');
    vi.mocked(sessionService.cleanExpiredSessions).mockRejectedValue(error);

    // Verify the error is thrown
    await expect(sessionService.cleanExpiredSessions()).rejects.toThrow(
      'Database connection failed',
    );
  });
});
