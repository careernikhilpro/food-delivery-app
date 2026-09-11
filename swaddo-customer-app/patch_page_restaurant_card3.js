const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /<div className="flex items-center gap-1\.5">\s*<span className="text-\[12px\] font-medium text-gray-400 line-through">\{item\.originalPrice\}<\/span>\s*<span className="text-\[11px\] font-black text-\[#FF007F\] bg-\[#FFF0F5\] px-1\.5 py-0\.5 rounded-md">\{item\.newPrice\}<\/span>\s*<\/div>/g;

const replacement = `<div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-gray-400 line-through">{item.originalPrice}</span>
                            {item.hasOffer ? (
                              <span className="text-[11px] font-black text-[#FF007F] bg-[#FFF0F5] px-1.5 py-0.5 rounded-md">{item.newPrice}</span>
                            ) : (
                              <span className="text-[13px] font-bold text-gray-800">{item.newPrice}</span>
                            )}
                         </div>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Successfully patched UI colors in RestaurantCard in page.tsx');
} else {
  console.log('Regex failed for UI colors in RestaurantCard');
}
