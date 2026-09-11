const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// The original replacement we just did
const regex = /newPrice: "\u20B9" \+ Math\.round\(item\.offer_price \? item\.offer_price : \(item\.discount_percentage \? item\.price \* \(1 - item\.discount_percentage\/100\) : item\.price\)\),\s*originalPrice: item\.offer_price \|\| item\.discount_percentage \? "\u20B9" \+ Math\.round\(item\.price\) : "\u20B9" \+ Math\.round\(item\.price \* 1\.2\),/g;

const replacement = `newPrice: "\u20B9" + Math.round(item.offer_price ? item.offer_price : (item.discount_percentage ? item.price * (1 - item.discount_percentage/100) : item.price)),
            originalPrice: "\u20B9" + Math.round(item.price * 1.2),
            hasOffer: !!(item.offer_price || item.discount_percentage),`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Successfully patched hasOffer into RestaurantCard items in page.tsx');
} else {
  console.log('Regex failed for hasOffer in RestaurantCard');
}
