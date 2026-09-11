const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

// search/all
let searchAllMatch = "m.is_free_delivery, m.free_delivery_min_amount, m.free_delivery_max_km, m.offer_price, m.discount_percentage,";
let searchAllRepl = "m.is_free_delivery, m.free_delivery_min_amount, m.free_delivery_max_km, m.offer_price, m.discount_percentage, m.coupon_applicable,";
if (code.includes(searchAllMatch)) { code = code.replace(searchAllMatch, searchAllRepl); }

// meals-under-99
let mealsMatch = "m.has_variants, m.variants, m.is_free_delivery, \nm.free_delivery_min_amount, m.free_delivery_max_km,";
let mealsRepl = "m.has_variants, m.variants, m.is_free_delivery, \nm.free_delivery_min_amount, m.free_delivery_max_km, m.coupon_applicable,";
if (code.includes(mealsMatch)) { code = code.replace(mealsMatch, mealsRepl); }

// stalls/:id
let stallMatch = "m.free_delivery_max_km, m.is_highlighted_offer, m.offer_price \n      FROM menu_items m";
let stallRepl = "m.free_delivery_max_km, m.is_highlighted_offer, m.offer_price, m.coupon_applicable \n      FROM menu_items m";
if (code.includes(stallMatch)) { code = code.replace(stallMatch, stallRepl); }

fs.writeFileSync('src/routes/stalls.routes.ts', code);
console.log('Patched stalls.routes.ts for coupon_applicable');
