"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowDownCircle } from "lucide-react";
import { voyageApiLive } from "@/lib/voyage/voyageApiClient";
import type { VoyageAlert, VoyageTriage, TriageItem, AlertLifecycle } from "@/types/voyage";
import { cn } from "../primitives/cn";

/**
 * Alerts & Evidence board.
 *
 * UX rules:
 *  - The list is *already* sorted by triage rank — no filters, no controls.
 *  - Each alert renders its triage explanation, source provenance, and two
 *    actions (Acknowledge, Resolve). That's the only interactive surface.
 *  - Resolved alerts collapse into a "history" tail at the bottom.
 */
export function VoyageAlertsBoard({
  voyageId,
  alerts,
  triage,
}: {
  voyageId: string;
  alerts: VoyageAlert[];
  triage: VoyageTriage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triageById = useMemo(() => {
    const map: Record<string, TriageItem> = {};
    for (const t of triage.items) map[t.alertId] = t;
    return map;
  }, [triage]);

  const open = useMemo(
    () =>
      alerts
        .filter((a) => lifecycleOf(a) !== "resolved")
        .sort((a, b) => {
          const ra = triageById[a.id]?.rank ?? 999;
          const rb = triageById[b.id]?.rank ?? 999;
          if (ra !== rb) return ra - rb;
          return new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime();
        }),
    [alerts, triageById],
  );
  const resolved = useMemo(
    () =>
      alerts
        .filter((a) => lifecycleOf(a) === "resolved")
        .sort((a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()),
    [alerts],
  );

  const handle = (alertId: string, action: "ack" | "resolve") => {
    setError(null);
    setBusyId(alertId);
    startTransition(async () => {
      try {
        if (action === "ack") {
          await voyageApiLive.ackAlert(voyageId, alertId);
        } else {
          await voyageApiLive.resolveAlert(voyageId, alertId);
        }
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "alert update failed";
        setError(message);
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-3" data-testid="voyage-alerts-open">
        {open.length === 0 ? (
          <div className="rounded-md border border-voyage-border-2 bg-voyage-elevated/40 p-6 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-voyage-ok mb-2" />
            <p className="text-[13px] text-voyage-text">No open alerts. Voyage is in a clean state.</p>
          </div>
        ) : (
          open.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              triage={triageById[a.id]}
              busy={busyId === a.id || pending}
              onAck={() => handle(a.id, "ack")}
              onResolve={() => handle(a.id, "resolve")}
            />
          ))
        )}
        {error && (
          <p className="text-[12px] text-voyage-bad" data-testid="voyage-alerts-error">
            {error}
          </p>
        )}
      </div>

      <aside className="col-span-12 lg:col-span-4 space-y-4">
        <div className="vg-card p-5">
          <p className="vg-label mb-2">Triage summary</p>
          <p className="text-[13px] text-voyage-text-2">
            {triage.items.length === 0
              ? "Triage will appear here once alerts are ranked."
              : `${triage.items.filter((t) => t.actionNow).length} of ${triage.items.length} need action now.`}
          </p>
          <p className="text-[11px] text-voyage-text-3 mt-2">
            Generated {new Date(triage.generatedAt).toLocaleString()}
          </p>
        </div>
        {resolved.length > 0 && (
          <div className="vg-card p-5">
            <p className="vg-label mb-3">Resolved ({resolved.length})</p>
            <ul className="space-y-2">
              {resolved.map((a) => (
                <li key={a.id} className="text-[12px] text-voyage-text-3" data-testid={`voyage-alert-resolved-${a.id}`}>
                  <CheckCircle2 className="inline w-3 h-3 mr-1 text-voyage-ok" />
                  <span className="text-voyage-text-2">{a.title}</span>
                  <span className="ml-2 text-voyage-text-3">
                    {a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function lifecycleOf(a: VoyageAlert): AlertLifecycle {
  return a.lifecycle ?? (a.resolvedAt ? "resolved" : a.acknowledged ? "acknowledged" : "new");
}

function AlertCard({
  alert: a,
  triage,
  busy,
  onAck,
  onResolve,
}: {
  alert: VoyageAlert;
  triage?: TriageItem;
  busy: boolean;
  onAck: () => void;
  onResolve: () => void;
}) {
  const sev = a.severity;
  const lifecycle = lifecycleOf(a);
  const Icon = sev === "danger" ? ShieldAlert : sev === "warning" ? AlertTriangle : ArrowDownCircle;
  const sevColor =
    sev === "danger"
      ? "text-voyage-bad bg-voyage-bad/10 border-voyage-bad/40"
      : sev === "warning"
      ? "text-voyage-warn bg-voyage-warn/10 border-voyage-warn/40"
      : "text-voyage-text-2 bg-voyage-elevated border-voyage-border-2";

  return (
    <article
      data-testid={`voyage-alert-${a.id}`}
      className={cn("rounded-lg border p-4", sevColor.split(" ")[2], "bg-voyage-elevated")}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", sevColor.split(" ")[0])} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {triage?.rank && (
              <span className="vg-label">#{triage.rank}</span>
            )}
            <span className="vg-label">{a.category}</span>
            <span className="vg-label">{sev}</span>
            <span className="vg-label">{lifecycle}</span>
            {triage?.actionNow && (
              <span
                data-testid={`voyage-alert-action-now-${a.id}`}
                className="ml-auto vg-label text-voyage-bad"
              >
                Act now
              </span>
            )}
          </div>
          <h3 className="text-[14px] text-voyage-text font-medium mt-1">{a.title}</h3>
          <p className="text-[12px] text-voyage-text-2 mt-1">{a.detail}</p>

          {triage?.explanation && (
            <p
              data-testid={`voyage-alert-triage-${a.id}`}
              className="text-[12px] text-voyage-text-3 mt-2 italic"
            >
              {triage.explanation}
            </p>
          )}

          {a.source && (
            <div
              data-testid={`voyage-alert-source-${a.id}`}
              className="mt-3 rounded-md bg-voyage-bg/60 border border-voyage-border-2 px-3 py-2"
            >
              <p className="vg-label mb-1">Evidence</p>
              <p className="text-[12px] text-voyage-text-2">
                <span className="text-voyage-text">{a.source.name}</span>
                <span className="text-voyage-text-3"> · {a.source.kind}</span>
                <span className="text-voyage-text-3"> · conf {(a.source.confidence * 100).toFixed(0)}%</span>
              </p>
              {a.source.excerpt && (
                <p className="text-[11px] text-voyage-text-3 mt-1">"{a.source.excerpt}"</p>
              )}
              {a.source.url && (
                <a
                  href={a.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-voyage-accent hover:text-voyage-text"
                >
                  open source
                </a>
              )}
              <p className="text-[10px] text-voyage-text-3 mt-1">
                fetched {new Date(a.source.fetchedAt).toLocaleString()}
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            {lifecycle === "new" && (
              <button
                type="button"
                data-testid={`voyage-alert-ack-${a.id}`}
                onClick={onAck}
                disabled={busy}
                className="btn-vg-ghost text-[12px]"
              >
                Acknowledge
              </button>
            )}
            {lifecycle !== "resolved" && (
              <button
                type="button"
                data-testid={`voyage-alert-resolve-${a.id}`}
                onClick={onResolve}
                disabled={busy}
                className="btn-vg-primary text-[12px]"
              >
                Resolve
              </button>
            )}
            <span className="ml-auto text-[10px] text-voyage-text-3">
              raised {new Date(a.raisedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
