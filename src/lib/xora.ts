/**
 * Xora — the NaijaEats AI assistant.
 *
 * A self-contained conversation engine that streams contextual, locale-aware
 * replies. There's no external LLM call yet: responses are generated locally
 * from intent-matched templates so the whole flow works offline and without
 * API keys. Swap `generateReply` for a real backend call when the AI service
 * is ready — the streaming contract (async generator of text chunks) stays
 * the same.
 */

import { detectRegion, type BillingRegion } from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";

export type XoraRole = "user" | "xora";

export type XoraMessage = {
  id: string;
  role: XoraRole;
  content: string;
  createdAt: string;
  /** Optional pill actions rendered under the message (deep-links inside the app). */
  actions?: { label: string; to: string }[];
};

export type XoraThread = {
  id: string;
  messages: XoraMessage[];
  updatedAt: string;
};

const KEY = "naijaeats.xora.thread.v1";
const LEGACY_KEY = "naijaeats.ada.thread.v1"; // previous name of the assistant

export function loadThread(): XoraThread {
  if (typeof window === "undefined") return newThread();
  // Migrate legacy Ada threads into the new Xora slot so history isn't lost
  // when the assistant was renamed. Runs once — the legacy key is deleted.
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    const currentRaw = localStorage.getItem(KEY);
    if (legacyRaw && !currentRaw) localStorage.setItem(KEY, legacyRaw);
    if (legacyRaw) localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && Array.isArray(raw.messages)) return raw as XoraThread;
  } catch {
    // ignore corrupt payload
  }
  return newThread();
}

export function saveThread(thread: XoraThread) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(thread));
}

export function newThread(): XoraThread {
  return {
    id: crypto.randomUUID(),
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function clearThread(): XoraThread {
  const t = newThread();
  saveThread(t);
  return t;
}

/* ─────────── Region-aware voice ─────────── */

export function getRegion(): BillingRegion {
  return detectRegion();
}

export function currencySymbol(region: BillingRegion): "₦" | "£" {
  return region === "UK" ? "£" : "₦";
}

function greeting(region: BillingRegion): string {
  const hr = new Date().getHours();
  if (region === "NG") {
    if (hr < 12) return "Morning boss!";
    if (hr < 17) return "How far?";
    return "Good evening o!";
  }
  // UK
  if (hr < 12) return "Morning!";
  if (hr < 17) return "Afternoon!";
  return "Evening!";
}

/**
 * Small locale-aware phrase bank. Xora mixes English + a hint of Pidgin when
 * chatting with Nigerian users, and stays crisp / British when talking to UK
 * users. Keeps the personality consistent without leaning into stereotype.
 */
const VOICE = {
  NG: {
    affirm: "No wahala!",
    thanks: "Thanks jare!",
    letsGo: "Let's plan am 🌶️",
    goodPick: "Sharp choice!",
    checkOut: "Peep this",
    homeCity: "Lagos",
    partyDish: "party jollof",
    dietTip: "sourced from Lagos & Abuja chefs",
    priceHint: "Most portions land between ₦2,500 – ₦6,000",
    weekendTreat: "weekend swallow spread",
    delivery: "rider dey road",
    signOff: "Anything else I fit help you with?",
  },
  UK: {
    affirm: "Sorted.",
    thanks: "Cheers!",
    letsGo: "Let's build it 🌱",
    goodPick: "Great shout.",
    checkOut: "Have a look",
    homeCity: "London",
    partyDish: "party jollof",
    dietTip: "sourced from London & Manchester kitchens",
    priceHint: "Most mains sit between £8 – £16",
    weekendTreat: "Sunday sharing platter",
    delivery: "rider on the way",
    signOff: "Anything else you want help with?",
  },
} satisfies Record<BillingRegion, Record<string, string>>;

/* ─────────── Intent detection ─────────── */

type Intent =
  | "greeting"
  | "meal_plan"
  | "budget"
  | "recommend"
  | "dietary"
  | "delivery"
  | "price"
  | "vendors"
  | "wallet"
  | "premium"
  | "thanks"
  | "help"
  | "fallback";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/\b(hi|hey|hello|howdy|hola|how far|abeg)\b/.test(t)) return "greeting";
  if (/(plan|meal ?plan|weekly|week|schedule|prepare).*?(week|breakfast|lunch|dinner|menu)/.test(t) || /build (my|a) week/.test(t)) return "meal_plan";
  if (/\bbudget|cheap|affordable|₦|£|naira|pound|under \d/.test(t)) return "budget";
  if (/\b(vegetarian|vegan|halal|dairy|gluten|allerg(y|ies)|allergens?|no ?pork|no ?beef|pescatarian)\b/.test(t)) return "dietary";
  if (/\brecommend|suggest|what should i (eat|order)|surprise me|hungry|craving\b/.test(t)) return "recommend";
  if (/\b(deliver(y|ies)|track(ing)?|riders?|eta|when will|how long)\b/.test(t)) return "delivery";
  if (/\bprice|cost|how much|expensive\b/.test(t)) return "price";
  if (/\b(chefs?|restaurants?|vendors?|stores?|grocery|groceries|store lists?|kitchens?)\b/.test(t)) return "vendors";
  if (/\bwallet|top ?up|balance|refer|referral|reward|cashback\b/.test(t)) return "wallet";
  if (/\bpremium|subscribe|naija one\b/.test(t)) return "premium";
  if (/\bthank(s|you|ies)?\b/.test(t)) return "thanks";
  if (/\bhelp|what can you do|features\b/.test(t)) return "help";
  return "fallback";
}

