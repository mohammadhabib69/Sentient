import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  searchOpen: boolean
  activeModal: string | null
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSearchOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
}

function getInitialSidebarState(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('sentient-sidebar-collapsed')
  if (stored !== null) return JSON.parse(stored)
  // Default: collapsed on mobile, expanded on desktop
  return window.innerWidth < 768
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false, // Will be hydrated on mount
  searchOpen: false,
  activeModal: null,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed
      if (typeof window !== 'undefined') {
        localStorage.setItem('sentient-sidebar-collapsed', JSON.stringify(next))
      }
      return { sidebarCollapsed: next }
    }),

  setSidebarCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentient-sidebar-collapsed', JSON.stringify(collapsed))
    }
    set({ sidebarCollapsed: collapsed })
  },

  setSearchOpen: (open: boolean) => set({ searchOpen: open }),
  openModal: (id: string) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))

// Call this from a useEffect to hydrate sidebar state from localStorage
export function hydrateSidebarState() {
  const collapsed = getInitialSidebarState()
  useUIStore.setState({ sidebarCollapsed: collapsed })
}
