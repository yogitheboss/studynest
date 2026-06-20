import "./App.css";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">Dashboard</h1>
          </header>
          <main className="flex-1 p-4">
            <div className="text-2xl">Hello, World!</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
