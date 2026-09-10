const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// Update z-index of variant modal components to z-[150] / z-[160] so they appear above search overlay
code = code.replace(
  /className="fixed inset-0 bg-black\/60 z-50 transition-opacity"/g,
  'className="fixed inset-0 bg-black/60 z-[150] transition-opacity"'
);

code = code.replace(
  /className="fixed top-\[15%\] left-1\/2 -translate-x-1\/2 w-10 h-10 bg-\[\#2D3035\] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer z-\[60\]"/g,
  'className="fixed top-[15%] left-1/2 -translate-x-1/2 w-10 h-10 bg-[#2D3035] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer z-[160]"'
);

code = code.replace(
  /className=\{`fixed \$\{cartItemCount > 0 \? 'bottom-\[85px\]' : 'bottom-0'\} left-0 w-full bg-\[\#f3f4f6\] rounded-t-3xl z-50 overflow-hidden flex flex-col max-h-\[80vh\] transition-all duration-300`\}/g,
  'className={`fixed ${cartItemCount > 0 ? \'bottom-[85px]\' : \'bottom-0\'} left-0 w-full bg-[#f3f4f6] rounded-t-3xl z-[150] overflow-hidden flex flex-col max-h-[80vh] transition-all duration-300`}'
);

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed z-index');
