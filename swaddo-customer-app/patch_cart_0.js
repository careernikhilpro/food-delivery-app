const fs = require('fs');
let code = fs.readFileSync('src/app/cart/page.tsx', 'utf8');

const regex = /const maxKm = checkItem\.free_delivery_max_km \? Number\(checkItem\.free_delivery_max_km\) : Infinity;/g;
const replacement = `const rawMaxKm = checkItem.free_delivery_max_km;
              const maxKm = (!rawMaxKm || Number(rawMaxKm) === 0) ? Infinity : Number(rawMaxKm);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/cart/page.tsx', code);
  console.log('Successfully patched cart logic for 0 maxKm');
} else {
  console.log('Regex failed for cart logic');
}
