const fs = require('fs');
let code = fs.readFileSync('src/app/meals-under-99/page.tsx', 'utf8');

code = code.replace(
  /\{quantity > 0 \? \(/g,
  '{item.is_open === false ? null : quantity > 0 ? ('
);

fs.writeFileSync('src/app/meals-under-99/page.tsx', code);
console.log('Patched meals-under-99 closed buttons');
