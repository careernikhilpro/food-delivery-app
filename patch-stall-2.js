const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// Replace the price declarations
code = code.replace(
  /const basePrice = Number\(item\.price\) \+ itemMarkup;\s+const originalPrice = Math\.floor\(basePrice \* 1\.3\); \/\/ Fake original price\s+const otherAppPrice = `\$\{Math\.floor\(basePrice \* 1\.4\)\}-\$\{Math\.floor\(basePrice \* 1\.5\)\}`;/,
  `const basePrice = Number(item.price) + itemMarkup;
      const discountPercentage = Number(item.discount_percentage) || 0;
      const hasDiscount = discountPercentage > 0;
      const originalPrice = hasDiscount ? Math.round(basePrice / (1 - (discountPercentage / 100))) : basePrice;
      const otherAppPrice = hasDiscount ? \`\${Math.floor(originalPrice * 1.05)}-\${Math.floor(originalPrice * 1.15)}\` : null;`
);

// Replace UI
const uiStart = '<div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">';
let startIndex = code.indexOf(uiStart);
if (startIndex !== -1) {
  let endIndex = code.indexOf('</div>', code.indexOf('Other apps:', startIndex));
  if (endIndex !== -1) {
    endIndex += 6; // Include </div>
    const newUI = `<div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">
              {hasDiscount ? (
                <>
                  <span className="text-gray-400 text-[12px] font-semibold line-through decoration-gray-300">&#8377;{originalPrice}</span>
                  <span className="bg-pink-100 text-[#C2185B] text-[11px] font-black px-1.5 py-0.5 rounded">&#8377;{basePrice}</span>
                </>
              ) : (
                <span className="text-gray-900 text-[13px] font-black">&#8377;{basePrice}</span>
              )}
            </div>
            
            {hasDiscount && otherAppPrice && (
              <div className="flex items-center gap-1">
                <PromoIcon className="w-4 h-4 object-contain opacity-70 grayscale" />
                <span className="text-gray-500 text-[11px] font-medium">Other apps: &#8377;{otherAppPrice}</span>
              </div>
            )}`;
    code = code.substring(0, startIndex) + newUI + code.substring(endIndex);
  }
}

// Fix the category header
code = code.replace(
  /<div className="flex items-center gap-2">\s*<PromoIcon className="w-6 h-6 object-contain" \/>\s*<h2 className="text-\[15px\] font-black text-\[\#C2185B\] tracking-tight leading-none uppercase">20% LOWER PRICES vs OTHER APPS<\/h2>\s*<\/div>/g,
  `<div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none capitalize">{cat}</h2>
                  </div>`
);

// Remove the promo banner
const promoBannerStart = '<div className="flex items-start gap-2 mb-4">';
const promoBannerEndText = 'Prices seen only on Swaddo</p>\n              </div>\n            </div>';
let pbStart = code.indexOf(promoBannerStart);
if (pbStart !== -1) {
  let pbEnd = code.indexOf(promoBannerEndText, pbStart);
  if (pbEnd !== -1) {
    code = code.substring(0, pbStart) + code.substring(pbEnd + promoBannerEndText.length);
  }
}

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed stall page perfectly');
