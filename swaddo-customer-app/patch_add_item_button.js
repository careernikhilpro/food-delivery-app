const fs = require('fs');

const filesToPatch = [
  'src/app/page.tsx',
  'src/app/stall/page.tsx',
  'src/app/meals-under-99/page.tsx'
];

filesToPatch.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let matchStr = "Add Item | &#8377;{(selectedVariant?.price || 0) * modalQty}";
  let replStr = "Add Item | &#8377;{getVariantPrice(selectedVariant?.price || 0) * modalQty}";
  
  if (code.includes(matchStr)) {
    code = code.replace(matchStr, replStr);
    fs.writeFileSync(file, code);
    console.log('Successfully patched Add Item button in ' + file);
  } else {
    console.log('Regex failed for ' + file);
  }
});
