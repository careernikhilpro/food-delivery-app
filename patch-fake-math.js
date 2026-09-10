const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// Replace the price declarations
const oldStr = `const discountPercentage = Number(item.discount_percentage) || 0;
      const hasDiscount = discountPercentage > 0;
      const originalPrice = hasDiscount ? Math.round(basePrice / (1 - (discountPercentage / 100))) : basePrice;
      const otherAppPrice = hasDiscount ? \`\${Math.floor(originalPrice * 1.05)}-\${Math.floor(originalPrice * 1.15)}\` : null;`;
      
const newStr = `const originalPrice = Math.floor(basePrice * 1.3); // Fake original price
      const otherAppPrice = \`\${Math.floor(basePrice * 1.4)}-\${Math.floor(basePrice * 1.5)}\`;`;

code = code.replace(oldStr, newStr);

// Restore the UI for fake math
const uiStart = '<div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">';
let startIndex = code.indexOf(uiStart);
if (startIndex !== -1) {
  let endIndex = code.indexOf('</div>', code.indexOf('Other apps:', startIndex));
  if (endIndex !== -1) {
    endIndex += 6;
    const newUI = `<div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">
              <span className="text-gray-400 text-[12px] font-semibold line-through decoration-gray-300">&#8377;{originalPrice}</span>
              <span className="bg-pink-100 text-[#C2185B] text-[11px] font-black px-1.5 py-0.5 rounded">&#8377;{basePrice}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <PromoIcon className="w-4 h-4 object-contain opacity-70 grayscale" />
              <span className="text-gray-500 text-[11px] font-medium">Other apps: &#8377;{otherAppPrice}</span>
            </div>`;
    code = code.substring(0, startIndex) + newUI + code.substring(endIndex);
  }
}

// Restore the top Promo Banner that I deleted
const searchBarMarker = '{/* Search Bar */}';
let sbIndex = code.indexOf(searchBarMarker);
if (sbIndex !== -1 && !code.includes('20% LOWER PRICES vs OTHER APPS')) {
  const promoBanner = `{/* Promo Section */}
          <div className="flex items-start gap-2 mb-4">
            <PromoIcon className="w-8 h-8 shrink-0 object-contain mt-0.5" />
            <div>
              <p className="font-extrabold text-[#C2185B] text-[15px] leading-tight">20% LOWER PRICES vs OTHER APPS</p>
              <p className="text-gray-500 text-[12px] mt-0.5">Prices seen only on Swaddo</p>
            </div>
          </div>\n\n          `;
  code = code.substring(0, sbIndex) + promoBanner + code.substring(sbIndex);
}

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Restored fake math on stall page');
