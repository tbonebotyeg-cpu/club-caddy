import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ComingSoonShell({
  eyebrow,
  title,
  body,
  Icon,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  Icon: React.ComponentType<{ className?: string }>;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="py-10 md:py-16 max-w-xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-accent text-center">{eyebrow}</p>
      <Card className="mt-6 p-10 text-center">
        <Icon className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted text-sm">{body}</p>
        {ctaHref && ctaLabel && (
          <Link href={ctaHref} className="mt-6 inline-block">
            <Button>{ctaLabel}</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
