"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "../primitives";

const DEFAULT_PROMPTS = [
  "Why did ETA increase?",
  "Show route deviation",
  "What is the main delay factor?",
  "Summarize the voyage so far",
  "What if the ship keeps this speed?",
];

export function ChatComposer({
  suggestions = DEFAULT_PROMPTS,
  onSubmit,
  className,
}: {
  voyageId: string;
  suggestions?: string[];
  onSubmit?: (q: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [hasMessages, setHasMessages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const q = value.trim();
    if (!q) return;
    onSubmit?.(q);
    setValue("");
    setHasMessages(true);
  };

  return (
    <div className={cn("rounded-xl bg-voyage-elevated border border-voyage-border-2 p-2", className)}>
      {!hasMessages && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2 pb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                textareaRef.current?.focus();
              }}
              className="text-[12px] px-2.5 py-1 rounded-md text-voyage-text-2 bg-white/[0.03] border border-voyage-border-2 hover:border-voyage-accent/40 hover:text-voyage-text transition-colors duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask voyage…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 bg-transparent resize-none text-[14px] text-voyage-text placeholder:text-voyage-text-3 focus:outline-none py-1.5 max-h-32"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim()}
          className="w-8 h-8 rounded-md bg-voyage-accent hover:bg-voyage-accent-hover text-white grid place-items-center transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
