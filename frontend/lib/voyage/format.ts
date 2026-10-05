export function fmtETA(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}

export function fmtDelta(min: number): string {
  if (min === 0) return "on time";
  const sign = min > 0 ? "+" : "−";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

export function fmtCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns} · ${Math.abs(lon).toFixed(4)}°${ew}`;
}

export function fmtRelative(iso: string, now = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function fmtDuration(min: number): string {
  const d = Math.floor(min / (60 * 24));
  const rem = min - d * 60 * 24;
  const h = Math.floor(rem / 60);
  const m = rem - h * 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function toneFromDelta(min: number): "ok" | "warn" | "danger" | "muted" {
  if (min === 0) return "muted";
  if (min < 0) return "ok";
  if (min < 60) return "muted";
  if (min < 180) return "warn";
  return "danger";
}
