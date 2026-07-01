// Bulk generator for remaining Naija Eats admin scaffold pages.
// Run once from repo root: `node scripts/gen-admin-scaffolds.mjs`.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "src", "routes", "_authenticated");
mkdirSync(OUT_DIR, { recursive: true });

// Each entry describes a scaffolded admin module. `slug` maps to file name and URL.
// `icons` names lucide-react icons imported for KPIs.
const MODULES = [
  {
    slug: "store-groups",
    comp: "StoreGroups",
    title: "Store groups",
    desc: "Group stores by city, country, vendor type, cuisine and performance.",
    icons: ["Layers", "Star", "Sparkles", "Flag"],
    kpis: [
      { label: "City groups", value: 8, icon: "Layers", accent: "green" },
      { label: "Featured stores", value: 12, icon: "Star", accent: "orange" },
      { label: "New vendor groups", value: 3, icon: "Sparkles", accent: "green" },
      { label: "Countries", value: 2, icon: "Flag", accent: "ink" },
    ],
    sections: [
      {
        title: "Grouping dimensions",
        desc: "How stores can be grouped in this dashboard",
        items: ["City", "Country", "Vendor type", "Cuisine type", "Featured stores", "New vendors", "Suspended vendors", "High performers"],
      },
      {
        title: "Active groups",
        items: ["Lagos restaurants", "London home chefs", "UK grocery vendors", "Abuja featured", "Suspended vendors", "High performers Q4", "New vendors (30d)", "Nigerian jollof specialists"],
      },
    ],
  },
  {
    slug: "webshop",
    comp: "Webshop",
    title: "Webshop",
    desc: "Public online storefronts for each vendor — menus, delivery, pickup, reviews.",
    icons: ["Globe", "Link2", "Eye", "Share2"],
    kpis: [
      { label: "Live storefronts", value: "—", icon: "Globe", accent: "green" },
      { label: "Shareable links", value: "—", icon: "Link2", accent: "orange" },
      { label: "Storefront visits (30d)", value: "—", icon: "Eye", accent: "ink" },
      { label: "Social shares (30d)", value: "—", icon: "Share2", accent: "green" },
    ],
    sections: [
      {
        title: "Storefront features",
        items: ["Store link", "Menu & products", "Delivery / pickup options", "Reviews", "Opening hours", "Featured products", "Shareable URL"],
      },
      {
        title: "SEO & discoverability",
        items: ["Meta descriptions", "OG images", "Sitemap entries", "Rich results (menus)", "Custom slugs", "Analytics tag"],
      },
    ],
  },
  {
    slug: "devices",
    comp: "Devices",
    title: "Devices",
    desc: "Track devices used by store staff, riders and admins with remote logout.",
    icons: ["Smartphone", "Tablet", "Laptop", "ShieldAlert"],
    kpis: [
      { label: "Active devices", value: "—", icon: "Smartphone", accent: "green" },
      { label: "Tablets in stores", value: "—", icon: "Tablet", accent: "orange" },
      { label: "Admin laptops", value: "—", icon: "Laptop", accent: "ink" },
      { label: "Suspicious sessions", value: 0, icon: "ShieldAlert", accent: "orange" },
    ],
    sections: [
      { title: "Fields tracked", items: ["Device name", "Last login", "IP address", "App version", "Device status", "Owner (staff / rider / admin)"] },
      { title: "Actions", items: ["Force logout", "Block device", "Rotate token", "Send push", "Flag for review", "Audit log"] },
    ],
  },
  {
    slug: "operations",
    comp: "Operations",
    title: "Operations",
    desc: "Live monitoring, delivery assignment, and manual intervention across the network.",
    icons: ["Activity", "Truck", "AlertTriangle", "Handshake"],
    kpis: [
      { label: "Live orders", value: "—", icon: "Activity", accent: "green" },
      { label: "Riders on shift", value: "—", icon: "Truck", accent: "green" },
      { label: "Delayed orders", value: 0, icon: "AlertTriangle", accent: "orange" },
      { label: "Interventions today", value: 0, icon: "Handshake", accent: "ink" },
    ],
    sections: [
      { title: "Live monitoring", items: ["Live order map", "Delivery assignment", "Rider availability", "Vendor delays", "Failed orders", "Customer complaints", "Manual intervention"] },
      { title: "Zones & routing", items: ["Delivery zone editor", "Zone-based commission", "Radius overrides", "Peak-hour routing", "Auto-dispatch rules"] },
    ],
  },
  {
    slug: "performance",
    comp: "Performance",
    title: "Performance",
    desc: "Sales, acceptance, cancellation, prep and delivery times per store and city.",
    icons: ["TrendingUp", "CheckCircle2", "XCircle", "Clock"],
    kpis: [
      { label: "Acceptance rate", value: "—", icon: "CheckCircle2", accent: "green" },
      { label: "Cancellation rate", value: "—", icon: "XCircle", accent: "orange" },
      { label: "Avg. prep time", value: "—", icon: "Clock", accent: "ink" },
      { label: "Avg. delivery time", value: "—", icon: "TrendingUp", accent: "green" },
    ],
    sections: [
      { title: "Metrics tracked", items: ["Sales performance", "Order volume", "Acceptance rate", "Cancellation rate", "Avg. preparation time", "Delivery time", "Customer rating", "Repeat customer rate", "Vendor ranking"] },
      { title: "Views", items: ["Per store", "Per city", "Per cuisine", "Per weekday", "Peak hours", "Season vs. baseline"] },
    ],
  },
  {
    slug: "sales",
    comp: "Sales",
    title: "Sales",
    desc: "Gross and net sales, commission, delivery fees, refunds and discounts.",
    icons: ["TrendingUp", "Banknote", "Receipt", "PercentCircle"],
    kpis: [
      { label: "Gross sales", value: "—", icon: "TrendingUp", accent: "green" },
      { label: "Net sales", value: "—", icon: "Banknote", accent: "green" },
      { label: "Commission earned", value: "—", icon: "Receipt", accent: "orange" },
      { label: "Refunds & discounts", value: "—", icon: "PercentCircle", accent: "ink" },
    ],
    sections: [
      { title: "Breakdown", items: ["Gross sales", "Net sales", "Commission earned", "Delivery fees", "Service charges", "Refunds", "Discounts"] },
      { title: "Cuts by", items: ["Day / week / month", "Store", "City", "Country", "Cuisine", "Payment method"] },
    ],
  },
  {
    slug: "success",
    comp: "Success",
    title: "Vendor success",
    desc: "Onboarding checklists, quality scores, and account-manager notes.",
    icons: ["Sparkles", "ListChecks", "Camera", "NotebookPen"],
    kpis: [
      { label: "Onboarding in progress", value: "—", icon: "ListChecks", accent: "orange" },
      { label: "Menu quality avg.", value: "—", icon: "Sparkles", accent: "green" },
      { label: "Photo quality avg.", value: "—", icon: "Camera", accent: "green" },
      { label: "Open success tasks", value: "—", icon: "NotebookPen", accent: "ink" },
    ],
    sections: [
      { title: "Vendor success tools", items: ["Onboarding checklist", "Store performance tips", "Menu quality score", "Photo quality score", "Sales improvement recommendations", "Vendor support notes", "Account manager notes"] },
      { title: "Playbooks", items: ["New vendor 30-day plan", "Quality recovery plan", "High-cancellation recovery", "Rating recovery", "Menu photo redo", "Cuisine coaching"] },
    ],
  },
  {
    slug: "benchmarking",
    comp: "Benchmarking",
    title: "Market benchmarking",
    desc: "Compare each store against similar vendors on ranking, AOV, prep time and more.",
    icons: ["BarChart3", "Trophy", "Star", "Clock"],
    kpis: [
      { label: "Stores benchmarked", value: "—", icon: "BarChart3", accent: "green" },
      { label: "Top-quartile stores", value: "—", icon: "Trophy", accent: "green" },
      { label: "Avg. rating", value: "—", icon: "Star", accent: "orange" },
      { label: "Median prep time", value: "—", icon: "Clock", accent: "ink" },
    ],
    sections: [
      { title: "Comparison dimensions", items: ["Average order value", "Sales ranking", "Customer rating", "Preparation time", "Delivery success rate", "Best-selling dishes", "City performance comparison"] },
      { title: "Cohorts", items: ["Same cuisine", "Same city", "Same price band", "Same order volume band", "Same launch quarter"] },
    ],
  },
  {
    slug: "customer-insights",
    comp: "CustomerInsights",
    title: "Customer insights",
    desc: "New vs. returning customers, LTV, top spenders, search trends and demand.",
    icons: ["UserPlus", "Repeat", "TrendingUp", "MapPin"],
    kpis: [
      { label: "New customers (30d)", value: "—", icon: "UserPlus", accent: "green" },
      { label: "Returning customers (30d)", value: "—", icon: "Repeat", accent: "orange" },
      { label: "Median LTV", value: "—", icon: "TrendingUp", accent: "green" },
      { label: "Hot demand zones", value: "—", icon: "MapPin", accent: "ink" },
    ],
    sections: [
      { title: "Insights", items: ["New customers", "Returning customers", "Customer lifetime value", "Top customers", "Most ordered meals", "Search trends", "Location demand", "Customer retention"] },
      { title: "Segments", items: ["Weekend regulars", "Late-night orderers", "High-AOV households", "Grocery-heavy", "Party caterers", "First-order customers", "Churn risk"] },
    ],
  },
  {
    slug: "reviews",
    comp: "Reviews",
    title: "Reviews & complaints",
    desc: "Store, food, rider reviews and customer complaints, with reply and analytics.",
    icons: ["MessageSquare", "Star", "Flag", "Reply"],
    kpis: [
      { label: "Reviews (30d)", value: "—", icon: "MessageSquare", accent: "green" },
      { label: "Avg. rating", value: "—", icon: "Star", accent: "orange" },
      { label: "Reported reviews", value: "—", icon: "Flag", accent: "ink" },
      { label: "Replies pending", value: "—", icon: "Reply", accent: "orange" },
    ],
    sections: [
      { title: "Review streams", items: ["Store reviews", "Food reviews", "Rider reviews", "Customer complaints", "Review replies", "Reported reviews", "Rating analytics"] },
      { title: "Moderation", items: ["Auto-hide keywords", "Reply templates", "Escalate to support", "Refund from review", "Flag for legal review"] },
    ],
  },
  {
    slug: "ads",
    comp: "Ads",
    title: "Ads",
    desc: "Featured placements, sponsored menu items, banners and city-based campaigns.",
    icons: ["Megaphone", "Eye", "MousePointerClick", "Wallet"],
    kpis: [
      { label: "Active campaigns", value: "—", icon: "Megaphone", accent: "green" },
      { label: "Impressions (30d)", value: "—", icon: "Eye", accent: "orange" },
      { label: "Clicks (30d)", value: "—", icon: "MousePointerClick", accent: "green" },
      { label: "Ad spend (30d)", value: "—", icon: "Wallet", accent: "ink" },
    ],
    sections: [
      { title: "Ad types", items: ["Featured store placement", "Sponsored menu items", "Banner ads", "City-based campaigns"] },
      { title: "Performance", items: ["Budget tracking", "Impressions", "Clicks", "Conversions", "CPA", "ROAS"] },
    ],
  },
  {
    slug: "offers",
    comp: "Offers",
    title: "Offers",
    desc: "Promo codes, free-delivery offers, and vendor- or city-specific discounts.",
    icons: ["Tag", "Percent", "Gift", "Rocket"],
    kpis: [
      { label: "Active offers", value: "—", icon: "Tag", accent: "green" },
      { label: "Redemptions (30d)", value: "—", icon: "Percent", accent: "orange" },
      { label: "Referral offers", value: "—", icon: "Gift", accent: "green" },
      { label: "First-order offers", value: "—", icon: "Rocket", accent: "ink" },
    ],
    sections: [
      { title: "Offer types", items: ["Promo codes", "Free delivery offers", "Percentage discounts", "Fixed amount discounts", "Vendor-specific offers", "City-wide offers", "First-order discount", "Referral offers"] },
      { title: "Rules", items: ["Min basket", "Max discount cap", "Once per customer", "New customer only", "Stackable with X", "Blackout dates", "Currency-specific"] },
    ],
  },
  {
    slug: "marketing",
    comp: "Marketing",
    title: "Marketing",
    desc: "Push, email, SMS and WhatsApp campaigns with segmentation and analytics.",
    icons: ["Send", "Mail", "MessageCircle", "PieChart"],
    kpis: [
      { label: "Campaigns (30d)", value: "—", icon: "Send", accent: "green" },
      { label: "Emails sent", value: "—", icon: "Mail", accent: "orange" },
      { label: "WhatsApp messages", value: "—", icon: "MessageCircle", accent: "green" },
      { label: "Open rate avg.", value: "—", icon: "PieChart", accent: "ink" },
    ],
    sections: [
      { title: "Channels", items: ["Push notifications", "Email campaigns", "SMS campaigns", "WhatsApp campaign support"] },
      { title: "Analytics & audience", items: ["Customer segmentation", "Delivery rates", "Open rates", "Click rates", "Conversion", "Unsubscribes"] },
    ],
  },
  {
    slug: "menu",
    comp: "Menu",
    title: "Menu",
    desc: "Manage restaurant and grocery menus — categories, dishes, add-ons and stock.",
    icons: ["UtensilsCrossed", "ShoppingBasket", "PackageOpen", "AlertTriangle"],
    kpis: [
      { label: "Active dishes", value: "—", icon: "UtensilsCrossed", accent: "green" },
      { label: "Grocery SKUs", value: "—", icon: "ShoppingBasket", accent: "orange" },
      { label: "Out of stock", value: "—", icon: "PackageOpen", accent: "orange" },
      { label: "Low stock alerts", value: "—", icon: "AlertTriangle", accent: "ink" },
    ],
    sections: [
      { title: "Restaurant / home chef", items: ["Categories", "Dishes", "Add-ons", "Ingredients", "Allergens", "Spice level", "Portion size", "Photos", "Availability", "Preparation time"] },
      { title: "Grocery shop", items: ["Product categories", "Product name", "Unit size", "Stock quantity", "Price", "Bulk price", "Product image", "Low stock alert"] },
    ],
  },
  {
    slug: "payments",
    comp: "Payments",
    title: "Payments",
    desc: "Stripe (UK), Paystack (Nigeria), bank transfer, wallet and cash on delivery.",
    icons: ["CreditCard", "AlertOctagon", "RotateCcw", "ReceiptText"],
    kpis: [
      { label: "Payments (30d)", value: "—", icon: "CreditCard", accent: "green" },
      { label: "Failed payments", value: "—", icon: "AlertOctagon", accent: "orange" },
      { label: "Refunds", value: "—", icon: "RotateCcw", accent: "ink" },
      { label: "Chargebacks", value: "—", icon: "ReceiptText", accent: "orange" },
    ],
    sections: [
      { title: "Providers & methods", items: ["Stripe (UK)", "Paystack (Nigeria)", "Bank transfer", "Wallet", "Cash on delivery"] },
      { title: "Tracking", items: ["Payment status", "Failed payments", "Refunds", "Chargebacks", "Vendor settlement", "Rider payment"] },
    ],
  },
  {
    slug: "payouts-orders",
    comp: "PayoutsByOrder",
    title: "Payouts by order",
    desc: "Per-order breakdown of commission, fees, refunds, vendor and rider payout.",
    icons: ["ReceiptText", "PercentCircle", "Truck", "Building2"],
    kpis: [
      { label: "Orders (30d)", value: "—", icon: "ReceiptText", accent: "green" },
      { label: "Commission (30d)", value: "—", icon: "PercentCircle", accent: "orange" },
      { label: "Rider payout (30d)", value: "—", icon: "Truck", accent: "green" },
      { label: "Platform earnings", value: "—", icon: "Building2", accent: "ink" },
    ],
    sections: [
      { title: "Per-order columns", items: ["Order ID", "Gross order amount", "Commission", "Delivery fee", "Service charge", "Refunds", "Vendor net payout", "Rider payout", "Platform earnings"] },
      { title: "Views", items: ["By store", "By city", "By day", "By payment method", "By currency", "Reconciliation view"] },
    ],
  },
  {
    slug: "invoices",
    comp: "Invoices",
    title: "Invoices",
    desc: "Vendor, commission, and VAT invoices with downloadable PDF statements.",
    icons: ["FileText", "Percent", "Calendar", "Download"],
    kpis: [
      { label: "Invoices this month", value: "—", icon: "FileText", accent: "green" },
      { label: "VAT invoices", value: "—", icon: "Percent", accent: "orange" },
      { label: "Monthly statements", value: "—", icon: "Calendar", accent: "green" },
      { label: "Ready to download", value: "—", icon: "Download", accent: "ink" },
    ],
    sections: [
      { title: "Types", items: ["Vendor invoices", "Commission invoices", "Monthly statements", "VAT invoices where applicable", "Downloadable PDF invoices"] },
      { title: "Actions", items: ["Batch download", "Send to accountant", "Regenerate PDF", "Archive", "Reissue with correction"] },
    ],
  },
  {
    slug: "invoice-settings",
    comp: "InvoiceSettings",
    title: "Invoice settings",
    desc: "Configure company details, VAT/tax numbers, numbering, logo and footer notes.",
    icons: ["Settings2", "Hash", "Image", "Globe"],
    sections: [
      { title: "Company details", items: ["Company name", "Company address", "VAT / tax number", "Invoice numbering", "Invoice logo", "Invoice footer notes"] },
      { title: "Tax by country", items: ["UK VAT rules", "Nigeria VAT rules", "Reverse charge cases", "Zero-rated categories", "Regional overrides"] },
    ],
  },
  {
    slug: "banking",
    comp: "Banking",
    title: "Banking",
    desc: "Vendor and rider bank accounts, verification and payment provider IDs.",
    icons: ["Landmark", "ShieldCheck", "BadgeAlert", "IdCard"],
    kpis: [
      { label: "Verified vendor accounts", value: "—", icon: "ShieldCheck", accent: "green" },
      { label: "Verified rider accounts", value: "—", icon: "ShieldCheck", accent: "green" },
      { label: "Failed verifications", value: "—", icon: "BadgeAlert", accent: "orange" },
      { label: "Provider IDs on file", value: "—", icon: "IdCard", accent: "ink" },
    ],
    sections: [
      { title: "Stored fields", items: ["Vendor bank details", "Rider bank details", "Verification status", "Payout account", "Payment provider account ID", "Failed bank verification alerts"] },
      { title: "Verification providers", items: ["Stripe Connect", "Paystack Subaccount", "Open Banking (UK)", "NIBSS (Nigeria)", "Manual review"] },
    ],
  },
  {
    slug: "financing",
    comp: "Financing",
    title: "Financing",
    desc: "Vendor cash advance, loan eligibility and sales-based financing.",
    icons: ["HandCoins", "Gauge", "TrendingUp", "FileText"],
    kpis: [
      { label: "Active advances", value: "—", icon: "HandCoins", accent: "green" },
      { label: "Eligible vendors", value: "—", icon: "Gauge", accent: "orange" },
      { label: "Repaid this month", value: "—", icon: "TrendingUp", accent: "green" },
      { label: "Applications open", value: "—", icon: "FileText", accent: "ink" },
    ],
    sections: [
      { title: "Programme", items: ["Vendor cash advance", "Loan eligibility", "Sales-based financing", "Repayment tracking", "Financing application status"] },
      { title: "Risk model", items: ["Sales stability", "Chargeback ratio", "Cancellation rate", "Menu maturity", "Verification tier", "Age of vendor"] },
    ],
  },
  {
    slug: "users",
    comp: "Users",
    title: "Users & roles",
    desc: "Admins, vendor staff, riders and customers with role-based access.",
    icons: ["Shield", "Users", "UserCog", "Key"],
    kpis: [
      { label: "Admin users", value: "—", icon: "Shield", accent: "green" },
      { label: "Vendor staff", value: "—", icon: "Users", accent: "orange" },
      { label: "Rider users", value: "—", icon: "UserCog", accent: "green" },
      { label: "Custom roles", value: "—", icon: "Key", accent: "ink" },
    ],
    sections: [
      { title: "Roles", items: ["Super admin", "Admin", "Finance admin", "Operations admin", "Support admin", "Vendor owner", "Vendor manager", "Vendor staff", "Rider", "Customer"] },
      { title: "Access controls", items: ["Per-module permissions", "Two-factor enforcement", "Session expiry", "Audit log", "Impersonation with logging", "SSO (planned)"] },
    ],
  },
  {
    slug: "delivery",
    comp: "Delivery",
    title: "Delivery settings",
    desc: "Zones, radius, fees, assignment rules, scheduling and country-specific settings.",
    icons: ["Truck", "MapPin", "Wallet", "Clock"],
    kpis: [
      { label: "Delivery zones", value: "—", icon: "MapPin", accent: "green" },
      { label: "Free-delivery threshold", value: "—", icon: "Wallet", accent: "orange" },
      { label: "Avg. radius (km)", value: "—", icon: "Truck", accent: "green" },
      { label: "Scheduled deliveries", value: "—", icon: "Clock", accent: "ink" },
    ],
    sections: [
      { title: "Configuration", items: ["Delivery zones", "Delivery radius", "Delivery fees", "Free delivery threshold", "Rider assignment rules", "Pickup option", "Scheduled delivery", "Cash on delivery rules", "Country / city-specific settings"] },
      { title: "Assignment rules", items: ["Proximity first", "Highest rating", "Fewest active jobs", "Fair distribution", "Manual override", "Auto-reassign on delay"] },
    ],
  },
  {
    slug: "settings",
    comp: "Settings",
    title: "Settings",
    desc: "Platform-wide countries, currencies, commissions, taxes and notifications.",
    icons: ["Settings2", "Globe", "Coins", "Bell"],
    kpis: [
      { label: "Countries live", value: 2, icon: "Globe", accent: "green" },
      { label: "Currencies", value: 2, icon: "Coins", accent: "orange" },
      { label: "Commission rules", value: "—", icon: "Settings2", accent: "green" },
      { label: "Notification channels", value: 4, icon: "Bell", accent: "ink" },
    ],
    sections: [
      { title: "General system", items: ["Platform name", "Countries", "Cities", "Currency", "Service charge", "Commission rules", "Tax settings", "Notification settings", "App settings", "Payment settings"] },
      { title: "Feature flags", items: ["Cash on delivery", "Scheduled orders", "Wallet payments", "Referral programme", "Vendor financing", "Group orders (beta)"] },
    ],
  },
  {
    slug: "general",
    comp: "General",
    title: "General",
    desc: "Business profile, support contacts, terms & privacy, and app version.",
    icons: ["Info", "Mail", "Phone", "ShieldAlert"],
    sections: [
      { title: "Business profile", items: ["Business profile", "Platform contact details", "Support email", "Support phone number"] },
      { title: "Legal & app", items: ["Terms and conditions", "Privacy policy", "App version", "Maintenance mode"] },
    ],
  },
  {
    slug: "holiday-hours",
    comp: "HolidayHours",
    title: "Holiday hours",
    desc: "Set holiday and special-event hours per store, with admin override.",
    icons: ["CalendarClock", "CalendarX", "CalendarCheck", "ShieldCheck"],
    kpis: [
      { label: "Upcoming holidays", value: "—", icon: "CalendarClock", accent: "green" },
      { label: "Stores closed today", value: "—", icon: "CalendarX", accent: "orange" },
      { label: "Special hours today", value: "—", icon: "CalendarCheck", accent: "green" },
      { label: "Admin overrides", value: "—", icon: "ShieldCheck", accent: "ink" },
    ],
    sections: [
      { title: "Store-set", items: ["Holiday opening hours", "Temporary closure", "Special event hours", "Public holiday schedule"] },
      { title: "Admin controls", items: ["Admin override", "Bulk apply to city", "Bulk apply to cuisine", "Reset to normal hours"] },
    ],
  },
  {
    slug: "prep-times",
    comp: "PrepTimes",
    title: "Preparation times",
    desc: "Default, dish-specific and busy-period preparation times with delay alerts.",
    icons: ["Clock", "Utensils", "Timer", "BellRing"],
    kpis: [
      { label: "Default prep (min)", value: "—", icon: "Clock", accent: "green" },
      { label: "Dish-level overrides", value: "—", icon: "Utensils", accent: "orange" },
      { label: "Busy-period prep (min)", value: "—", icon: "Timer", accent: "ink" },
      { label: "Delay notifications (30d)", value: "—", icon: "BellRing", accent: "orange" },
    ],
    sections: [
      { title: "Configuration", items: ["Default prep time", "Dish-specific prep time", "Busy period prep time", "Automatic prep time adjustment", "Delay notifications"] },
      { title: "Automation", items: ["Auto extend on backlog", "Pause new orders", "Notify customer & rider", "Escalate to support"] },
    ],
  },
  {
    slug: "documents",
    comp: "Documents",
    title: "Documents",
    desc: "Store and verify vendor, rider and business documents.",
    icons: ["FileCheck2", "FileText", "ShieldCheck", "AlertTriangle"],
    kpis: [
      { label: "Documents on file", value: "—", icon: "FileText", accent: "green" },
      { label: "Verified", value: "—", icon: "FileCheck2", accent: "green" },
      { label: "Awaiting review", value: "—", icon: "ShieldCheck", accent: "orange" },
      { label: "Expiring (30d)", value: "—", icon: "AlertTriangle", accent: "ink" },
    ],
    sections: [
      { title: "Vendor documents", items: ["Vendor ID", "Business registration", "Food hygiene certificate", "Insurance", "Tax document"] },
      { title: "Rider documents", items: ["Rider ID", "Rider licence", "Vehicle insurance", "Bank verification document"] },
    ],
  },
  {
    slug: "vendors",
    comp: "VendorsRedirect",
    title: "Vendors",
    desc: "Vendor management has moved — use the Stores section for the full experience.",
    icons: ["Store"],
    kpis: [],
    sections: [
      { title: "Where to find things", items: ["Go to Stores for the full list", "Store groups for cohorts", "Documents for KYC and licences", "Users & roles for staff access"] },
    ],
  },
];

