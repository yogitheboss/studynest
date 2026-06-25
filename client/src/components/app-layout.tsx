import { Outlet } from "react-router-dom";

import { AppSidebar, type AppUser } from "@/components/app-sidebar";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  user: AppUser;
  onSignOut: () => void;
}

/**
 * Presentational shell for authenticated routes: sidebar + header, with nested
 * route content rendered through <Outlet />.
 */
export const AppLayout = ({ user, onSignOut }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar user={user} onSignOut={onSignOut} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-base font-semibold">Dashboard</h1>
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
        <MobileBottomBar />
      </SidebarInset>
    </SidebarProvider>
  );
};
