const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regex = /const merchantPrice = Number\(item\.price\);\s*let basePrice = merchantPrice \+ itemMarkup;\s*\/\/ Use exact merchant price for strikethrough when there is an offer\s*const originalPrice = hasOffer \? merchantPrice : Math\.floor\(merchantPrice \* 1\.3\);\s*if \(item\.offer_price\) \{\s*basePrice = Number\(item\.offer_price\); \/\/ exact offer price\s*\} else if \(item\.discount_percentage\) \{\s*basePrice = Math\.floor\(merchantPrice \* \(1 - Number\(item\.discount_percentage\)\/100\)\);\s*\}\s*const hasOffer = !!\(item\.offer_price \|\| item\.discount_percentage\);/;

const replacement = `const merchantPrice = Number(item.price);
      let basePrice = merchantPrice + itemMarkup;
      
      if (item.offer_price) {
        basePrice = Number(item.offer_price); // exact offer price
      } else if (item.discount_percentage) {
        basePrice = Math.floor(merchantPrice * (1 - Number(item.discount_percentage)/100));
      }
      const hasOffer = !!(item.offer_price || item.discount_percentage);
      const originalPrice = hasOffer ? merchantPrice : Math.floor(merchantPrice * 1.3);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Fixed hasOffer order');
} else {
  console.log('Regex did not match for hasOffer order');
}
