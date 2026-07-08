import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(term) {
  console.log(`\nSearching for: "${term}"`);
  const like = `%${term.replace(/[%_]/g, "")}%`;
  
  const { data: vendors, error: vErr } = await supabase
    .from("vendors")
    .select("id,name,slug,city,country,type,tagline,cover_image_url")
    .eq("status", "approved")
    .or(`name.ilike.${like},tagline.ilike.${like},city.ilike.${like}`)
    .limit(8);
    
  if (vErr) console.error('Vendors Error:', vErr);
  else console.log('Vendors:', vendors?.length, 'found');

  const { data: items, error: iErr } = await supabase
    .from("menu_items")
    .select("id,name,price,currency,image_url,vendor_id,vendors!inner(name,slug,city,status)")
    .eq("is_available", true)
    .eq("vendors.status", "approved")
    .or(`name.ilike.${like},description.ilike.${like}`)
    .limit(10);
    
  if (iErr) console.error('Items Error:', iErr);
  else {
    console.log('Items:', items?.length, 'found');
    if (items?.length > 0) {
        console.log('Sample item:', items[0]);
    }
  }
}

async function run() {
    await testSearch('jollof');
    await testSearch('rice');
    
    console.log('\n--- ALL DB CONTENTS ---');
    const { data: rawItems, error } = await supabase.from('menu_items').select('name, is_available, vendor_id, description').limit(5);
    if(error) console.error("Error fetching raw items:", error)
    console.log('All items:', rawItems);
    
    const { data: rawVendors } = await supabase.from('vendors').select('name, status, id').limit(5);
    console.log('All vendors:', rawVendors);
}

run();
