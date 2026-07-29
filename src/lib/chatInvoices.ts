import { supabase } from "@/integrations/supabase/client";

export class ChatInvoiceFeatureUnavailableError extends Error {
  constructor() {
    super("The secure invoice service is not enabled yet");
    this.name = "ChatInvoiceFeatureUnavailableError";
  }
}

function isMissingInvoiceBackend(code: string | undefined) {
  return code === "PGRST202" || code === "PGRST205" || code === "42883" || code === "42P01";
}

export type ChatInvoice = {
  id: string;
  code: string;
  conversation_id: string;
  message_id: string | null;
  issuer_id?: string;
  issuer_name?: string;
  amount: number;
  currency: string;
  note: string;
  status: "unpaid" | "paid" | "cancelled";
  payer_id?: string | null;
  paid_at?: string | null;
  created_at: string;
};

function mapInvoice(row: unknown): ChatInvoice {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error("Invalid invoice response");
  }
  const value = row as Record<string, unknown>;
  const status = value.status === "paid" || value.status === "cancelled" ? value.status : "unpaid";
  return {
    id: String(value.id ?? ""),
    code: String(value.code ?? ""),
    conversation_id: String(value.conversation_id ?? ""),
    message_id: typeof value.message_id === "string" ? value.message_id : null,
    issuer_id: typeof value.issuer_id === "string" ? value.issuer_id : undefined,
    issuer_name: typeof value.issuer_name === "string" ? value.issuer_name : undefined,
    amount: Number(value.amount ?? 0),
    currency: typeof value.currency === "string" ? value.currency : "NGN",
    note: typeof value.note === "string" ? value.note : "Food invoice",
    status,
    payer_id: typeof value.payer_id === "string" ? value.payer_id : null,
    paid_at: typeof value.paid_at === "string" ? value.paid_at : null,
    created_at: typeof value.created_at === "string" ? value.created_at : new Date(0).toISOString(),
  };
}

export function parseChatInvoiceCode(body: string | null | undefined): string | null {
  const match = body?.match(/^\[\[CHAT_INVOICE:([A-Z0-9]+)\]\]$/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export async function loadChatInvoices(conversationId: string): Promise<ChatInvoice[]> {
  const { data, error } = await supabase
    .from("chat_invoices")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingInvoiceBackend(error.code)) throw new ChatInvoiceFeatureUnavailableError();
    throw new Error(error.message);
  }
  return (data ?? []).map(mapInvoice);
}

export async function createChatInvoice(input: {
  conversationId: string;
  amount: number;
  note: string;
}): Promise<ChatInvoice> {
  const { data, error } = await supabase.rpc("chat_invoice_create", {
    p_conversation_id: input.conversationId,
    p_amount: input.amount,
    p_note: input.note,
  });
  if (error) {
    if (isMissingInvoiceBackend(error.code)) throw new ChatInvoiceFeatureUnavailableError();
    throw new Error(error.message);
  }
  return mapInvoice(data);
}

export async function lookupChatInvoice(code: string): Promise<ChatInvoice> {
  const { data, error } = await supabase.rpc("chat_invoice_lookup", { p_code: code });
  if (error) throw new Error(error.message);
  return mapInvoice(data);
}

export async function payChatInvoice(code: string): Promise<ChatInvoice> {
  const { data, error } = await supabase.rpc("chat_invoice_pay", { p_code: code });
  if (error) throw new Error(error.message);
  return mapInvoice(data);
}

export async function shareChatInvoiceWithUser(
  code: string,
  username: string,
): Promise<{
  username: string;
  display_name: string;
}> {
  const { data, error } = await supabase.rpc("chat_invoice_share", {
    p_code: code,
    p_username: username,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid invoice share response");
  }
  const value = data as Record<string, unknown>;
  return {
    username: String(value.username ?? ""),
    display_name: String(value.display_name ?? ""),
  };
}

export function chatInvoiceUrl(code: string): string {
  const origin =
    typeof window === "undefined" ? "https://naijaaeats.vercel.app" : window.location.origin;
  return `${origin}/invoice/${code}`;
}

export function formatInvoiceAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-NG", {
    style: "currency",
    currency: currency === "GBP" ? "GBP" : "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
