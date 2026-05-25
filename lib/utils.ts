import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYards(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n)}y`;
}

export function formatDelta(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function scoreLabel(strokes: number, par: number): {
  label: string;
  className: string;
} {
  const d = strokes - par;
  if (strokes === 1) return { label: "ACE", className: "score-eagle" };
  if (d <= -2) return { label: "EAGLE", className: "score-eagle" };
  if (d === -1) return { label: "BIRDIE", className: "score-birdie" };
  if (d === 0) return { label: "PAR", className: "score-par" };
  if (d === 1) return { label: "BOGEY", className: "score-bogey" };
  if (d === 2) return { label: "DOUBLE", className: "score-double" };
  return { label: `+${d}`, className: "score-double" };
}
