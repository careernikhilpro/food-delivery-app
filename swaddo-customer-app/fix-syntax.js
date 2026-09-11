const fs = require('fs');
let code = fs.readFileSync('src/app/lowest-prices/page.tsx', 'utf8');

const regex1 = /\{\s*item\.is_open === false \? \(/g;
const replacement1 = `item.is_open === false ? (`;

const regex2 = /\s*\)\}\s*\)\}/g;
const replacement2 = `))}`;

// Wait, doing this generally might break something else. 
// Let's replace the EXACT occurrences.
code = code.replace(/\( \s*\{\s*item\.is_open/g, '( item.is_open');
// Also the closing bracket.
code = code.replace(/<\/button>\s*\}\s*\)\}/g, '</button>\n) )}');

fs.writeFileSync('src/app/lowest-prices/page.tsx', code);
console.log('Fixed syntax error');
