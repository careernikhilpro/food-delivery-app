const fs = require('fs');

const filesToPatch = [
  'src/app/page.tsx',
  'src/app/stall/page.tsx',
  'src/app/meals-under-99/page.tsx'
];

const regex = /price: getVariantPrice\\(selectedVariant\\.price\\),/g;
const replacement = `price: getVariantPrice(selectedVariant.price),
      is_free_delivery: item.is_free_delivery,
      free_delivery_min_amount: item.free_delivery_min_amount,
      free_delivery_max_km: item.free_delivery_max_km,`;

filesToPatch.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let matchStr = "price: getVariantPrice(selectedVariant.price),";
  if (code.includes(matchStr)) {
    code = code.replace(matchStr, replacement);
    fs.writeFileSync(file, code);
    console.log('Successfully patched VariantModalComponent free delivery fields in ' + file);
  } else {
    console.log('Regex failed for ' + file);
  }
});
