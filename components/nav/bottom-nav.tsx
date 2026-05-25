"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Compass, ClipboardList, BarChart3, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/bag", label: "Bag", Icon: Briefcase },
  { href: "/caddy", label: "Caddy", Icon: Compass },
  { href: "/round/new", label: "Round", Icon: ClipboardList, match: ["/round", "/rounds"] },
  { href: "/stats", label: "Stats", Icon: BarChart3 },
  { href: "/courses", label: "Courses", Icon: MapPin },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon, match }) => {
          const active =
            pathname === href ||
            (match?.some((m) => pathname.startsWith(m)) ?? pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_var(--accent)]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
