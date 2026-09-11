const fs = require('fs');
let code = fs.readFileSync('src/app/meals-under-99/page.tsx', 'utf8');

const regex = /<span className="text-\[11px\] text-gray-400 line-through">.*?\{originalPrice\}<\/span>\s*<span className="text-\[13px\] font-bold text-\[\#FF007F\]">.*?\{parsedPrice\}<\/span>/;

const replacement = `{parsedPrice < merchantPrice ? (
                        <>
                          <span className="text-[11px] text-gray-400 line-through">&#8377;{merchantPrice}</span>
                          <span className="text-[13px] font-bold text-[#FF007F]">&#8377;{parsedPrice}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-gray-400 line-through">&#8377;{Math.round(merchantPrice * 1.3)}</span>
                          <span className="text-[13px] font-bold text-gray-900">&#8377;{parsedPrice}</span>
                        </>
                      )}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/meals-under-99/page.tsx', code);
  console.log('Patched meals-under-99 colors');
} else {
  console.log('Regex did not match for meals-under-99 colors');
}
