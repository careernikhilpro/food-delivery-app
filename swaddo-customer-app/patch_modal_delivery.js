const fs = require('fs');

const filesToPatch = [
  'src/app/page.tsx',
  'src/app/stall/page.tsx',
  'src/app/meals-under-99/page.tsx'
];

const regex = /price: getVariantPrice\(selectedVariant\.price\),/g;
const replacement = `price: getVariantPrice(selectedVariant.price),
      is_free_delivery: item.is_free_delivery,
      free_delivery_min_amount: item.free_delivery_min_amount,
      free_delivery_max_km: item.free_delivery_max_km,`;

filesToPatch.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
    console.log(\`Successfully patched VariantModalComponent free delivery fields in \${file}\`);
  } else {
    console.log(\`Regex failed for \${file}\`);
  }
});
