const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /variants: item\.variants,\s*is_veg: item\.is_veg,/g;
const replacement = `variants: item.variants,
              is_veg: item.is_veg,
              is_free_delivery: item.is_free_delivery,
              free_delivery_min_amount: item.free_delivery_min_amount,
              free_delivery_max_km: item.free_delivery_max_km,`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Successfully patched free delivery fields into RestaurantCard in page.tsx');
} else {
  console.log('Regex failed for free delivery fields in RestaurantCard');
}
