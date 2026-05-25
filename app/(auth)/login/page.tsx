import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/nav/logo";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <Logo />
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Welcome to <span className="text-accent">Club Caddy</span>
        </h1>
        <p className="text-muted mb-8 text-sm">
          Enter your email — we’ll send you a one-tap sign-in link.
        </p>
        <LoginForm nextPath={sp.next ?? "/bag"} initialError={sp.error} />
      </div>
    </main>
  );
}
