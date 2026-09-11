const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

// I will just replace the specific line
const regex = /\/\/ Calculate 20% markup on original merchant price as the display original price\s*const originalPrice = Math\.floor\(merchantPrice \* 1\.2\);/;
const replacement = `// Use exact merchant price for strikethrough when there is an offer
      const originalPrice = hasOffer ? merchantPrice : Math.floor(merchantPrice * 1.3);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Patched originalPrice back to merchant price');
} else {
  console.log('Regex did not match originalPrice');
}
