const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// Remove X from react import
code = code.replace(/import \{ X, /g, 'import { ');

// Add X to lucide-react import
code = code.replace(/import \{ ArrowLeft, Share2, /g, 'import { X, ArrowLeft, Share2, ');

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed X import correctly');
