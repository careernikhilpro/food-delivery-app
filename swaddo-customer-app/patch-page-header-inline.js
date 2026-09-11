const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /categoryItems\[0\] \? getFinalPrice\(categoryItems\[0\]\) : '49'/;
const replacement = `categoryItems[0] ? Math.round(categoryItems[0].offer_price ? Number(categoryItems[0].offer_price) : (categoryItems[0].discount_percentage ? Number(categoryItems[0].price) * (1 - Number(categoryItems[0].discount_percentage)/100) : Number(categoryItems[0].price))) : '49'`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Patched page.tsx header price inline');
} else {
  console.log('Regex did not match for page.tsx header price inline, trying original regex');
  const regexOrig = /categoryItems\[0\]\?\.price \? parseInt\(categoryItems\[0\]\.price\.toString\(\)\) : '49'/;
  if (code.match(regexOrig)) {
    code = code.replace(regexOrig, replacement);
    fs.writeFileSync('src/app/page.tsx', code);
    console.log('Patched page.tsx header price inline with original regex');
  }
}
