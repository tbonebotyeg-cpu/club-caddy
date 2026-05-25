"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const Schema = z.object({
  email: z.string().email("Use a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormValues = z.infer<typeof Schema>;

export function LoginForm({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();

    // 1. Try sign in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (!signInErr) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    // 2. If invalid credentials, try sign up (creates the account on first use)
    if (
      signInErr.message.toLowerCase().includes("invalid login") ||
      signInErr.message.toLowerCase().includes("invalid credentials") ||
      signInErr.status === 400
    ) {
      const { error: signUpErr, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (signUpErr) {
        toast.error(signUpErr.message);
        return;
      }

      if (data.session) {
        toast.success("Welcome to Club Caddy");
        router.push(nextPath);
        router.refresh();
        return;
      }

      // Email confirmation is on → tell user to check inbox
      toast.message("Check your email", {
        description:
          "We sent a confirmation link. Or disable email confirmation in Supabase to skip.",
      });
      return;
    }

    toast.error(signInErr.message);
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
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="At least 6 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-danger">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        <LogIn className="h-4 w-4" /> Sign in / create account
      </Button>
      <p className="text-xs text-subtle text-center">
        First time? An account is created with this password. Returning? Just sign in.
      </p>
    </form>
  );
}
