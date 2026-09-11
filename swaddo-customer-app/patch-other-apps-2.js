const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regex = /const otherAppPrice = `\$\{originalPrice\}-\$\{originalPrice \+ 10\}`;/;
const replacement = `const otherAppPrice = \`\${Math.floor(merchantPrice * 1.2)}-\${Math.floor(merchantPrice * 1.2) + 10}\`;`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Fixed other app price to 310-320');
}
