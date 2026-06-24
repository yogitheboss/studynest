import { create } from "zustand";

/** Top-level content tab, shared between the sidebar and the bottom bar. */
export type AppTab = "courses" | "uploads";

interface UIState {
  /** Whether the app sidebar is collapsed. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Which primary page is shown on the right. */
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

/**
 * Shared, domain-agnostic UI state that needs to be read across features
 * (e.g. layout chrome). Keep feature-specific state inside its feature instead.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  activeTab: "courses",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
