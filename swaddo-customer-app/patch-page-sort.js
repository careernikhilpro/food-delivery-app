const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /const parsePrice = \(price: any\) => typeof price === 'number' \? price : parseFloat\(\(price \|\| "0"\)\.toString\(\)\.replace\(\/\[\^0-9\.\]\/g, ''\)\);\s*const sortedDishes = res\.data\.dishes\.sort\(\(a: any, b: any\) => parsePrice\(a\.price\) - parsePrice\(b\.price\)\);/;

const replacement = `const getFinalPrice = (item: any) => {
            if (item.offer_price) return Number(item.offer_price);
            const merchantPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
            if (item.discount_percentage) return Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
            return merchantPrice;
          };
          const sortedDishes = res.data.dishes.sort((a: any, b: any) => {
            // First sort by offer
            const aHasOffer = !!a.offer_price;
            const bHasOffer = !!b.offer_price;
            if (aHasOffer && !bHasOffer) return -1;
            if (!aHasOffer && bHasOffer) return 1;
            // Then by final price
            return getFinalPrice(a) - getFinalPrice(b);
          });`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Patched page.tsx sorting logic');
} else {
  console.log('Regex did not match for page.tsx sorting logic');
}
