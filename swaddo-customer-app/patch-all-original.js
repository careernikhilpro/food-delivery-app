const fs = require('fs');

// Patch meals-under-99
let mealsCode = fs.readFileSync('src/app/meals-under-99/page.tsx', 'utf8');
const mealsRegex = /const merchantPrice = typeof item\.price[\s\S]*?const originalPrice = Math\.round\(merchantPrice \* 1\.2\);\s*if \(item\.offer_price\) \{\s*parsedPrice = Number\(item\.offer_price\);\s*\} else if \(item\.discount_percentage\) \{\s*parsedPrice = Math\.round\(merchantPrice \* \(1 - Number\(item\.discount_percentage\)\/100\)\);\s*\}/;

const mealsReplacement = `const merchantPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
                let parsedPrice = merchantPrice;
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
                }
                const originalPrice = parsedPrice < merchantPrice ? merchantPrice : Math.round(merchantPrice * 1.3);`;

if (mealsCode.match(mealsRegex)) {
  mealsCode = mealsCode.replace(mealsRegex, mealsReplacement);
  fs.writeFileSync('src/app/meals-under-99/page.tsx', mealsCode);
  console.log('Patched meals-under-99 originalPrice');
}

// Patch category
let catCode = fs.readFileSync('src/app/category/[name]/ClientCategoryPage.tsx', 'utf8');
const catRegex = /let parsedPrice = merchantPrice;\s*const originalPrice = merchantPrice;\s*if \(item\.offer_price\)/;

const catReplacement = `let parsedPrice = merchantPrice;
            if (item.offer_price) {
              parsedPrice = Number(item.offer_price);
            } else if (item.discount_percentage) {
              parsedPrice = Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
            }
            const hasOffer = parsedPrice < merchantPrice;
            const originalPrice = hasOffer ? merchantPrice : Math.round(merchantPrice * 1.3);
            if (item.offer_price)`; // Need to match the rest safely, let me redo with a safer regex.

// Let's just do a simpler replace for category
const catRegexFull = /let parsedPrice = merchantPrice;\s*const originalPrice = merchantPrice;\s*if \(item\.offer_price\) \{\s*parsedPrice = Number\(item\.offer_price\);\s*\} else if \(item\.discount_percentage\) \{\s*parsedPrice = Math\.round\(merchantPrice \* \(1 - Number\(item\.discount_percentage\)\/100\)\);\s*\}\s*const hasOffer = parsedPrice < merchantPrice;/;

const catReplacementFull = `let parsedPrice = merchantPrice;
            if (item.offer_price) {
              parsedPrice = Number(item.offer_price);
            } else if (item.discount_percentage) {
              parsedPrice = Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
            }
            const hasOffer = parsedPrice < merchantPrice;
            const originalPrice = hasOffer ? merchantPrice : Math.round(merchantPrice * 1.3);`;

if (catCode.match(catRegexFull)) {
  catCode = catCode.replace(catRegexFull, catReplacementFull);
  fs.writeFileSync('src/app/category/[name]/ClientCategoryPage.tsx', catCode);
  console.log('Patched category originalPrice');
}

