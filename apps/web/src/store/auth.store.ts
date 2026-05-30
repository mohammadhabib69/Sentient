import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Organization } from "@/types/organization.types";

interface AuthState {
  user: User | null;
  org: Organization | null;
  setAuth: (user: User, org: Organization) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      setAuth: (user, org) => set({ user, org }),
      clearAuth: () => set({ user: null, org: null }),
    }),
    {
      name: "sentient-auth",
    },
  ),
);
