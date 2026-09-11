const fs = require('fs');
let code = fs.readFileSync('src/app/category/[name]/ClientCategoryPage.tsx', 'utf8');

const oldCalc = `const parsedPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
            const originalPrice = Math.round(parsedPrice * 1.2);`;

const newCalc = `const merchantPrice = typeof item.price === 'number' ? item.price : parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ''));
            let parsedPrice = merchantPrice;
            const originalPrice = merchantPrice;
            if (item.offer_price) {
              parsedPrice = Number(item.offer_price);
            } else if (item.discount_percentage) {
              parsedPrice = Math.round(merchantPrice * (1 - Number(item.discount_percentage)/100));
            }
            const hasOffer = parsedPrice < merchantPrice;`;

if (code.includes(oldCalc)) {
  code = code.replace(oldCalc, newCalc);
  console.log('Patched ClientCategoryPage calc');
} else {
  console.log('Could not find ClientCategoryPage calc block');
}

const oldUI = `<span className="text-[11px] text-gray-400 line-through leading-none mb-1">&#8377;{Math.round(parsedPrice * 1.3)}</span>
                        <span className="font-black text-[15px] text-gray-900 leading-none">&#8377;{parsedPrice}</span>`;

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

if (code.includes(oldUI)) {
  code = code.replace(oldUI, newUI);
  console.log('Patched ClientCategoryPage UI');
} else {
  console.log('Could not find ClientCategoryPage UI block');
}

// also check if closed items show plus icon
code = code.replace(
  /\{quantity > 0 \? \(/g,
  '{item.is_open === false ? null : quantity > 0 ? ('
);

fs.writeFileSync('src/app/category/[name]/ClientCategoryPage.tsx', code);
