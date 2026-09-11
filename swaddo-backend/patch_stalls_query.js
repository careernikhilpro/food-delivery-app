const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

code = code.replace(
  /m\.is_free_delivery, m\.offer_price, m\.discount_percentage, m\.is_highlighted_offer/g,
  'm.is_free_delivery, m.free_delivery_min_amount, m.free_delivery_max_km, m.offer_price, m.discount_percentage, m.is_highlighted_offer'
);

// For the multi-line ones:
code = code.replace(
  /m\.category, m\.is_veg, m\.is_available, m\.has_variants, m\.variants, m\.is_free_delivery,/g,
  'm.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery, m.free_delivery_min_amount, m.free_delivery_max_km,'
);

fs.writeFileSync('src/routes/stalls.routes.ts', code);
console.log('Patched stalls.routes.ts');
