const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldStr = `<div className="relative w-[210px] h-[130px] -mt-4 mb-1 scale-105 origin-left">
                     <Image 
                       src="/chicken_biryani_offer.png"`;

const newStr = `<div className="relative w-[200px] h-[120px] mt-0 mb-1 origin-left">
                     <Image 
                       src="/chicken_biryani_offer.png"`;

if (code.includes('w-[210px] h-[130px] -mt-4 mb-1 scale-105')) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Fixed banner styling');
} else {
  console.log('Could not find the target string');
}
