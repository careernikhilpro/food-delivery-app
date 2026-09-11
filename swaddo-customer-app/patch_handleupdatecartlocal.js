const fs = require('fs');

const file = 'src/app/stall/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /isVeg: item\.isVeg \?\? true\s*\}/g;
const replacement = `isVeg: item.isVeg ?? true,
        is_free_delivery: item.is_free_delivery,
        free_delivery_min_amount: item.free_delivery_min_amount,
        free_delivery_max_km: item.free_delivery_max_km
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
  console.log('Successfully patched handleUpdateCartLocal in stall/page.tsx for free delivery fields');
} else {
  console.log('Regex failed for handleUpdateCartLocal in stall/page.tsx');
}
