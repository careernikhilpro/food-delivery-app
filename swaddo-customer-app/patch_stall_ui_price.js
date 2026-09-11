const fs = require('fs');

const file = 'src/app/stall/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const matchStr = '&#8377;{v.price}';
const replStr = '&#8377;{getVariantPrice(v.price)}';

if (code.includes(matchStr)) {
  code = code.replace(matchStr, replStr);
  fs.writeFileSync(file, code);
  console.log('Successfully patched UI price in ' + file);
} else {
  console.log('Regex failed for ' + file);
}
