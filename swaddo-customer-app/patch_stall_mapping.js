const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regex = /is_free_delivery: item\.is_free_delivery,/g;
const replacement = `is_free_delivery: item.is_free_delivery,
          free_delivery_min_amount: item.free_delivery_min_amount,
          free_delivery_max_km: item.free_delivery_max_km,`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Successfully patched stall mapping');
} else {
  console.log('Regex failed');
}
