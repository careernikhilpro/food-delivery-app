const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

const regex = /<div className="relative w-\[190px\] h-\[110px\] mt-0 mb-1">/g;
const replacement = '<div className="relative w-[210px] h-[130px] -mt-4 mb-1 scale-105 origin-left">';

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
  console.log('Successfully updated image size and position');
} else {
  console.log('Regex did not match.');
}
