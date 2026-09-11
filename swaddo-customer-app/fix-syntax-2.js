const fs = require('fs');
let code = fs.readFileSync('src/app/lowest-prices/page.tsx', 'utf8');

// The code looks like this:
// ) : (
//    {item.is_open === false ? (
//       ...
//    ) : (
//       ...
//    )}
// )}

code = code.replace(/\(\s*\{item\.is_open === false/g, '( item.is_open === false');
code = code.replace(/<\/button>\s*\}\s*\)\}/g, '</button>\n)\n)}');

fs.writeFileSync('src/app/lowest-prices/page.tsx', code);
console.log('Fixed syntax error manually');
