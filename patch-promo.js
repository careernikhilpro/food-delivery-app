const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

// 1. Text changes
code = code.replace(
  /<h3 className="font-black text-\[\#FF007F\] text-\[18px\] tracking-tight leading-tight">Cravvers at \?79\*<\/h3>/g,
  `<h3 className="font-black text-[#FF007F] text-[18px] tracking-tight leading-tight">Cravings at &#8377;159*</h3>`
);

code = code.replace(
  /Cravvers at ,179\*/g,
  `Cravings at &#8377;159*`
);

code = code.replace(
  /<p className="text-gray-500 text-\[14px\] font-medium mt-0\.5 tracking-tight">From Subway<\/p>/g,
  `<p className="text-gray-500 text-[14px] font-medium mt-0.5 tracking-tight">From Don't Stop</p>`
);

// 2. Button link
code = code.replace(
  /<button className="flex items-center gap-1\.5 text-\[\#00A14F\] font-black text-\[13px\] mt-2 tracking-wide uppercase">/g,
  `<button onClick={() => router.push('/stall/40')} className="flex items-center gap-1.5 text-[#00A14F] font-black text-[13px] mt-2 tracking-wide uppercase">`
);

// 3. Image and Badge
const oldImgSection = `          {/* Right Image Content */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-[110px] h-[110px] z-10 flex items-center justify-center">
            {/* Using burger as shown in the screenshot */}
            <Image src="/categories/burger.png" alt="Subway Burger" fill className="object-contain scale-110 drop-shadow-md" />
            
            {/* Circular Logo Badge overlapping the image */}
            <div className="absolute right-[-5px] top-[10px] w-[38px] h-[38px] bg-white rounded-full flex items-center justify-center border-[1.5px] border-yellow-100 shadow-sm z-20">
               <span className="text-[8px] font-black text-[#00A14F] leading-[1.1] tracking-tight text-center">SUB<br/>WAY</span>
            </div>
          </div>`;

const newImgSection = `          {/* Right Image Content */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[85px] h-[85px] z-10 flex items-center justify-center">
            <Image src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=500&q=60" alt="Crispy Fried Chicken" fill className="object-cover rounded-full shadow-md" />
            
            {/* Circular Logo Badge overlapping the image */}
            <div className="absolute right-[-15px] top-[-10px] w-[38px] h-[38px] bg-white rounded-full flex items-center justify-center border-[1.5px] border-yellow-100 shadow-sm z-20">
               <span className="text-[7px] font-black text-[#00A14F] leading-[1.1] tracking-tight text-center">Don't<br/>Stop</span>
            </div>
          </div>`;

code = code.replace(oldImgSection, newImgSection);

fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
console.log('Fixed promo card successfully!');
