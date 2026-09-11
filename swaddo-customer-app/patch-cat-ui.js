const fs = require('fs');
let code = fs.readFileSync('src/app/category/[name]/ClientCategoryPage.tsx', 'utf8');

const regex = /<span className="text-\[11px\] text-gray-400 line-through leading-none mb-1">.*?<\/span>\s*<span className="font-black text-\[15px\] text-gray-900 leading-none">.*?<\/span>/;

const newUI = `{hasOffer ? (
                          <>
                            <span className="text-[11px] text-gray-400 line-through leading-none mb-1">&#8377;{originalPrice}</span>
                            <span className="font-black text-[15px] text-[#FF007F] leading-none">&#8377;{parsedPrice}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-gray-400 line-through leading-none mb-1">&#8377;{Math.round(merchantPrice * 1.3)}</span>
                            <span className="font-black text-[15px] text-gray-900 leading-none">&#8377;{parsedPrice}</span>
                          </>
                        )}`;

if (code.match(regex)) {
  code = code.replace(regex, newUI);
  console.log('Patched ClientCategoryPage UI with regex');
} else {
  console.log('Could not find ClientCategoryPage UI block');
}

fs.writeFileSync('src/app/category/[name]/ClientCategoryPage.tsx', code);
