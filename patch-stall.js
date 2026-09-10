const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// 1. Fix renderMenuItem to use genuine discount_percentage
code = code.replace(
  /const basePrice = Number\(item\.price\) \+ itemMarkup;\s*const originalPrice = Math\.floor\(basePrice \* 1\.3\); \/\/ Fake original price\s*const otherAppPrice = `\$\{Math\.floor\(basePrice \* 1\.4\)\}-\$\{Math\.floor\(basePrice \* 1\.5\)\}`;/g,
  `const basePrice = Number(item.price) + itemMarkup;
      const discountPercentage = Number(item.discount_percentage) || 0;
      const hasDiscount = discountPercentage > 0;
      const originalPrice = hasDiscount ? Math.round(basePrice / (1 - (discountPercentage / 100))) : basePrice;
      const otherAppPrice = hasDiscount ? \`\${Math.floor(originalPrice * 1.05)}-\${Math.floor(originalPrice * 1.15)}\` : null;`
);

// 2. Fix renderMenuItem UI to conditionally show discount styling
code = code.replace(
  /<div className="flex items-center gap-1\.5 mb-1 mt-auto pt-1">\s*<span className="text-gray-400 text-\[12px\] font-semibold line-through decoration-gray-300">,1\{originalPrice\}<\/span>\s*<span className="bg-pink-100 text-\[\#C2185B\] text-\[11px\] font-black px-1\.5 py-0\.5 rounded">,1\{basePrice\}<\/span>\s*<\/div>\s*<div className="flex items-center gap-1">\s*<PromoIcon className="w-4 h-4 object-contain opacity-70 grayscale" \/>\s*<span className="text-gray-500 text-\[11px\] font-medium">Other apps: ,1\{otherAppPrice\}<\/span>\s*<\/div>/g,
  `<div className="flex items-center gap-1.5 mb-1 mt-auto pt-1">
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
            )}`
);

// 3. Fix the Category Header that was accidentally hardcoded to the promo banner
code = code.replace(
  /<div className="flex items-center justify-between mb-5">\s*<div className="flex items-center gap-2">\s*<PromoIcon className="w-6 h-6 object-contain" \/>\s*<h2 className="text-\[15px\] font-black text-\[\#C2185B\] tracking-tight leading-none uppercase">20% LOWER PRICES vs OTHER APPS<\/h2>\s*<\/div>\s*<ChevronDown size=\{20\} className="text-gray-400" \/>\s*<\/div>/g,
  `<div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight leading-none capitalize">{cat}</h2>
                  </div>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>`
);

// 4. Also remove the top promo banner from the store page (optional but it's hardcoded and might confuse them)
code = code.replace(
  /<div className="flex items-start gap-2 mb-4">\s*<PromoIcon className="w-8 h-8 shrink-0 object-contain mt-0\.5" \/>\s*<div>\s*<p className="font-extrabold text-\[\#C2185B\] text-\[15px\] leading-tight">20% LOWER PRICES vs OTHER APPS<\/p>\s*<p className="text-gray-500 text-\[12px\] mt-0\.5">Prices seen only on Swaddo<\/p>\s*<\/div>\s*<\/div>/g,
  ``
);


fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed stall page successfully');
