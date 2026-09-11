const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regex = /const otherAppPrice = `\$\{Math\.floor\(basePrice \* 1\.4\)\}-\$\{Math\.floor\(basePrice \* 1\.5\)\}`;/;
const replacement = `const otherAppPrice = \`\${originalPrice}-\${originalPrice + 10}\`;`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Patched otherAppPrice');
} else {
  console.log('Regex did not match otherAppPrice');
}
