import type { UserRole } from "@prisma/client";

export type { UserRole };

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Standard error response format for all API errors
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Standard success response format for all API responses
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}
