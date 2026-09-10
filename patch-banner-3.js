const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

// Fix the Cravings banner route (was /stall/40, needs to be /stall?id=40)
code = code.replace(/router\.push\('\/stall\/40'\)/g, "router.push('/stall?id=40')");

// Hide the old "PRICES THAT SLAY" banner and replace with "Chicken Special Sunday Offer"
const oldBannerContent = `<div className="absolute right-[0%] top-[-10px] w-[65%] h-[200px] bg-[#FCE38A] z-0" style={{ clipPath: 'polygon(40% 0%, 100% 0%, 75% 50%, 85% 100%, 0% 100%, 75% 50%)' }}></div>
                 <div className="relative z-10 flex flex-col max-w-[55%] pl-6 mb-0 justify-center h-full">
                   <div className="relative w-[170px] h-[120px] mt-0">
                     <Image 
                       src="/prices.png" 
                       alt="Prices That Slay Everyday" 
                       fill 
                       className="object-contain object-left"
                       priority
                       unoptimized
                     />
                   </div>
                   <Link href="/lowest-prices">
                      <button className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform">
                        ORDER NOW
                      </button>
                   </Link>
                 </div>`;

const newBannerContent = `{/* HIDDEN OLD BANNER
${oldBannerContent}
*/}
                 <div className="absolute right-[0%] top-[-10px] w-[65%] h-[200px] bg-[#FCE38A] z-0" style={{ clipPath: 'polygon(40% 0%, 100% 0%, 75% 50%, 85% 100%, 0% 100%, 75% 50%)' }}></div>
                 <div className="relative z-10 flex flex-col max-w-[60%] pl-5 mb-0 justify-center h-full">
                   <div className="flex flex-col mt-2 mb-2">
                     <h3 className="font-black text-[#FF007F] text-[22px] uppercase leading-tight drop-shadow-sm" style={{ WebkitTextStroke: '0.5px white' }}>Chicken Special</h3>
                     <h4 className="font-black text-white text-[18px] uppercase leading-tight drop-shadow-md">Sunday offer</h4>
                     <p className="font-black text-yellow-300 text-[12px] mt-1 bg-black/20 w-fit px-2 py-0.5 rounded-md backdrop-blur-sm">50rs off + Free delivery</p>
                   </div>
                   <button onClick={() => router.push('/stall?id=40')} className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform shadow-md">
                     ORDER NOW
                   </button>
                 </div>`;

if (code.includes('alt="Prices That Slay Everyday"')) {
  code = code.replace(oldBannerContent, newBannerContent);
  fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
  console.log('Fixed banner routes and replaced top banner');
} else {
  console.log('Could not find old banner content');
}
