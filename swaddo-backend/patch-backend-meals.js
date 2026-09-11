const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

// I need to add offer_price, discount_percentage, is_highlighted_offer to the SELECT statement for /meals-under-99
const regex = /m\.category, m\.is_veg, m\.is_available, m\.has_variants, m\.variants, m\.is_free_delivery,\s*s\.name as stall_name, s\.rating as stall_rating/;

const replacement = `m.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery,
          m.offer_price, m.discount_percentage, m.is_highlighted_offer,
          s.name as stall_name, s.rating as stall_rating`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/routes/stalls.routes.ts', code);
  console.log('Patched backend meals-under-99 select');
} else {
  console.log('Regex did not match for backend meals-under-99');
}
