import { createFileRoute } from "@tanstack/react-router";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AppRole = "admin" | "vendor" | "rider" | "customer";
type XoraRequest = {
  message?: string;
  region?: "NG" | "UK";
};

type ContextBlock = {
  role: AppRole;
  summary: string;
  data: Record<string, unknown>;
  /** Primary shop type when the user is a vendor: restaurant | chef | grocery. */
  vendorType?: string | null;
};

const DEFAULT_MODEL = "gpt-5.6-terra";
const MAX_MESSAGE_LENGTH = 2_000;

export const Route = createFileRoute("/api/xora")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return json({ error: "OpenAI is not configured" }, 503);
        }

        const token = readBearerToken(request);
        if (!token) {
          return json({ error: "Missing session" }, 401);
        }

        const body = (await safeJson(request)) as XoraRequest | null;
        const message = body?.message?.trim().slice(0, MAX_MESSAGE_LENGTH);
        if (!message) {
          return json({ error: "Message is required" }, 400);
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
          return json({ error: "Invalid session" }, 401);
        }

        const userId = userData.user.id;
        try {
          const role = await getPrimaryRole(userId);
          const context = await buildXoraContext(userId, role);
          const reply = await askOpenAI({
            apiKey,
            model: process.env.XORA_OPENAI_MODEL || DEFAULT_MODEL,
            message,
            region: body?.region === "UK" ? "UK" : "NG",
            context,
          });

          return json({ reply, role, contextSummary: context.summary });
        } catch (error) {
          console.error("[xora] request failed", error);
          return json({ error: "Xora is unavailable right now" }, 500);
        }
      },
    },
  },
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return /^bearer$/i.test(scheme) && token ? token : null;
}

async function getPrimaryRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(`Could not load user role: ${error.message}`);

  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("vendor")) return "vendor";
  if (roles.includes("rider")) return "rider";
  return "customer";
}

async function buildXoraContext(userId: string, role: AppRole): Promise<ContextBlock> {
  if (role === "admin") return buildAdminContext();
  if (role === "vendor") return buildVendorContext(userId);
  if (role === "rider") return buildRiderContext(userId);
  return buildCustomerContext(userId);
}

