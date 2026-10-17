import { useMemo, useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { todayKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlan } from "../hooks/usePlan";
import { groupItems } from "../lib/groupItems";
import type { PlanItem, PlanSettings } from "../types";
import { AddSubjectsDialog } from "./AddSubjectsDialog";
import { PlanItemRow } from "./PlanItemRow";
import { PlanProgress } from "./PlanProgress";
import { PlanSetupForm } from "./PlanSetupForm";

interface SectionProps {
  title: string;
  danger?: boolean;
  children: ReactNode;
}

const Section = ({ title, danger, children }: SectionProps) => (
  <section className="flex flex-col gap-2">
    <h3
      className={cn(
        "text-xs font-semibold uppercase",
        danger ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {title}
    </h3>
    {children}
  </section>
);

export const PlanView = () => {
  const { plan, loading, error, actions } = usePlan();
  const [adding, setAdding] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // ponytail: read once per render; a tab left open past midnight shows
  // yesterday until something re-renders.
  const today = todayKey();

  const groups = useMemo(
    () => groupItems(plan?.items ?? [], today),
    [plan, today]
  );
  const notesById = useMemo(
    () => new Map((plan?.items ?? []).map((i) => [i.id, i.notes])),
    [plan]
  );

  if (loading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (error) return <p className="text-destructive text-sm">{error}</p>;

  if (!plan) {
    return (
      <div className="bg-card mx-auto w-full max-w-md rounded-lg border p-4">
        <h2 className="mb-1 text-xl font-semibold">Set up your exam</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Then paste your plan and the app tracks it day by day.
        </p>
        <PlanSetupForm submitLabel="Start plan" onSave={actions.saveSettings} />
      </div>
    );
  }

  const saveSettings = async (settings: PlanSettings) => {
    await actions.saveSettings(settings);
    setEditing(false);
  };

  const renderRows = (items: PlanItem[], showDate: boolean) => (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <PlanItemRow
          key={item.id}
          item={item}
          today={today}
          showDate={showDate}
          sourceNotes={item.sourceId ? notesById.get(item.sourceId) : undefined}
          actions={actions}
          onError={setActionError}
        />
      ))}
    </ul>
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PlanProgress
        plan={plan}
        today={today}
        overdueCount={groups.overdue.length}
      />

      <div className="flex gap-2">
        <Button className="h-11 flex-1 md:h-9" onClick={() => setAdding(true)}>
          <Plus />
          Add subjects
        </Button>
        <Button
          variant="outline"
          className="h-11 md:h-9"
          onClick={() => setEditing(true)}
        >
          <Pencil />
          Edit exam
        </Button>
      </div>

      {actionError && (
        <p className="text-destructive text-sm" role="alert">
          {actionError}
        </p>
      )}

      {plan.items.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          No subjects yet. Tap “Add subjects” and paste your plan.
        </p>
      ) : (
        <>
          {groups.overdue.length > 0 && (
            <Section title={`Overdue (${groups.overdue.length})`} danger>
              {renderRows(groups.overdue, true)}
            </Section>
          )}
          <Section title="Today">
            {groups.today.length ? (
              renderRows(groups.today, false)
            ) : (
              <p className="text-muted-foreground text-sm">
                Nothing planned today. Clear the backlog or get ahead.
              </p>
            )}
          </Section>
          {groups.upcoming.length > 0 && (
            <Section title="Next 7 days">
              {renderRows(groups.upcoming, true)}
            </Section>
          )}
          {groups.laterCount > 0 && (
            <p className="text-muted-foreground text-center text-xs">
              +{groups.laterCount} more planned after that
            </p>
          )}
        </>
      )}

      <AddSubjectsDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={actions.addItems}
      />
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit exam</DialogTitle>
          </DialogHeader>
          <PlanSetupForm
            initial={plan}
            submitLabel="Save"
            onSave={saveSettings}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
