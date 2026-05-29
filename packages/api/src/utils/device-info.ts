import type { Request } from 'express';
import type { DeviceInfo } from '../services/session.service.js';

/**
 * Extracts device information from HTTP request
 * 
 * Parses User-Agent header to extract browser, OS, and device type.
 * Also captures IP address from request.
 * 
 * Requirements: 3.9, 9.2
 */
export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = getClientIp(req);

  return {
    userAgent,
    ip,
    browser: parseBrowser(userAgent),
    os: parseOS(userAgent),
    deviceType: parseDeviceType(userAgent),
  };
}

/**
 * Extracts client IP address from request
 * 
 * Checks X-Forwarded-For header first (for proxies/load balancers),
 * then falls back to socket remote address.
 */
function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to socket remote address
  return req.socket.remoteAddress || 'Unknown';
}

/**
 * Parses browser name from User-Agent string
 */
function parseBrowser(userAgent: string): string {
  // Opera (must check before Chrome as Opera includes Chrome in UA)
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'Opera';
  }

  // Edge (Chromium-based)
  if (userAgent.includes('Edg')) {
    return 'Edge';
  }

  // Chrome (must check before Safari as Chrome includes Safari in UA)
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  }

  // Firefox
  if (userAgent.includes('Firefox')) {
    return 'Firefox';
  }

  // Safari (must check after Chrome/Edge)
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  }

  // Internet Explorer
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    return 'Internet Explorer';
  }

  return 'Unknown';
}

/**
 * Parses operating system from User-Agent string
 */
function parseOS(userAgent: string): string {
  // iOS (must check before macOS as iOS includes "like Mac OS X")
  if (userAgent.includes('iPhone')) {
    return 'iOS (iPhone)';
  }
  if (userAgent.includes('iPad')) {
    return 'iOS (iPad)';
  }

  // Windows
  if (userAgent.includes('Windows NT 10.0')) {
    return 'Windows 10/11';
  }
  if (userAgent.includes('Windows NT 6.3')) {
    return 'Windows 8.1';
  }
  if (userAgent.includes('Windows NT 6.2')) {
    return 'Windows 8';
  }
  if (userAgent.includes('Windows NT 6.1')) {
    return 'Windows 7';
  }
  if (userAgent.includes('Windows')) {
    return 'Windows';
  }

  // macOS
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      const version = match[1].replace('_', '.');
      return `macOS ${version}`;
    }
    return 'macOS';
  }

  // Android
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+\.?\d*)/);
    if (match) {
      return `Android ${match[1]}`;
    }
    return 'Android';
  }

  // Linux
  if (userAgent.includes('Linux')) {
    return 'Linux';
  }

  // Chrome OS
  if (userAgent.includes('CrOS')) {
    return 'Chrome OS';
  }

  return 'Unknown';
}

/**
 * Parses device type from User-Agent string
 */
function parseDeviceType(userAgent: string): string {
  // Tablets (must check before Mobile as some tablets include "Mobile")
  if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    return 'Tablet';
  }

  // Mobile devices
  if (userAgent.includes('Mobile') || (userAgent.includes('Android') && !userAgent.includes('Tablet'))) {
    return 'Mobile';
  }

  // Desktop (default)
  return 'Desktop';
}
