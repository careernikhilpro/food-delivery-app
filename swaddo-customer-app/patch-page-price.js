const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /\{categoryItems\.slice\(0, 12\)\.map\(\(item\) => \{[\s\S]*?Math\.round\(parseFloat\(\(item\.price \|\| "0"\)\.toString\(\)\.replace\(\/\[\^0-9\.\]\/g, ''\)\) \|\| 0\);/;

const replacementStr = `{categoryItems.slice(0, 12).map((item) => {
                const basePrice = Math.round(parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, '')) || 0);
                let parsedPrice = basePrice;
                if (item.offer_price) {
                  parsedPrice = Number(item.offer_price);
                } else if (item.discount_percentage) {
                  parsedPrice = Math.round(basePrice * (1 - Number(item.discount_percentage)/100));
                }
                const hasOffer = parsedPrice < basePrice;`;

if (code.match(regex)) {
  code = code.replace(regex, replacementStr);
  
  // also replace the rendering part inside categoryItems
  const renderRegex = /<span className="text-\[10px\] text-gray-400 line-through leading-none mb-0\.5">.*?<\/span>\s*<span className="font-black text-\[13px\] text-gray-900 leading-none">.*?<\/span>/;
  const renderReplacement = `{hasOffer ? (
                            <>
                              <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">&#8377;{basePrice}</span>
                              <span className="font-black text-[13px] text-[#FF007F] leading-none">&#8377;{parsedPrice}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">&#8377;{Math.round(basePrice * 1.3)}</span>
                              <span className="font-black text-[13px] text-gray-900 leading-none">&#8377;{parsedPrice}</span>
                            </>
                          )}`;
  if (code.match(renderRegex)) {
     code = code.replace(renderRegex, renderReplacement);
     fs.writeFileSync('src/app/page.tsx', code);
     console.log('Successfully patched page.tsx logic and render!');
  } else {
     console.log('Failed to match rendering part');
  }
} else {
  console.log('Failed to match parsedPrice part');
}
