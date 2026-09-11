const fs = require('fs');
let code = fs.readFileSync('src/app/category/[name]/ClientCategoryPage.tsx', 'utf8');

const regexModal = /const vPrice = Number\(\(v\.price \|\| "0"\)\.toString\(\)\.replace\(\/\[\^0-9\.\]\/g, ''\)\);/g;

const replacementModal = `const rawVPrice = Number((v.price || "0").toString().replace(/[^0-9.]/g, ''));
                let baseItemPrice = Number(variantModal.item.price || rawVPrice);
                let vPrice = rawVPrice;
                if (baseItemPrice > 0) {
                  let effectiveDiscount = 0;
                  if (variantModal.item.offer_price) {
                    effectiveDiscount = 1 - (Number(variantModal.item.offer_price) / baseItemPrice);
                  } else if (variantModal.item.discount_percentage) {
                    effectiveDiscount = Number(variantModal.item.discount_percentage) / 100;
                  }
                  vPrice = Math.round(rawVPrice * (1 - effectiveDiscount));
                }`;

if (code.match(regexModal)) {
  code = code.replace(regexModal, replacementModal);
  fs.writeFileSync('src/app/category/[name]/ClientCategoryPage.tsx', code);
  console.log('Successfully patched Variant Modal logic in ClientCategoryPage.tsx');
} else {
  console.log('Regex failed for ClientCategoryPage.tsx');
}