/* ─────────── Response templates ─────────── */

type Reply = { content: string; actions?: { label: string; to: string }[] };

function replyFor(intent: Intent, text: string, region: BillingRegion): Reply {
  const v = VOICE[region];
  const price = currencySymbol(region);

  switch (intent) {
    case "greeting":
      return {
        content: `${greeting(region)} I'm Xora — your foodie assistant on Naija Eats. I can plan your week, find dishes that fit your budget, sort your dietary preferences, or just recommend something to eat right now. What are we doing today?`,
        actions: [
          { label: "Plan my week", to: "/book/build" },
          { label: "Show me chefs", to: "/discover" },
          { label: "Groceries", to: "/groceries" },
        ],
      };

    case "meal_plan":
      return {
        content: `${v.letsGo} I can auto-fill breakfast, lunch and dinner from real chefs across ${region === "NG" ? "Lagos, Abuja & Port Harcourt" : "London, Manchester & Birmingham"}. Tell me your dietary style and budget and I'll build the whole week. Ready to set your preferences?`,
        actions: [
          { label: "Set my preferences", to: "/book/build" },
          { label: "Just show me options", to: "/book" },
        ],
      };

    case "budget": {
      const match = text.match(/(\d{1,3}[,\d]*|\d+)/);
      const raw = match ? Number(match[0].replace(/,/g, "")) : null;
      const hint = raw
        ? `For ${price}${raw.toLocaleString()}, I can line up ${
            region === "NG"
              ? raw < 3000
                ? "akara & pap, boli & fish, or a solid rice bowl"
                : raw < 6000
                  ? "jollof combos with grilled chicken, ofxora rice, or amala & ewedu"
                  : "a full weekend feast — pepper soup, party jollof and suya platters"
              : raw < 10
                ? "a hearty bowl of jollof, plantain wraps or veg curry"
                : raw < 20
                  ? "jollof + grilled chicken, ofxora bowls or a Caribbean roti platter"
                  : "a proper Sunday sharing spread with mains, sides and drinks"
          }.`
        : v.priceHint + " on Naija Eats, so most people can eat well every day.";
      return {
        content: `${v.goodPick} ${hint} Want me to filter chefs by that price?`,
        actions: [
          { label: "Browse under budget", to: "/discover" },
          { label: "Save my budget", to: "/book/build" },
        ],
      };
    }

    case "recommend": {
      const pick = region === "NG"
        ? ["Jollof rice with fried plantain and grilled chicken", "Egusi soup with pounded yam", "Suya wrap with pepper sauce", "Nkwobi + palm wine", "Pepper soup — catfish or goat"]
        : ["Party jollof with grilled chicken", "Ackee & saltfish with fried dumplings", "Jerk chicken and rice & peas", "Grilled tilapia with plantain", "Egusi soup with fufu"];
      const dish = pick[Math.floor(Math.random() * pick.length)];
      return {
        content: `${v.checkOut}: **${dish}**. That's what I'd get right now. ${v.dietTip}. Want me to open the vendors serving it?`,
        actions: [{ label: `Find "${dish.split(" ")[0]}"`, to: "/discover" }],
      };
    }

    case "dietary":
      return {
        content: `${v.affirm} You can tell me your dietary style — vegetarian, vegan, halal, pescatarian, gluten-free or dairy-free — and I'll rotate menus that match. Chefs on Naija Eats tag their dishes so nothing off-limits sneaks through.`,
        actions: [
          { label: "Set dietary preferences", to: "/book/build" },
          { label: "Browse chefs", to: "/discover" },
        ],
      };

    case "delivery":
      return {
        content: `Every order shows the ${v.delivery} once the chef marks it ready. From my checks, deliveries land in **25–45 mins** in ${region === "NG" ? "Lagos & Abuja" : "London Zone 1–3"}, a touch longer further out. Live tracking is on your Orders page.`,
        actions: [{ label: "See my orders", to: "/orders" }],
      };

    case "price":
      return {
        content: `${v.priceHint} on the app. Vendors set their own prices so it really depends on the chef, but Xora can filter by budget any time. Want to try?`,
        actions: [
          { label: "Show budget picks", to: "/discover" },
          { label: "Save my budget", to: "/book/build" },
        ],
      };

    case "vendors":
      return {
        content: `We've got a mix of chefs cooking from home, ${v.homeCity} restaurants, and grocery stores stocking egusi, palm oil, plantains and more. All approved, all rated by real customers. Where do you want to browse?`,
        actions: [
          { label: "Chefs & restaurants", to: "/discover" },
          { label: "Groceries", to: "/groceries" },
        ],
      };

    case "wallet":
      return {
        content: `Naija Eats Wallet is your fastest way to pay: top up once, pay any chef instantly, get 1–10% cashback depending on your plan, and receive money from friends via @username. Want me to walk you there?`,
        actions: [
          { label: "Open wallet", to: "/wallet" },
          { label: "Top up now", to: "/wallet/top-up" },
        ],
      };

    case "premium":
      return {
        content: `**Naija One** is the premium experience on NaijaEats. It includes unlimited free delivery, 10% cashback on every order, VIP invites, and early access to new chefs. ${region === "NG" ? "It costs ₦5,000/mo or ₦48,000/yr." : "It costs £9.99/mo or £95.88/yr."} You can start with a 7-day free trial!`,
        actions: [{ label: "See plans", to: "/subscription" }],
      };

    case "thanks":
      return { content: `${v.thanks} Any time. ${v.signOff}` };

    case "help":
      return {
        content: `Here's what I do best:
• **Plan your week** — breakfast, lunch, dinner from real chefs
• **Filter by diet** — vegan, halal, gluten-free, no-pork, etc.
• **Stick to a budget** — tell me your limit per meal
• **Find dishes** — jollof, suya, ackee, whatever you're craving
• **Explain the wallet & premium** — top-ups, cashback, subscriptions
• **Track orders & deliveries**

Ask me anything — I speak plain English (and a little Pidgin when you do 😉).`,
        actions: [
          { label: "Plan my week", to: "/book/build" },
          { label: "Recommend something", to: "/xora" },
        ],
      };

    case "fallback":
    default:
      return {
        content: `Hmm, tell me a bit more? I can plan meals, find you a chef, suggest something on your budget, or answer questions about the wallet and premium. What are you thinking?`,
        actions: [
          { label: "Show me chefs", to: "/discover" },
          { label: "Plan my week", to: "/book/build" },
        ],
      };
  }
}

