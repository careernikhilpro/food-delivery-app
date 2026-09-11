const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /categoryItems\[0\]\?\.price \? parseInt\(categoryItems\[0\]\.price\.toString\(\)\) : '49'/;
const replacement = `categoryItems[0] ? getFinalPrice(categoryItems[0]) : '49'`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Patched page.tsx header price');
} else {
  console.log('Regex did not match for page.tsx header price');
}
