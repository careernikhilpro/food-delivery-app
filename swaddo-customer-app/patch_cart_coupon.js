const fs = require('fs');
let code = fs.readFileSync('src/app/cart/page.tsx', 'utf8');

const regexTotal = /let baseItemTotal = 0;\n\s*cart\.items\.forEach\(\(item\) => \{\n\s*baseItemTotal \+= item\.price \* item\.quantity;\n\s*\}\);/g;

const replTotal = `let baseItemTotal = 0;
          let couponApplicableTotal = 0;
          cart.items.forEach((item) => {
            baseItemTotal += item.price * item.quantity;
            
            const liveItem = stallMenu.find((m) => m.id.toString() === item.id.toString() || \`item-\${m.name.replace(/\\s+/g, '-').toLowerCase()}\` === item.id.toString());
            const checkItem = liveItem || item;
            
            if (checkItem.coupon_applicable !== false) {
              couponApplicableTotal += item.price * item.quantity;
            }
          });`;

if (code.match(regexTotal)) { code = code.replace(regexTotal, replTotal); }

const regexDiscount = /\} else if \(stallOfferIsActive && stallOfferDiscount > 0 && baseItemTotal >= stallOfferMin\) \{\n\s*discountAmount = Math\.round\(baseItemTotal \* \(stallOfferDiscount \/ 100\)\);/g;
const replDiscount = `} else if (stallOfferIsActive && stallOfferDiscount > 0 && baseItemTotal >= stallOfferMin) {
            discountAmount = Math.round(couponApplicableTotal * (stallOfferDiscount / 100));`;
            
if (code.match(regexDiscount)) { code = code.replace(regexDiscount, replDiscount); }

fs.writeFileSync('src/app/cart/page.tsx', code);
console.log('Patched cart/page.tsx for coupon_applicable and free delivery logic');
