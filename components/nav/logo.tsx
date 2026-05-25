export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Stylized golf flag */}
          <path d="M6 21V3" />
          <path d="M6 3 L18 7 L6 11" fill="currentColor" />
          <circle cx="6" cy="21" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-semibold text-base tracking-tight">
        Club <span className="text-accent">Caddy</span>
      </span>
    </span>
  );
}
