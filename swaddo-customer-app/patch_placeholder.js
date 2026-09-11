const fs = require('fs');

const files = [
  'src/app/addresses/page.tsx',
  'src/app/cart/page.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let match = 'placeholder="House / Flat / Block No."';
  let repl = 'placeholder="Full Address"';
  
  if (code.includes(match)) {
    code = code.replaceAll(match, repl);
    fs.writeFileSync(file, code);
    console.log(`Patched placeholder in ${file}`);
  } else {
    console.log(`Placeholder not found in ${file}`);
  }
});