/* ─────────── Streaming generator ─────────── */

/**
 * Generates a reply and streams it back chunk-by-chunk so the UI can render
 * character-by-character (ChatGPT / Claude style). Swap this for an actual
 * server call later — the AsyncGenerator contract stays the same.
 */
export async function* generateReply(
  userText: string,
  opts?: { region?: BillingRegion },
): AsyncGenerator<{ delta?: string; done?: boolean; actions?: { label: string; to: string }[] }> {
  const region = opts?.region ?? getRegion();
  const serverReply = await tryServerReply(userText, region);
  if (serverReply) {
    yield* streamContent(serverReply);
    return;
  }

  const intent = detectIntent(userText);
  const { content, actions } = replyFor(intent, userText, region);

  // Simulate the "thinking" beat before the stream kicks in.
  await new Promise((r) => setTimeout(r, 350));
  yield* streamContent(content, actions);
}

async function tryServerReply(userText: string, region: BillingRegion) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;

    const response = await fetch("/api/xora", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: userText, region }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { reply?: unknown };
    return typeof payload.reply === "string" ? payload.reply : null;
  } catch (err) {
    console.warn("[xora] server reply unavailable, using local fallback", err);
    return null;
  }
}

async function* streamContent(content: string, actions?: { label: string; to: string }[]) {
  // Stream by word / punctuation groups so it feels natural.
  const tokens = content.match(/(\s+|\S+)/g) ?? [content];
  for (const t of tokens) {
    await new Promise((r) => setTimeout(r, 22 + Math.random() * 34));
    yield { delta: t };
  }
  yield { done: true, actions };
}
