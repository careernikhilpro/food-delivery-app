const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.routes.ts', 'utf8');

const oldStr = `const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons } = req.body;
    
    const result = await pool.query(
      \`UPDATE menu_items 
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
       WHERE id = $11 RETURNING *\`,
      [
        name, description, price, is_veg, is_available, category, 
        variants ? JSON.stringify(variants) : null, prep_time_minutes, discount_percentage, 
        addons ? JSON.stringify(addons) : null, 
        itemId
      ]
    );`;

const newStr = `const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons, is_highlighted_offer, offer_price } = req.body;
    
    const result = await pool.query(
      \`UPDATE menu_items 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           price = COALESCE($3, price), 
           is_veg = COALESCE($4, is_veg), 
           is_available = COALESCE($5, is_available), 
           category = COALESCE($6, category),
           variants = $7,
           prep_time_minutes = COALESCE($8, prep_time_minutes),
           discount_percentage = COALESCE($9, discount_percentage),
           addons = COALESCE($10, addons),
           is_highlighted_offer = COALESCE($12, is_highlighted_offer),
           offer_price = $13
       WHERE id = $11 RETURNING *\`,
      [
        name, description, price, is_veg, is_available, category, 
        variants ? JSON.stringify(variants) : null, prep_time_minutes, discount_percentage, 
        addons ? JSON.stringify(addons) : null, 
        itemId,
        is_highlighted_offer !== undefined ? is_highlighted_offer : null,
        offer_price !== undefined ? offer_price : null
      ]
    );`;

if (code.includes('is_highlighted_offer')) {
  console.log('Already updated');
} else {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/routes/admin.routes.ts', code);
  console.log('Successfully updated admin.routes.ts');
}
