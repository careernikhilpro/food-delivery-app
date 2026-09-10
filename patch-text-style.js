const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

const oldStr = `<h3 className="font-black text-[#FF007F] text-[22px] uppercase leading-tight drop-shadow-sm" style={{ WebkitTextStroke: '0.5px white' }}>Chicken Special</h3>`;
const newStr = `<h3 className="font-black text-[#FF0000] text-[26px] uppercase leading-none tracking-tighter drop-shadow-md" style={{ WebkitTextStroke: '1.5px white', textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>CHICKEN SPECIAL</h3>`;

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
  console.log('Fixed text style successfully');
} else {
  console.log('String not found. Let me try regex.');
  
  const regex = /<h3[^>]*>Chicken Special<\/h3>/;
  if (regex.test(code)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
    console.log('Fixed text style via regex');
  } else {
    console.log('Regex also failed');
  }
}
