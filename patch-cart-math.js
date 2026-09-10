const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/cart/page.tsx', 'utf8');

code = code.replace(
  /Math\.round\(item\.price \* 1\.20\)/g,
  'Math.round(item.price * 1.30)'
);

fs.writeFileSync('swaddo-customer-app/src/app/cart/page.tsx', code);
console.log('Fixed cart to use 1.30');
