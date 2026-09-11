const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

const regex = /const hasFreeDeliveryItem = cart\.items\.some\(\(item: any\) => \{[\s\S]*?return liveItem\?\.is_free_delivery === true \|\| item\.is_free_delivery === true;\s*\}\);/;

const replacement = `const hasFreeDeliveryItem = cart.items.some((item: any) => {
            const liveItem = liveMenu.find((m: any) => m.id.toString() === item.id.toString() || \`item-\${m.name.replace(/\\s+/g, '-').toLowerCase()}\` === item.id.toString());
            const checkItem = liveItem || item;
            if (checkItem?.is_free_delivery === true) {
              const minAmt = Number(checkItem.free_delivery_min_amount) || 0;
              const maxKm = checkItem.free_delivery_max_km ? Number(checkItem.free_delivery_max_km) : Infinity;
              if (cartTotal >= minAmt && dist <= maxKm) {
                return true;
              }
            }
            return false;
          });`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/checkout/page.tsx', code);
  console.log('Patched checkout logic');
} else {
  console.log('Regex did not match for checkout');
}
