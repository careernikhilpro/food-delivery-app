const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// 1. Add 'X' to lucide-react imports
if (!code.includes(' X,')) {
  code = code.replace(/import \{ /, 'import { X, ');
}

// 2. Adjust isDeepScrolled threshold because of the restored promo banner
code = code.replace(
  /setIsDeepScrolled\(target\.scrollTop > 260\);/g,
  'setIsDeepScrolled(target.scrollTop > 340);'
);

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed X import and scroll threshold');
