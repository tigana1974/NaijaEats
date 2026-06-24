import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/naija/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/help")({
  component: HelpPage,
});

const faqs = [
  { q: "How do I track my order?", a: "Open Orders from the bottom nav and tap the active order to see live status and rider location." },
  { q: "How do refunds work?", a: "Cancelled orders are refunded to your wallet within minutes. Card refunds take 3–5 business days." },
  { q: "Can I change my delivery address?", a: "Yes — go to Addresses on your account page to add or set a default address before checkout." },
  { q: "Is the wallet secure?", a: "Yes. Funds are held in a regulated escrow account and every transaction requires authentication." },
];

function HelpPage() {
  const { user } = Route.useRouteContext();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return toast.error("Please fill out subject and message");
    toast.success("Message sent — we'll reply to " + (user.email ?? "you") + " soon");
    setSubject(""); setMessage("");
  };

  return (
    <CustomerShell>
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        <Link to="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-3">Help & Support</h1>
        <p className="text-sm text-muted-foreground">We're here 24/7.</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <a href="tel:+2348000000000" className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-3 hover:border-[var(--brand-clay)]/40 transition">
            <Phone className="h-5 w-5 text-[var(--brand-clay)]" />
            <span className="text-xs font-medium">Call</span>
          </a>
          <a href="mailto:support@naijaeats.app" className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-3 hover:border-[var(--brand-clay)]/40 transition">
            <Mail className="h-5 w-5 text-[var(--brand-clay)]" />
            <span className="text-xs font-medium">Email</span>
          </a>
          <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-3 hover:border-[var(--brand-clay)]/40 transition">
            <MessageCircle className="h-5 w-5 text-[var(--brand-clay)]" />
            <span className="text-xs font-medium">WhatsApp</span>
          </a>
        </div>

        <h2 className="mt-8 text-sm font-semibold">Frequently asked</h2>
        <Accordion type="single" collapsible className="mt-2 rounded-2xl border border-border bg-card px-4">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="border-border">
              <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="mt-8 text-sm font-semibold">Send us a message</h2>
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What can we help with?" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us more…" />
          </div>
          <Button type="submit" className="w-full rounded-2xl bg-[var(--brand-clay)] text-[var(--brand-cream)] hover:opacity-90">Send message</Button>
        </form>
      </div>
    </CustomerShell>
  );
}
