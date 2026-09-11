const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const badBlock = `                let parsedPrice = basePrice;
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(basePrice * (1 - Number(item.discount_percentage)/100));
                }
                const hasOffer = parsedPrice < basePrice;
                let parsedPrice = basePrice;
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(basePrice * (1 - Number(item.discount_percentage)/100));
                }
                const hasOffer = parsedPrice < basePrice;`;

const goodBlock = `                let parsedPrice = basePrice;
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(basePrice * (1 - Number(item.discount_percentage)/100));
                }
                const hasOffer = parsedPrice < basePrice;`;

if (code.includes(badBlock)) {
  code = code.replace(badBlock, goodBlock);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Fixed syntax error in page.tsx');
} else {
  console.log('Could not find bad block');
}
