const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.routes.ts', 'utf8');

// Replace Add Menu Item
code = code.replace(
  /const \{ name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons \} = req\.body;\s*if \(\!name/g,
  `const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons, is_free_delivery, free_delivery_min_amount, free_delivery_max_km } = req.body;
    if (!name`
);

code = code.replace(
  /'INSERT INTO menu_items \(stall_id, name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons\) VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11\) RETURNING \*',/g,
  `'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons, is_free_delivery, free_delivery_min_amount, free_delivery_max_km) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',`
);

code = code.replace(
  /addons \? JSON\.stringify\(addons\) : '\[\]'\s*\]/g,
  `addons ? JSON.stringify(addons) : '[]',
        is_free_delivery || false,
        free_delivery_min_amount || 0,
        free_delivery_max_km || null
      ]`
);


// Replace Update Menu Item
code = code.replace(
  /const \{ name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons, is_highlighted_offer, offer_price \} = req\.body;/g,
  `const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons, is_highlighted_offer, offer_price, is_free_delivery, free_delivery_min_amount, free_delivery_max_km } = req.body;`
);

code = code.replace(
  /offer_price = \$13\s*WHERE id = \$11 RETURNING \*/g,
  `offer_price = $13,
             is_free_delivery = COALESCE($14, is_free_delivery),
             free_delivery_min_amount = COALESCE($15, free_delivery_min_amount),
             free_delivery_max_km = COALESCE($16, free_delivery_max_km)
         WHERE id = $11 RETURNING *`
);

code = code.replace(
  /offer_price \!\=\= undefined \? offer_price : null\s*\]/g,
  `offer_price !== undefined ? offer_price : null,
          is_free_delivery !== undefined ? is_free_delivery : null,
          free_delivery_min_amount !== undefined ? free_delivery_min_amount : null,
          free_delivery_max_km !== undefined ? free_delivery_max_km : null
        ]`
);

fs.writeFileSync('src/routes/admin.routes.ts', code);
console.log('Patched admin.routes.ts');
