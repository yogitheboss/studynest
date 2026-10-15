import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/app-sidebar";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Simple primary navigation pinned to the bottom of the viewport on small
 * screens. Mirrors the sidebar's tabs so phone users can switch pages without
 * opening the sidebar sheet. Hidden from `md` up, where the sidebar takes over.
 */
export function MobileBottomBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-40 flex border-t md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5" />
            <span>{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
