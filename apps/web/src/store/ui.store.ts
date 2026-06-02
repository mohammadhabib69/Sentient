import { create } from "zustand";

export interface PresenceUser {
  userId: string;
  page: string;
  lastSeen: string;
}

export interface DashboardMetrics {
  activeTasks: number;
  pendingApprovals: number;
  agentActionsToday: number;
  healthScore: number;
  updatedAt: string;
}

interface UIState {
  // Layout / chrome
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  activeModal: string | null;
  // Realtime
  onlineUsers: Record<string, PresenceUser>;
  dashboardMetrics: DashboardMetrics | null;

  // Layout actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;

  // Realtime actions
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserPage: (userId: string, page: string, lastSeen: string) => void;
  setDashboardMetrics: (metrics: DashboardMetrics) => void;
  clearPresence: () => void;
}

function getInitialSidebarState(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("sentient-sidebar-collapsed");
  if (stored !== null) return JSON.parse(stored);
  // Default: collapsed on mobile, expanded on desktop
  return window.innerWidth < 768;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false, // Will be hydrated on mount
  searchOpen: false,
  activeModal: null,
  onlineUsers: {},
  dashboardMetrics: null,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      if (typeof window !== "undefined") {
        localStorage.setItem("sentient-sidebar-collapsed", JSON.stringify(next));
      }
      return { sidebarCollapsed: next };
    }),

  setSidebarCollapsed: (collapsed: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sentient-sidebar-collapsed", JSON.stringify(collapsed));
    }
    set({ sidebarCollapsed: collapsed });
  },

  setSearchOpen: (open: boolean) => set({ searchOpen: open }),
  openModal: (id: string) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  setUserOnline: (userId) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: {
          userId,
          page: state.onlineUsers[userId]?.page ?? "",
          lastSeen: new Date().toISOString(),
        },
      },
    })),

  setUserOffline: (userId) =>
    set((state) => {
      if (!state.onlineUsers[userId]) return state;
      const next = { ...state.onlineUsers };
      delete next[userId];
      return { onlineUsers: next };
    }),

  setUserPage: (userId, page, lastSeen) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: { userId, page, lastSeen },
      },
    })),

  setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),

  clearPresence: () => set({ onlineUsers: {} }),
}));

// Call this from a useEffect to hydrate sidebar state from localStorage
export function hydrateSidebarState() {
  const collapsed = getInitialSidebarState();
  useUIStore.setState({ sidebarCollapsed: collapsed });
}