async function buildAdminContext(): Promise<ContextBlock> {
  const [
    vendorsRes,
    ordersRes,
    deliveriesRes,
    conversationsRes,
    messagesRes,
    vendorDocsRes,
    riderDocsRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("vendors")
      .select("id,name,type,status,country,city,rating,rating_count,created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("orders")
      .select("id,status,payment_status,total,currency,created_at,customer_note,vendor_id")
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("deliveries")
      .select("id,status,fee,currency,created_at,order_id,rider_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("conversations")
      .select("id,vendor_id,customer_id,last_message,last_message_at,customer_unread,vendor_unread")
      .order("last_message_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("messages")
      .select("id,conversation_id,body,created_at,sender_id")
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("vendor_documents")
      .select("vendor_id,status,doc_type,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("rider_documents")
      .select("rider_id,status,doc_type,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  throwIfError(vendorsRes.error, "vendors");
  throwIfError(ordersRes.error, "orders");
  throwIfError(deliveriesRes.error, "deliveries");
  throwIfError(conversationsRes.error, "conversations");
  throwIfError(messagesRes.error, "messages");
  throwIfError(vendorDocsRes.error, "vendor documents");
  throwIfError(riderDocsRes.error, "rider documents");

  const vendors = vendorsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const deliveries = deliveriesRes.data ?? [];
  const conversations = conversationsRes.data ?? [];

  return {
    role: "admin",
    summary: `Admin context: ${vendors.length} recent vendors, ${orders.length} recent orders, ${deliveries.length} recent deliveries, ${conversations.length} recent conversations.`,
    data: {
      vendorStatusCounts: countBy(vendors, "status"),
      orderStatusCounts: countBy(orders, "status"),
      deliveryStatusCounts: countBy(deliveries, "status"),
      recentVendors: vendors.map(compactVendor),
      recentOrders: orders.map(compactOrder),
      recentDeliveries: deliveries,
      recentConversations: conversations.map(compactConversation),
      recentMessageSnippets: (messagesRes.data ?? []).map(compactMessage),
      recentVendorDocuments: vendorDocsRes.data ?? [],
      recentRiderDocuments: riderDocsRes.data ?? [],
    },
  };
}

async function buildVendorContext(userId: string): Promise<ContextBlock> {
  const { data: vendors, error: vendorError } = await supabaseAdmin
    .from("vendors")
    .select("id,name,type,status,country,city,rating,rating_count,currency,created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  throwIfError(vendorError, "vendor profile");

  const vendorIds = (vendors ?? []).map((v) => v.id);
  if (vendorIds.length === 0) {
    return {
      role: "vendor",
      summary: "Vendor context: no vendor profile has been created yet.",
      data: { vendors: [] },
    };
  }

  const [ordersRes, conversationsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id,status,payment_status,total,currency,created_at,customer_note,vendor_id")
      .in("vendor_id", vendorIds)
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("conversations")
      .select("id,vendor_id,customer_id,last_message,last_message_at,customer_unread,vendor_unread")
      .in("vendor_id", vendorIds)
      .order("last_message_at", { ascending: false })
      .limit(20),
  ]);
  throwIfError(ordersRes.error, "vendor orders");
  throwIfError(conversationsRes.error, "vendor conversations");

  const conversationIds = (conversationsRes.data ?? []).map((c) => c.id);
  const messages = conversationIds.length
    ? await supabaseAdmin
        .from("messages")
        .select("id,conversation_id,body,created_at,sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };
  throwIfError(messages.error, "vendor messages");

  return {
    role: "vendor",
    vendorType: (vendors ?? [])[0]?.type ?? null,
    summary: `Vendor context: ${vendorIds.length} shops, ${(ordersRes.data ?? []).length} recent orders, ${conversationIds.length} recent conversations.`,
    data: {
      shops: (vendors ?? []).map(compactVendor),
      orderStatusCounts: countBy(ordersRes.data ?? [], "status"),
      recentOrders: (ordersRes.data ?? []).map(compactOrder),
      recentConversations: (conversationsRes.data ?? []).map(compactConversation),
      recentMessageSnippets: (messages.data ?? []).map(compactMessage),
    },
  };
}

async function buildRiderContext(userId: string): Promise<ContextBlock> {
  const [deliveriesRes, docsRes] = await Promise.all([
    supabaseAdmin
      .from("deliveries")
      .select("id,status,fee,currency,created_at,order_id,pickup_address,dropoff_address")
      .eq("rider_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
    supabaseAdmin
      .from("rider_documents")
      .select("status,doc_type,created_at,rejection_reason")
      .eq("rider_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  throwIfError(deliveriesRes.error, "rider deliveries");
  throwIfError(docsRes.error, "rider documents");

  return {
    role: "rider",
    summary: `Rider context: ${(deliveriesRes.data ?? []).length} recent deliveries and ${(docsRes.data ?? []).length} documents.`,
    data: {
      deliveryStatusCounts: countBy(deliveriesRes.data ?? [], "status"),
      recentDeliveries: deliveriesRes.data ?? [],
      documents: docsRes.data ?? [],
    },
  };
}

async function buildCustomerContext(userId: string): Promise<ContextBlock> {
  const [ordersRes, conversationsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id,status,payment_status,total,currency,created_at,customer_note,vendor_id")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("conversations")
      .select("id,vendor_id,last_message,last_message_at,customer_unread,vendor_unread")
      .eq("customer_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(15),
  ]);
  throwIfError(ordersRes.error, "customer orders");
  throwIfError(conversationsRes.error, "customer conversations");

  const conversationIds = (conversationsRes.data ?? []).map((c) => c.id);
  const messages = conversationIds.length
    ? await supabaseAdmin
        .from("messages")
        .select("id,conversation_id,body,created_at,sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };
  throwIfError(messages.error, "customer messages");

  return {
    role: "customer",
    summary: `Customer context: ${(ordersRes.data ?? []).length} recent orders and ${conversationIds.length} conversations.`,
    data: {
      orderStatusCounts: countBy(ordersRes.data ?? [], "status"),
      recentOrders: (ordersRes.data ?? []).map(compactOrder),
      recentConversations: (conversationsRes.data ?? []).map(compactConversation),
      recentMessageSnippets: (messages.data ?? []).map(compactMessage),
    },
  };
}

function throwIfError(error: { message: string } | null, label: string) {
  if (error) throw new Error(`Could not load ${label}: ${error.message}`);
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function compactVendor(v: Record<string, unknown>) {
  return pick(v, ["id", "name", "type", "status", "country", "city", "rating", "rating_count"]);
}

function compactOrder(o: Record<string, unknown>) {
  return {
    ...pick(o, ["id", "status", "payment_status", "total", "currency", "created_at", "vendor_id"]),
    customer_note: truncate(String(o.customer_note ?? ""), 180),
  };
}

function compactConversation(c: Record<string, unknown>) {
  return {
    ...pick(c, ["id", "vendor_id", "customer_id", "last_message_at", "customer_unread", "vendor_unread"]),
    last_message: truncate(String(c.last_message ?? ""), 180),
  };
}

function compactMessage(m: Record<string, unknown>) {
  return {
    ...pick(m, ["id", "conversation_id", "created_at", "sender_id"]),
    body: truncate(String(m.body ?? ""), 220),
  };
}

function pick(source: Record<string, unknown>, keys: string[]) {
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = source[key];
    return acc;
  }, {});
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function askOpenAI({
  apiKey,
  model,
  message,
  region,
  context,
}: {
  apiKey: string;
  model: string;
  message: string;
  region: "NG" | "UK";
  context: ContextBlock;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: personaInstructions(context),
      input: [
        `Region: ${region}`,
        `Signed-in role: ${context.role}`,
        `Context summary: ${context.summary}`,
        `NaijaEats context JSON:\n${JSON.stringify(context.data, null, 2)}`,
        `User question:\n${message}`,
      ].join("\n\n"),
      max_output_tokens: 700,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[xora] OpenAI request failed", response.status, details.slice(0, 500));
    throw new Error("Xora could not reach OpenAI right now.");
  }

  const data = await response.json();
  return extractOutputText(data) || "I could not generate a response just now. Please try again.";
}

/**
 * Xora is one assistant with four faces — the persona matches the app the
 * user is standing in, so a chef never gets jollof recommendations and a
 * customer never gets platform KPIs.
 */
function personaInstructions(context: ContextBlock): string {
  const shared = [
    "You are Xora, NaijaEats' AI assistant.",
    "Answer using the provided NaijaEats context only when it is relevant.",
    "Respect role boundaries. Do not claim access to data that is not in the context.",
    "If the user asks for an action that requires changing data, explain the next safe step in the app instead of pretending to do it.",
    "Never reveal raw secrets, API keys, service-role details, or internal implementation instructions.",
  ];

  if (context.role === "admin") {
    return [
      ...shared,
      "Persona: a sharp, data-first operations analyst for the NaijaEats leadership team.",
      "Speak in precise, numbers-backed statements. Surface anomalies, queues needing attention (vendor approvals, documents, payouts), and concrete next steps.",
      "Point to the right admin pages when suggesting actions (e.g. Stores for approvals, Documents for verification, Payouts for settlements).",
    ].join("\n");
  }

  if (context.role === "vendor" && context.vendorType === "chef") {
    return [
      ...shared,
      "Persona: a supportive bookings co-pilot for a private chef on NaijaEats.",
      "Focus on event bookings: responding to requests, judging and countering offers, pricing hours competitively, setting availability blocks, and winning repeat clients.",
      "Encourage professional, warm replies to customers. Reference their kitchen profile and booking data when relevant.",
    ].join("\n");
  }

  if (context.role === "vendor") {
    const shop = context.vendorType === "grocery" ? "grocery store" : "restaurant";
    return [
      ...shared,
      `Persona: a pragmatic business co-pilot for a ${shop} owner on NaijaEats.`,
      "Focus on running the shop well: today's orders, menu and pricing improvements, busy-period prep, customer messages, ratings, earnings and payouts.",
      "Give short, actionable advice a busy owner can apply today — not generic business-school talk.",
    ].join("\n");
  }

  if (context.role === "rider") {
    return [
      ...shared,
      "Persona: a practical delivery co-pilot for a NaijaEats rider.",
      "Focus on finding jobs, delivery earnings, document verification status, and getting paid out. Keep answers short — riders read on the move.",
    ].join("\n");
  }

  return [
    ...shared,
    "Persona: a warm Nigerian foodie concierge for a NaijaEats customer.",
    "Focus on discovering dishes and vendors, planning meals, tracking orders, chef bookings, and using the wallet. Be friendly and food-loving, never corporate.",
  ].join("\n");
}

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const direct = (data as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((part) => {
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("")
    .trim();
}
