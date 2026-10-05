"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop-in client component that re-runs `router.refresh()` on a slow tick,
 * pulling fresh server-rendered data without any user action.
 *
 * The voyage product is automation-first: the operator should never feel
 * "out of date" without doing anything. We refresh every `intervalMs` ms,
 * defaulting to 45s to keep Vertex / DB load reasonable.
 *
 * Pause when the document is hidden so we don't burn calls in background tabs.
 */
export function VoyageAutoRefresh({ intervalMs = 45000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function arm() {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, intervalMs);
    }
    function disarm() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    arm();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // Refresh once immediately when the user comes back, then resume tick.
        router.refresh();
        arm();
      } else {
        disarm();
      }
    });
    return () => disarm();
  }, [intervalMs, router]);

  return null;
}
