const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /variants: item\.variants,\s*is_veg: item\.is_veg,\s*is_free_delivery: item\.is_free_delivery,\s*free_delivery_min_amount: item\.free_delivery_min_amount,\s*free_delivery_max_km: item\.free_delivery_max_km,/g;

const replacement = `variants: item.variants,
              is_veg: item.is_veg,
              is_free_delivery: item.is_free_delivery,
              free_delivery_min_amount: item.free_delivery_min_amount,
              free_delivery_max_km: item.free_delivery_max_km,
              raw_price: item.price,
              offer_price: item.offer_price,
              discount_percentage: item.discount_percentage,`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Successfully added raw price fields to RestaurantCard in page.tsx');
} else {
  console.log('Regex failed for raw price fields in RestaurantCard');
}
