import type { Metadata } from "next";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="py-6 md:py-10 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Settings</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Preferences</h1>
      <p className="mt-2 text-muted text-sm">
        Units used across Caddy, scorecard, and stats. Saved on this device.
      </p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