// ---- generator ----

function buildFile(m) {
  const icons = Array.from(new Set([...(m.icons ?? []), ...(m.kpis ?? []).map((k) => k.icon)]));
  const iconImport = icons.length > 0 ? `import { ${icons.join(", ")} } from "lucide-react";` : "";
  const kpisJs = (m.kpis ?? [])
    .map(
      (k) =>
        `{ label: ${JSON.stringify(k.label)}, value: ${typeof k.value === "number" ? k.value : JSON.stringify(k.value)}, Icon: ${k.icon}, accent: ${JSON.stringify(k.accent ?? "green")} }`
    )
    .join(",\n          ");
  const sectionsJs = (m.sections ?? [])
    .map(
      (s) =>
        `{ title: ${JSON.stringify(s.title)}, description: ${JSON.stringify(s.desc ?? "")}, items: ${JSON.stringify(s.items)} }`
    )
    .join(",\n          ");

  return `import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScaffoldPage } from "@/components/admin/AdminUI";
${iconImport}

export const Route = createFileRoute("/_authenticated/admin/${m.slug}")({
  component: Admin${m.comp},
});

function Admin${m.comp}() {
  return (
    <AdminShell>
      <ScaffoldPage
        title=${JSON.stringify(m.title)}
        description=${JSON.stringify(m.desc)}
        kpis={[
          ${kpisJs}
        ]}
        sections={[
          ${sectionsJs}
        ]}
      />
    </AdminShell>
  );
}
`;
}

for (const m of MODULES) {
  const path = join(OUT_DIR, `admin.${m.slug}.tsx`);
  writeFileSync(path, buildFile(m), "utf-8");
  console.log("wrote", path);
}
console.log(`done — ${MODULES.length} modules`);
