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

/** Special-dishes & carousel cards */
export const dishJollof = u("1596797038530-2c107229654b", 800);   // party rice / jollof
export const dishSuya = u("1544025162-d76694265947", 800);        // grilled skewers
export const dishEgusi = u("1567620832903-9fc6debc209f", 800);    // hearty stew
export const dishPuffpuff = u("1551024601-bec78aea704b", 800);    // fried dough balls

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
export const illusOrder = u("1522202176988-66273c2fd55f", 900); // person on phone about to order food
export const illusRider = u("1526367790999-0150786686a2", 900); // motorbike food-delivery rider on the street
export const illusChef = u("1556909114-f6e7ad7d3136", 900);     // family sharing a meal together
