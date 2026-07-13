/**
 * Real photography for the landing page. All URLs are Unsplash, which allows
 * hotlinking under their license and returns responsive `w=` variants.
 *
 * Keep image URLs together here so future swaps are one file change.
 */

const u = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&auto=format&fit=crop`;

/** Big hero image (right-hand circular photo). */
export const heroFood = u("1512621776951-a57141f2eefd", 1400); // steaming stew / bowl of rice

export const dishJollof = "/landing/dish1.jpg";
export const dishSuya = "/landing/dish2.jpg";
export const dishEgusi = "/landing/dish3.jpg";
export const dishPuffpuff = "/landing/dish4.jpg";
export const dishExtra = "/landing/dish5.jpg";

/** Chef / people */
export const chefPortrait = u("1577219491135-ce391730fb2c", 640); // African chef portrait
export const offerPlatter = u("1546793665-c74683f339c1", 1400);   // festive food platter

/** Testimonial avatars — natural portraits */
export const avatarTunde = u("1507003211169-0a1dd7228f2d", 200);
export const avatarRahim = u("1531384441138-2736e62e0919", 200);
export const avatarEmily = u("1494790108377-be9c29b29330", 200);
export const avatarSade = u("1531123897727-8f129e1688ce", 200);

/**
 * "What we serve" trio — real photos served straight from Unsplash so they
 * render out-of-the-box with no manual file-drop step. To swap for your own
 * uploads, drop them at `public/landing/<filename>.jpg` and switch each
 * export back to `"/landing/<filename>.jpg"`.
 */
export const illusOrder = "/landing/easy-order.jpg";
export const illusRider = "/landing/fast-delivery.jpg";
export const illusChef = "/landing/cooked-culture.jpg";

/**
 * Category rail thumbnails (Discover page) — small real-food crops served
 * from Unsplash at 96px so the icon row looks like Uber Eats' photographic
 * category strip rather than emoji.
 */
const cat = (id: string) => u(id, 96, 70);

export const categoryPhotos: Record<string, string> = {
  all: cat("1512621776951-a57141f2eefd"),        // colourful bowls spread
  jollof: "/landing/categories/jollof.png",      // local generated jollof image
  suya: "/landing/categories/suya.png",          // local generated suya image
  soups: "/landing/categories/soups.png",        // local generated soup image
  swallow: "/landing/categories/swallow.png",    // local generated swallow image
  rice: "/landing/categories/rice.png",          // local generated rice image
  grills: "/landing/categories/grills.png",      // local generated grills image
  snacks: "/landing/categories/snacks.png",      // local generated snacks image
  drinks: cat("1551024709-8f23befc6f87"),          // iced drinks
  grocery: cat("1542838132-92c53300491e"),         // fresh market produce
  chefs: cat("1577219491135-ce391730fb2c"),        // chef at work
  restaurants: cat("1517248135467-4c7edcad34c4"),  // restaurant tables
};
