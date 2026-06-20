import { useState } from "react";
import {
  GraduationCap,
  Upload,
  Settings,
  Sun,
  Moon,
  Library,
  type LucideIcon,
} from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
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
} from "@/components/ui/sidebar";

type TabId = "courses" | "uploads";

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "uploads", label: "Your Uploaded Content", icon: Upload },
];

export function AppSidebar() {
  const [activeTab, setActiveTab] = useState<TabId>("courses");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Library className="size-4" />
          </div>
          <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
            info_hub
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
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
