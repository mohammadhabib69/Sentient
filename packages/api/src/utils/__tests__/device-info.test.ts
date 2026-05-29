import { describe, it, expect } from 'vitest';
import { extractDeviceInfo } from '../device-info.js';
import type { Request } from 'express';

// Helper to create mock request
function createMockRequest(
  userAgent: string,
  headers: Record<string, string> = {},
  remoteAddress = '127.0.0.1'
): Partial<Request> {
  return {
    headers: {
      'user-agent': userAgent,
      ...headers,
    },
    socket: {
      remoteAddress,
    } as any,
  };
}

describe('extractDeviceInfo', () => {
  describe('IP address extraction', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = createMockRequest('test', {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      });

      const result = extractDeviceInfo(req as Request);

      expect(result.ip).toBe('203.0.113.1');
    });

    it('should extract IP from X-Real-IP header if X-Forwarded-For not present', () => {
      const req = createMockRequest('test', {
        'x-real-ip': '203.0.113.5',
      });

      const result = extractDeviceInfo(req as Request);

      expect(result.ip).toBe('203.0.113.5');
    });

    it('should fall back to socket remote address', () => {
      const req = createMockRequest('test', {}, '192.168.1.100');

      const result = extractDeviceInfo(req as Request);

      expect(result.ip).toBe('192.168.1.100');
    });

    it('should handle missing remote address', () => {
      const req = {
        headers: { 'user-agent': 'test' },
        socket: {},
      };

      const result = extractDeviceInfo(req as Request);

      expect(result.ip).toBe('Unknown');
    });
  });

  describe('Browser detection', () => {
    it('should detect Chrome', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Chrome');
    });

    it('should detect Edge (Chromium)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Edge');
    });

    it('should detect Firefox', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Firefox');
    });

    it('should detect Safari', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Safari');
    });

    it('should detect Opera', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Opera');
    });

    it('should detect Internet Explorer', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Internet Explorer');
    });

    it('should return Unknown for unrecognized browser', () => {
      const req = createMockRequest('CustomBrowser/1.0');

      const result = extractDeviceInfo(req as Request);

      expect(result.browser).toBe('Unknown');
    });
  });

  describe('Operating system detection', () => {
    it('should detect Windows 10/11', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Windows 10/11');
    });

    it('should detect Windows 8.1', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Windows 8.1');
    });

    it('should detect Windows 7', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Windows 7');
    });

    it('should detect macOS with version', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('macOS 10.15');
    });

    it('should detect macOS without version', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('macOS');
    });

    it('should detect iOS (iPhone)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('iOS (iPhone)');
    });

    it('should detect iOS (iPad)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('iOS (iPad)');
    });

    it('should detect Android with version', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Android 14');
    });

    it('should detect Android without version', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Linux; Android) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Android');
    });

    it('should detect Linux', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Linux');
    });

    it('should detect Chrome OS', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (X11; CrOS x86_64 15236.80.0) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Chrome OS');
    });

    it('should return Unknown for unrecognized OS', () => {
      const req = createMockRequest('CustomOS/1.0');

      const result = extractDeviceInfo(req as Request);

      expect(result.os).toBe('Unknown');
    });
  });

  describe('Device type detection', () => {
    it('should detect Mobile device', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Mobile');
    });

    it('should detect Android mobile', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Mobile');
    });

    it('should detect Tablet (iPad)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Tablet');
    });

    it('should detect Tablet (Android)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Tablet'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Tablet');
    });

    it('should detect Desktop (default)', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Desktop');
    });

    it('should detect Desktop for macOS', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result.deviceType).toBe('Desktop');
    });
  });

  describe('Complete device info extraction', () => {
    it('should extract all device info for Chrome on Windows', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        { 'x-forwarded-for': '203.0.113.1' }
      );

      const result = extractDeviceInfo(req as Request);

      expect(result).toEqual({
        userAgent: expect.any(String),
        ip: '203.0.113.1',
        browser: 'Chrome',
        os: 'Windows 10/11',
        deviceType: 'Desktop',
      });
    });

    it('should extract all device info for Safari on macOS', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        {},
        '192.168.1.100'
      );

      const result = extractDeviceInfo(req as Request);

      expect(result).toEqual({
        userAgent: expect.any(String),
        ip: '192.168.1.100',
        browser: 'Safari',
        os: 'macOS 10.15',
        deviceType: 'Desktop',
      });
    });

    it('should extract all device info for mobile Chrome on Android', () => {
      const req = createMockRequest(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        { 'x-real-ip': '203.0.113.50' }
      );

      const result = extractDeviceInfo(req as Request);

      expect(result).toEqual({
        userAgent: expect.any(String),
        ip: '203.0.113.50',
        browser: 'Chrome',
        os: 'Android 14',
        deviceType: 'Mobile',
      });
    });

    it('should handle missing User-Agent gracefully', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      };

      const result = extractDeviceInfo(req as Request);

      expect(result).toEqual({
        userAgent: 'Unknown',
        ip: '127.0.0.1',
        browser: 'Unknown',
        os: 'Unknown',
        deviceType: 'Desktop',
      });
    });
  });
});
