const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

const regex = /<div className="flex flex-col mt-2 mb-2">\s*<h3 className="font-black text-\[\#FF0000\] text-\[26px\] uppercase leading-none tracking-tighter drop-shadow-md" style={{ WebkitTextStroke: '1\.5px white', textShadow: '2px 2px 0px rgba\(0,0,0,0\.2\)' }}>CHICKEN SPECIAL<\/h3>\s*<h4 className="font-black text-white text-\[18px\] uppercase leading-tight drop-shadow-md">Sunday offer<\/h4>\s*<p className="font-black text-yellow-300 text-\[12px\] mt-1 bg-black\/20 w-fit px-2 py-0\.5 rounded-md backdrop-blur-sm">50rs off \+ Free delivery<\/p>\s*<\/div>/g;

const newContent = `<div className="relative w-[190px] h-[110px] mt-0 mb-1">
                     <Image 
                       src="/chicken_special.png" 
                       alt="Chicken Special Sunday Offer" 
                       fill 
                       className="object-contain object-left"
                       priority
                       unoptimized
                     />
                   </div>`;

if (regex.test(code)) {
  code = code.replace(regex, newContent);
  fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
  console.log('Successfully replaced HTML text with Image placeholder!');
} else {
  console.log('Regex did not match.');
}
