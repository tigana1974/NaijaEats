import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const roles = [
  { value: "customer", label: "I want to order" },
  { value: "chef", label: "I'm a chef" },
  { value: "vendor", label: "Restaurant / grocer" },
  { value: "rider", label: "I want to deliver" },
] as const;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("customer");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase(), name: name.trim() || null, city: city.trim() || null, role });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already on the list — we'll be in touch soon.");
        return;
      }
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setEmail("");
    setName("");
    setCity("");
    toast.success("You're on the list! Welcome to the family.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
              role === r.value
                ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "border-border bg-card text-foreground hover:border-primary/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Input
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-card"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-card"
        />
        <Input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-card"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full bg-primary text-primary-foreground hover:bg-[oklch(0.52_0.18_38)] shadow-[var(--shadow-warm)] text-base font-semibold"
      >
        {loading ? "Joining…" : "Join the waitlist"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Be first to taste. No spam — just launch news and early invites.
      </p>
    </form>
  );
}
