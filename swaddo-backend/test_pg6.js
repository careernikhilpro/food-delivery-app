
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  try {
    await client.connect();
    
    // Simulate what admin.routes.ts does for PUT
    const payload = {
      name: "Test Veg Momo (With Variants)",
      description: "",
      price: 40,
      is_veg: true,
      is_available: true,
      category: "Main Course",
      variants: [{name: "Half", price: 50}, {name: "Full", price: 100}],
      prep_time_minutes: 15,
      discount_percentage: 0,
      addons: []
    };
    
    // Get the item ID
    const resId = await client.query("SELECT id FROM menu_items LIMIT 1");
    if(resId.rows.length === 0) return console.log("No items");
    const itemId = resId.rows[0].id;
    
    const result = await client.query(
      `UPDATE menu_items 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           price = COALESCE($3, price), 
           is_veg = COALESCE($4, is_veg), 
           is_available = COALESCE($5, is_available), 
           category = COALESCE($6, category),
           variants = $7,
           prep_time_minutes = COALESCE($8, prep_time_minutes),
           discount_percentage = COALESCE($9, discount_percentage),
           addons = COALESCE($10, addons)
       WHERE id = $11 RETURNING *`,
      [
        payload.name, payload.description, payload.price, payload.is_veg, payload.is_available, payload.category, 
        payload.variants ? JSON.stringify(payload.variants) : null, payload.prep_time_minutes, payload.discount_percentage, 
        payload.addons ? JSON.stringify(payload.addons) : null, 
        itemId
      ]
    );
    
    console.log("Success! Updated rows:", result.rowCount);
  } catch(e) {
    console.error("ERROR:", e.message);
  } finally {
    await client.end();
  }
}
check();

