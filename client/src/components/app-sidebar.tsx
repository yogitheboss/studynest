import { useMemo } from "react";
import {
  GraduationCap,
  Upload,
  Settings,
  Sun,
  Moon,
  Library,
  LogOut,
  type LucideIcon,
} from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { useUIStore, type AppTab } from "@/stores/ui-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

/** Minimal user shape the shell needs to render. */
export interface AppUser {
  name: string;
  email: string;
  image?: string | null;
}

interface AppSidebarProps {
  user: AppUser;
  onSignOut: () => void;
}

export interface NavItem {
  id: AppTab;
  label: string;
  icon: LucideIcon;
  /** Shorter label for the cramped mobile bottom bar. */
  shortLabel: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "courses",
    label: "Courses",
    shortLabel: "Courses",
    icon: GraduationCap,
  },
  {
    id: "uploads",
    label: "Your Uploaded Content",
    shortLabel: "Uploads",
    icon: Upload,
  },
];

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function AppSidebar({ user, onSignOut }: AppSidebarProps) {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const initials = useMemo(() => getInitials(user.name), [user.name]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Library className="size-4" />
          </div>
          <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
            StudyNest
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {isDark ? <Sun /> : <Moon />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={user.email}
              className="cursor-default hover:bg-transparent active:bg-transparent"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="size-8 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium">
                  {initials}
                </span>
              )}
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={onSignOut}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
