const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

code = code.replace(/addons: item\.addons\s*\}\)\);/, `addons: item.addons,
          is_highlighted_offer: item.is_highlighted_offer,
          offer_price: item.offer_price
        }));`);

fs.writeFileSync('src/app/stall/page.tsx', code);
console.log('Patched addons');
