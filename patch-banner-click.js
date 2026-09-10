const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

const regex = /<div className="relative w-full h-\[110px\] bg-white rounded-2xl shadow-\[0_4px_15px_rgba\(0,0,0,0\.04\)\] border border-gray-100 flex items-center overflow-visible">/g;

code = code.replace(
  regex,
  `<div onClick={() => router.push('/stall/40')} className="relative w-full h-[110px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center overflow-visible cursor-pointer">`
);

fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
console.log('Fixed banner to be entirely clickable');
