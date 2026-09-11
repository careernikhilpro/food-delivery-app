const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regexModal = /const handleAdd = \(\) => \{\s*updateQuantity\(stallId, stallName, \{ \s*id: variantId, \s*name: `\$\{item\.name\} \(\$\{selectedVariant\.name\}\)`, \s*price: Number\(selectedVariant\.price\),/g;

const replacementModal = `const getVariantPrice = (vPrice: any) => {
    let baseItemPrice = Number(item.price || vPrice);
    if (!baseItemPrice || baseItemPrice <= 0) return Number(vPrice);
    
    let effectiveDiscount = 0;
    if (item.offer_price) {
      effectiveDiscount = 1 - (Number(item.offer_price) / baseItemPrice);
    } else if (item.discount_percentage) {
      effectiveDiscount = Number(item.discount_percentage) / 100;
    }
    
    return Math.round(Number(vPrice) * (1 - effectiveDiscount));
  };

  const handleAdd = () => {
    updateQuantity(stallId, stallName, { 
      id: variantId, 
      name: \`\${item.name} (\${selectedVariant.name})\`, 
      price: getVariantPrice(selectedVariant.price),`;

if (code.match(regexModal)) {
  code = code.replace(regexModal, replacementModal);
  
  // also replace {v.price} in the UI
  code = code.replace(/<span className="font-medium text-\[14px\] text-gray-600">\u20B9\{v\.price\}<\/span>/g, 
  `<span className="font-medium text-[14px] text-gray-600">\u20B9{getVariantPrice(v.price)}</span>`);
  
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Successfully patched VariantModalComponent in stall/page.tsx');
} else {
  console.log('Regex failed for VariantModalComponent in stall/page.tsx');
}
