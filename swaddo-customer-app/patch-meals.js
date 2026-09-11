const fs = require('fs');
let code = fs.readFileSync('src/app/meals-under-99/page.tsx', 'utf8');

const regex = /const parsedPrice = typeof item\.price === 'number' \? item\.price : parseFloat\(\(item\.price \|\| "0"\)\.toString\(\)\.replace\(\/\[\^0-9\.\]\/g, ''\)\);\s*const originalPrice = Math\.round\(parsedPrice \* 1\.2\);/;

const replacement = `const merchantPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
                let parsedPrice = merchantPrice;
                const originalPrice = Math.round(merchantPrice * 1.2);
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
                }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/meals-under-99/page.tsx', code);
  console.log('Patched meals-under-99 page');
} else {
  console.log('Regex did not match in meals-under-99');
}
