const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regexUpdateCartLocal = /const handleUpdateCartLocal = \(\s*item: any,\s*delta: number\s*\) => \{\s*updateQuantity\([^;]+\);\s*\};/;

const replacementUpdateCartLocal = `const handleUpdateCartLocal = (item: any, delta: number) => {
    let finalPrice = Number(item.price);
    let markup = itemMarkup;
    if (item.offer_price) {
      finalPrice = Number(item.offer_price);
      markup = 0;
    } else if (item.discount_percentage) {
      finalPrice = Math.floor(finalPrice * (1 - Number(item.discount_percentage)/100));
      markup = 0;
    }
    updateQuantity(stallId as string, stallData.name, { 
      id: item.id.toString(), 
      name: item.name, 
      price: finalPrice, 
      markup: markup, 
      isVeg: item.isVeg ?? true 
    }, delta);
  };`;

if (code.match(regexUpdateCartLocal)) {
  code = code.replace(regexUpdateCartLocal, replacementUpdateCartLocal);
  console.log('Successfully patched handleUpdateCartLocal');
} else {
  console.log('Regex failed for handleUpdateCartLocal');
}

fs.writeFileSync('src/app/stall/page.tsx', code);
