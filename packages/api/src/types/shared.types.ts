import type { UserRole } from "@prisma/client";

export type { UserRole };

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { message: string; code?: string } | null;
}
