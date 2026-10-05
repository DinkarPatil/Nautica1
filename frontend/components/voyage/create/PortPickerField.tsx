"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../primitives";
import { voyageApi } from "@/lib/voyage/voyageApi";
import type { Port } from "@/types/voyage";

export function PortPickerField({
  name,
  label,
  value,
  onChange,
  required,
  error,
}: {
  name: string;
  label: string;
  value?: Port;
  onChange: (p?: Port) => void;
  required?: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Port[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await voyageApi.searchPorts(query);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  return (
    <label className="block" htmlFor={name}>
      <span className="vg-label block mb-2">
        {label}
        {required && <span className="text-voyage-accent ml-1">*</span>}
      </span>
      <div ref={wrapRef} className="relative">
        {value ? (
          <div className="vg-input flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-voyage-accent-soft text-voyage-accent text-[12px] font-medium">
              {value.unlocode}
            </span>
            <span className="text-voyage-text text-[13px] truncate">
              {value.name}
              <span className="text-voyage-text-3 ml-1">· {value.country}</span>
            </span>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="ml-auto text-voyage-text-3 hover:text-voyage-text text-[12px]"
            >
              Clear
            </button>
          </div>
        ) : (
          <input
            id={name}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search by name or UN/LOCODE…"
            className="vg-input"
          />
        )}

        {open && !value && (
          <div className="absolute z-20 mt-1 w-full rounded-lg bg-voyage-elevated border border-voyage-border shadow-2xl overflow-hidden">
            {loading ? (
              <div className="px-4 py-3 text-[12px] text-voyage-text-3">Searching…</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-[12px] text-voyage-text-3">No ports match.</div>
            ) : (
              <ul className="max-h-64 overflow-auto">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(p);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 hover:bg-white/[0.04] transition-colors duration-150",
                        "flex items-center gap-3"
                      )}
                    >
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-voyage-text-2 text-[11px] vg-mono">
                        {p.unlocode}
                      </span>
                      <span className="text-[13px] text-voyage-text">{p.name}</span>
                      <span className="text-[11px] text-voyage-text-3 ml-auto">{p.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-[11px] text-voyage-danger mt-1.5 block">{error}</span>}
    </label>
  );
}
