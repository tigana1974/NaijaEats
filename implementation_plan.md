# Goal Description

The goal is to implement a global "Food Types" (or Categories) classification system across the NaijaEats app. This will allow the application to have a unified list of food types (e.g., Jollof, Soups, Grills) that vendors can select from when categorizing their food. If a vendor doesn't see their desired food type, they can add a "Custom" one, which will automatically be added to the global list for future use by any vendor.

## Open Questions

Before proceeding, I need to clarify **where** this Food Type should be applied:

> [!IMPORTANT]
> **Option 1: Menu Item Level (Recommended)**
> We add a new "Food Type" field to each individual **Menu Item**. When adding a dish, the vendor selects its type (e.g., Jollof, Soup, Drink) from a dropdown.
> 
> **Option 2: Menu Section Level**
> We replace the current "Category" (where vendors type "Starters" or "Mains") with this global "Food Type" list. This means vendors would group their menu strictly by global food types (e.g., a "Jollof" section, a "Grills" section) rather than generic sections like "Specials".
>
> **Option 3: Vendor Level**
> The vendor selects their specialty food types for their entire shop (e.g., a vendor is known for "Jollof" and "Swallow").

**Please let me know which option you prefer! (Option 1 is best for searching and discovering specific dishes).**

## Proposed Changes

### Database Migrations

#### [NEW] `supabase/migrations/20260717000000_global_food_types.sql`
- Create a `global_food_types` table to store the unique food types.
- Seed it with initial types: Jollof, Suya, Soups, Swallow, Rice, Grills, Snacks, Drinks.
- Add RLS policies allowing public reads and authenticated inserts (so vendors can add new types).
- Depending on the chosen option, add a foreign key to `menu_items` or `vendors`.

### Components & UI

#### [MODIFY] `src/routes/_authenticated/vendor.menu.tsx`
- Replace the simple text input for categories/food types with a searchable combobox/dropdown.
- Fetch the list of global food types from Supabase.
- Add a "Custom" option that allows the vendor to type a new category, which is then inserted into `global_food_types` and applied to their item/menu.

#### [MODIFY] `src/routes/_authenticated/discover.tsx`
- Update the horizontal category rail on the home page to pull dynamically from the `global_food_types` table (and their respective icons) rather than being hardcoded.

## Verification Plan
1. Apply the database migration.
2. Verify that vendors see the new UI dropdown.
3. Test adding a custom food type and verify it appears in the database and is selectable by other vendors.
4. Verify the customer discover page reflects the new global categories.
