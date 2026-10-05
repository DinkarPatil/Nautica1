"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Field, cn } from "../primitives";
import { PortPickerField } from "./PortPickerField";
import type { VoyageDraft } from "./types";
import type { Port } from "@/types/voyage";

export function VoyageCreateForm({
  draft,
  onChange,
  className,
}: {
  draft: VoyageDraft;
  onChange: (next: VoyageDraft) => void;
  className?: string;
}) {
  const set = <K extends keyof VoyageDraft>(k: K, v: VoyageDraft[K]) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className={cn("space-y-8", className)}>
      <FormSection title="Vessel">
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="shipName"
            label="Ship name"
            required
            value={draft.shipName}
            onChange={(v) => set("shipName", v)}
            placeholder="e.g. MV Nordic Falcon"
          />
          <Field
            name="imo"
            label="IMO number"
            value={draft.imo}
            onChange={(v) => set("imo", v)}
            placeholder="7-digit"
            hint="auto-validated against IHS"
          />
        </div>
        <Field
          name="voyageType"
          label="Voyage type"
          type="select"
          options={["Cargo", "Container", "Tanker", "Other"]}
          value={draft.voyageType}
          onChange={(v) => set("voyageType", v)}
        />
      </FormSection>

      <FormSection title="Route">
        <PortPickerField
          name="origin"
          label="Origin port"
          required
          value={draft.origin}
          onChange={(p?: Port) => set("origin", p)}
        />
        <PortPickerField
          name="destination"
          label="Destination port"
          required
          value={draft.destination}
          onChange={(p?: Port) => set("destination", p)}
        />
      </FormSection>

      <FormSection title="Schedule">
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="plannedDeparture"
            label="Planned departure"
            type="datetime"
            required
            value={draft.plannedDeparture}
            onChange={(v) => set("plannedDeparture", v)}
          />
          <Field
            name="plannedArrival"
            label="Planned arrival (optional)"
            type="datetime"
            value={draft.plannedArrival}
            onChange={(v) => set("plannedArrival", v)}
          />
        </div>
      </FormSection>

      <FormSection title="Monitoring">
        <Field
          name="sensitivity"
          label="Sensitivity"
          type="segment"
          options={["Normal", "Strict", "Critical"]}
          value={draft.sensitivity}
          onChange={(v) => set("sensitivity", v)}
        />
        <Field
          name="trackingMode"
          label="Tracking mode"
          type="segment"
          options={["Real-time", "Scheduled", "Manual"]}
          value={draft.trackingMode}
          onChange={(v) => set("trackingMode", v)}
        />
        <Field
          name="alertPreference"
          label="Alerts"
          type="segment"
          options={["ETA only", "Route only", "Full intelligence"]}
          value={draft.alertPreference}
          onChange={(v) => set("alertPreference", v)}
        />
      </FormSection>

      <CollapsibleSection title="Intelligence (optional)">
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="cargoPriority"
            label="Cargo priority"
            type="select"
            options={["Standard", "High", "Critical"]}
            value={draft.cargoPriority}
            onChange={(v) => set("cargoPriority", v)}
          />
          <Field
            name="delayToleranceMin"
            label="Delay tolerance (minutes)"
            type="number"
            value={draft.delayToleranceMin}
            onChange={(v) => set("delayToleranceMin", v)}
            placeholder="60"
          />
        </div>
        <Field
          name="preferredRoute"
          label="Preferred route"
          value={draft.preferredRoute}
          onChange={(v) => set("preferredRoute", v)}
          placeholder="e.g. via Gibraltar–Bonifacio"
        />
        <Field
          name="watchlistCompany"
          label="Watchlist company"
          value={draft.watchlistCompany}
          onChange={(v) => set("watchlistCompany", v)}
        />
        <Field
          name="notes"
          label="Notes"
          type="textarea"
          rows={3}
          value={draft.notes}
          onChange={(v) => set("notes", v)}
        />
      </CollapsibleSection>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[13px] font-medium tracking-[-0.005em] text-voyage-text">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 text-[13px] font-medium text-voyage-text hover:text-voyage-text"
      >
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-voyage-text-3 transition-transform duration-200", open && "rotate-180")}
        />
        {title}
      </button>
      {open && <div className="space-y-4 pt-2">{children}</div>}
    </section>
  );
}
