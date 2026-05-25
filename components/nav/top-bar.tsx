"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const items = [
  { href: "/bag", label: "Bag" },
  { href: "/caddy", label: "Caddy" },
  { href: "/round/new", label: "Round", match: ["/round", "/rounds"] },
  { href: "/courses", label: "Courses" },
  { href: "/stats", label: "Stats" },
  { href: "/goals", label: "Goals" },
];

export function TopBar({
  email,
  handicap,
  roundsCounted,
}: {
  email?: string | null;
  handicap?: number | null;
  roundsCounted?: number;
}) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/bag" className="flex items-center gap-4">
          <Logo />
          <HandicapChip handicap={handicap} roundsCounted={roundsCounted} />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map(({ href, label, match }) => {
            const active =
              pathname === href ||
              (match?.some((m) => pathname.startsWith(m)) ?? pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-elevated text-accent"
                    : "text-muted hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <form action="/auth/sign-out" method="post" className="flex items-center gap-3">
          {email && (
            <span className="hidden sm:inline text-xs text-subtle truncate max-w-[180px]">
              {email}
            </span>
          )}
          <button
            type="submit"
            className="rounded-full p-2 text-muted hover:text-danger transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}

function HandicapChip({
  handicap,
  roundsCounted,
}: {
  handicap?: number | null;
  roundsCounted?: number;
}) {
  if (handicap == null) {
    const need = Math.max(0, 3 - (roundsCounted ?? 0));
    if (need === 0) return null;
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
        HCP
        <span className="num text-muted">{need} more rounds</span>
      </span>
    );
  }
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-accent">
      HCP
      <span className="num text-accent">{handicap.toFixed(1)}</span>
    </span>
  );
}
