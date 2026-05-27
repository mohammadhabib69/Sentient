import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; orgId: string; role: UserRole };
      orgId?: string;
      requestId?: string;
    }
  }
}

export {};
