const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const regex = /\{hasOffer \? \([\s\S]*?\) : \([\s\S]*?\) \? merchantPrice : Math\.floor\(merchantPrice \* 1\.3\);\s*const otherAppPrice = `\$\{Math\.floor\(merchantPrice \* 1\.2\)\}-\$\{Math\.floor\(merchantPrice \* 1\.2\) \+ 10\}`;/

// Let's do a simpler regex matching the UI block specifically
const uiRegex = /<span className="bg-pink-100 text-\[\#C2185B\] text-\[11px\] font-black px-1\.5 py-0\.5 rounded">,1\{basePrice\}<\/span>/g;
// Wait, &#8377; is used in the source code.
const uiRegex2 = /<span className="bg-pink-100 text-\[\#C2185B\] text-\[11px\] font-black px-1\.5 py-0\.5 rounded">&#8377;\{basePrice\}<\/span>/g;

const replacement = `<span className="text-gray-900 text-[13px] font-black leading-none">&#8377;{basePrice}</span>`;

if (code.match(uiRegex2)) {
  code = code.replace(uiRegex2, replacement);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Patched stall non-offer color');
} else {
  console.log('Regex did not match stall non-offer color');
}
