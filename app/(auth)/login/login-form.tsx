"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";

const Schema = z.object({
  email: z.string().email("Use a valid email"),
});
type FormValues = z.infer<typeof Schema>;

export function LoginForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError?: string;
}) {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  if (initialError && !sent) {
    // Show once on mount via toast
    setTimeout(() => toast.error(initialError), 0);
  }

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Magic link sent — check your inbox");
  }

  if (sent) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border-strong bg-surface p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-accent" />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted mt-1">
          We sent a magic link to <span className="text-foreground">{getValues("email")}</span>. Tap it on this device to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@inbox.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-danger">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        <Mail className="h-4 w-4" /> Send magic link
      </Button>
      <p className="text-xs text-subtle text-center">
        No password required. We never share your email.
      </p>
    </form>
  );
}
