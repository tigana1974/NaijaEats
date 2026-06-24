# Landing Page Rebuild — ZestyBite Style, Naija Eats Soul

Adopt the structure and visual rhythm of the ZestyBite reference (warm cream background, orange accent, rounded food-photo cards, playful organic shapes) — but re-skin with Naija Eats' African-first identity (jollof rice, suya, egusi, plantain, ankara-pattern accents).

## Visual Language

- **Palette**: cream base `#FFF7EC`, primary terracotta-orange `#E86A2C`, deep brown `#2A1810`, gold accent `#F4B942`, sage `#5B7C4A` for secondary tags. Replace current earthy tokens in `src/styles.css`.
- **Typography**: Bold display sans for hero ("Step into…"), friendly script logo wordmark "NaijaEats" (bottom of page, like ZestyBite signature). Use Google fonts: `Bricolage Grotesque` (display) + `Inter` (body) + `Caveat Brush` or `Pacifico` for the signature wordmark.
- **Shapes**: Soft organic blobs, scattered leaf/spice illustrations, circular food photos with offset shadow cards, sparkle/star accents — all derived from semantic tokens.
- **Imagery**: Replace stock-looking photos with African-dish hero shots (jollof platter, suya skewers, egusi, puff-puff). Generate new assets via imagegen.

## Section-by-section Map

```text
1. Nav            Logo · Home · Menu · About · Vendors · Contact · [Sign in] [Order Now]
2. Hero           Headline "Step Into Naija Eats & Taste the Culture"
                  Sub + Order Now / Become a Vendor CTAs · Featured chef chip + dish price card · jollof hero photo with leaf/blob accents
3. Our Story      Quote-style line · 3 thumbnail photos · stats: 10K+ orders, 500+ chefs, 50+ cities, 4.9★
4. Special Dishes Horizontal card row: Jollof Rice, Suya, Egusi, Pounded Yam — circular photo, rating, price (₦/£), Order Now
5. Why Naija Eats Left copy + Explore More CTA; right 2×2 tile grid: Home Chefs, Restaurants, Grocery, Personal Chef Booking
6. Our Menu       Carousel of 4 dish cards with arrows + tag bubble ("Best seller")
7. Special Offer  Banner card with burger→swap to suya platter, 50% badge, Order Now
8. Testimonials   Overlapping testimonial cards with featured center card
9. Vendor Spots   3 illustrations: Easy Ordering · Fast Delivery · Cooked with Culture
10. Footer        Customer Service · Verticals · Quick Links · Newsletter signup (existing waitlist form)
11. Wordmark      Giant "NaijaEats" script signature like ZestyBite
```

## Implementation Plan

1. **Design tokens** — rewrite `src/styles.css` color tokens (oklch) + add gradient and shadow tokens; add fonts via Google Fonts import; add `@theme` mappings.
2. **Asset generation** — generate 6–8 dish/lifestyle images (jollof hero, suya, egusi bowl, pounded yam, chef portrait, delivery rider, puff-puff, grocery basket) into `src/assets/`.
3. **Refactor `src/routes/index.tsx`** into composed sections under `src/components/naija/landing/`:
   - `Navbar.tsx`, `Hero.tsx`, `Story.tsx`, `SpecialDishes.tsx`, `WhyUs.tsx`, `MenuCarousel.tsx`, `OfferBanner.tsx`, `Testimonials.tsx`, `ServePromise.tsx`, `Footer.tsx`, `BrandWordmark.tsx`.
4. **Decorative SVGs** — leaf, blob, sparkle, ankara-pattern strip as inline components in `src/components/naija/decor/`.
5. **Keep waitlist** — move existing `WaitlistForm` into the Footer newsletter slot (no business-logic change).
6. **Responsive** — mobile-first; carousels become snap-scroll on small screens; hero stacks.
7. **SEO** — keep current `head()` meta; update OG title/description to reflect new positioning.

## Out of Scope
- No changes to auth, discover, vendor pages, DB, or server functions.
- No new routes.
- No real menu data wiring — landing remains static marketing content.

## Open Questions
1. Keep the waitlist form prominently in the hero too (current behavior), or move it solely to the footer newsletter slot as in ZestyBite?
2. Show dual currency ₦/£ on dish cards, or pick one for the marketing page?
3. Want me to also generate a stylized script wordmark image, or render "NaijaEats" with a Google script font (faster, themable)?
