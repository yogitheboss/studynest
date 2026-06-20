import type { ReactNode } from "react";
import { Library } from "lucide-react";

interface AuthShellProps {
  title: string;
  description: string;
  /** Primary action area (e.g. the Google button). */
  children: ReactNode;
  /** Secondary content below the card actions (e.g. a link to the other page). */
  footer?: ReactNode;
}

export const AuthShell = ({
  title,
  description,
  children,
  footer,
}: AuthShellProps) => {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Library className="size-5" />
          </div>
          <span className="text-lg font-semibold">info_hub</span>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <header className="mb-6 space-y-1.5 text-center">
            <h1 className="text-xl font-semibold text-card-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </header>

          {children}
        </section>

        {footer ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        ) : null}
      </div>
    </main>
  );
};
