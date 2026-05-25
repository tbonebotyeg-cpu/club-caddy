import Link from "next/link";
import {
  Briefcase,
  Compass,
  ClipboardList,
  TrendingDown,
  Wind,
  MapPin,
  Trophy,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/nav/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <>
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 text-sm text-muted">
            <a href="#features" className="rounded-full px-3 py-1.5 hover:text-foreground">Features</a>
            <a href="#caddy" className="rounded-full px-3 py-1.5 hover:text-foreground">Caddy</a>
            <a href="#pricing" className="rounded-full px-3 py-1.5 hover:text-foreground">Pricing</a>
          </nav>
          <Link href="/login">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative grain overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-28 md:pb-40 text-center relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Built for the player who knows the difference between a 7‑iron 3/4 and an 8‑iron full.
          </span>
          <h1 className="mt-8 text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.05]">
            Know <span className="text-accent-gradient">every yardage.</span>
            <br />
            Own every shot.
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted">
            Build your bag, dial in 4 swing speeds per club, track every round, and let your smart Caddy
            pick the right club for the wind, temp and the lie.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Start your bag <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See the features
              </Button>
            </a>
          </div>

          {/* Stat strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 md:gap-4">
            {[
              { v: "14", l: "clubs · 4 swings" },
              { v: "WHS", l: "handicap" },
              { v: "$0", l: "in beta" },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-2xl border border-border bg-surface px-3 py-4 md:px-4 md:py-5">
                <div className="num text-2xl md:text-4xl font-semibold text-accent">{v}</div>
                <div className="mt-1 text-[10px] md:text-xs text-muted uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
        />
      </section>

      {/* Feature grid */}
      <section id="features" className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Everything in one place</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              The whole game — caddied, scored, tracked.
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature
              Icon={Briefcase}
              title="Your bag, dialed in"
              body="Drop in every club with carry yardages at full, 3/4, 1/2 and 1/4 swings. Add notes per club."
            />
            <Feature
              Icon={Compass}
              title="Smart Caddy"
              body="Type a target yardage — get the top 3 club + swing combos, ranked by how close they land."
              accent
            />
            <Feature
              Icon={Wind}
              title="Weather aware"
              body="Caddy pulls live wind, temp and altitude and adjusts the recommended yardage automatically."
            />
            <Feature
              Icon={ClipboardList}
              title="Mobile scorecard"
              body="One hole at a time, swipe between holes, putts/FIR/GIR tracked. Auto-saves as you play."
            />
            <Feature
              Icon={TrendingDown}
              title="Handicap, computed"
              body="WHS-style score differentials and rolling handicap from your last 20 rounds — updates each round."
            />
            <Feature
              Icon={MapPin}
              title="Course library"
              body="Save the tracks you play — par, slope, rating, hole yardages and stroke index."
            />
            <Feature
              Icon={Trophy}
              title="Goals & PRs"
              body="Break 80, drop your index by 2 — set goals and watch your trend line."
            />
          </div>
        </div>
      </section>

      {/* Caddy spotlight */}
      <section id="caddy" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">The differentiator</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              A caddy that does the math, so you don’t.
            </h2>
            <p className="mt-4 text-muted">
              You’ve got 147 to the pin. 8 mph headwind. 62°F. The Caddy adjusts your target,
              walks your bag, and tells you: <span className="text-foreground">9 iron — full swing — 149y.</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li>· Weather-adjusted yardage</li>
              <li>· Ranked top 3 options across all clubs and swings</li>
              <li>· Notes per club factored in (“fades right”, “runs hot”)</li>
            </ul>
            <Link href="/login" className="mt-8 inline-block">
              <Button size="lg">Try the Caddy <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <CaddyDemoCard />
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Pricing</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Free while in beta.</h2>
          <p className="mt-3 text-muted">
            Build your bag, track rounds, compute your handicap — no card needed.
            Caddy Pro (weather + shot tracking) coming soon.
          </p>
          <Link href="/login" className="mt-10 inline-block">
            <Button size="lg">Get started — it’s free <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-xs text-subtle">
        <Logo className="mx-auto opacity-70" />
        <p className="mt-4">© {new Date().getFullYear()} Club Caddy</p>
      </footer>
    </>
  );
}

function Feature({
  Icon,
  title,
  body,
  accent = false,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <Card className="card-hover p-5">
      <div
        className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
          accent ? "bg-accent text-accent-foreground" : "bg-surface-elevated text-accent"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </Card>
  );
}

function CaddyDemoCard() {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-strong bg-background p-6 shadow-2xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span>Caddy</span>
        <span className="inline-flex items-center gap-1 text-accent">
          <Wind className="h-3 w-3" /> 8 mph
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-5xl font-semibold">147</span>
        <span className="text-muted">y to pin</span>
      </div>
      <div className="mt-5 space-y-2">
        {[
          { name: "9 iron", swing: "full", yards: 149, delta: "+2", primary: true },
          { name: "8 iron", swing: "3/4", yards: 145, delta: "−2" },
          { name: "PW", swing: "full", yards: 140, delta: "−7" },
        ].map((r) => (
          <div
            key={r.name + r.swing}
            className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
              r.primary
                ? "border-accent bg-accent/10"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{r.name}</span>
              <span className="text-xs text-muted">{r.swing}</span>
            </div>
            <div className="num text-sm">
              {r.yards}y <span className={r.primary ? "text-accent" : "text-muted"}>{r.delta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
