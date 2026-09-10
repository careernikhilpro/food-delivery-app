const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/lowest-prices/page.tsx', 'utf8');

const anchor = `{/* Categories Horizontal Slider */}`;
const newSection = `
      {/* Chicken Biryani Hero Highlight */}
      <div className="px-4 mt-4 mb-2">
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-4 shadow-sm overflow-hidden flex justify-between items-center">
          {/* Sparkles / background decoration */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-300 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col z-10 w-[60%]">
            <span className="text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider shadow-sm mb-1">Top Offer</span>
            <h3 className="text-[18px] font-black text-gray-900 leading-tight">Chicken Biryani</h3>
            <p className="text-gray-500 text-[11px] font-medium mt-0.5 mb-1.5">Don't Stop Crispy Chicken Stall</p>
            
            <div className="flex items-center gap-2 mb-3">
               <span className="text-red-500 font-black text-[18px]">&#8377;99</span>
               <span className="text-gray-400 font-medium text-[13px] line-through">&#8377;199</span>
            </div>
            
            <div className="flex items-center">
              {cart.stallId === "40" && cart.items.find(i => i.id === "1021") ? (
                  <div className="h-8 bg-white rounded-lg flex items-center justify-between shadow-sm border border-red-200 px-1">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, -1); }}
                      className="w-6 h-full flex justify-center items-center text-red-600 font-bold"
                    ><Minus size={16} /></button>
                    <span className="text-[13px] font-bold text-red-700 w-6 text-center">{cart.items.find(i => i.id === "1021")?.quantity}</span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, 1); }}
                      className="w-6 h-full flex justify-center items-center text-red-600 font-bold"
                    ><Plus size={16} /></button>
                  </div>
              ) : (
                 <button 
                   onClick={() => updateQuantity("40", "Don't Stop Crispy Chicken Stall", { id: "1021", name: "Chicken Biryani", price: 99, markup: 0, isVeg: false }, 1)}
                   className="bg-white border border-red-500 text-red-600 font-black text-[13px] px-6 py-1.5 rounded-lg shadow-sm hover:bg-red-50"
                 >
                   + ADD
                 </button>
              )}
            </div>
          </div>
          
          <div className="relative w-[110px] h-[110px] z-10 mr-[-10px]">
            <Image src="/categories/biryani.png" alt="Chicken Biryani" fill className="object-contain drop-shadow-md scale-125" />
          </div>
        </div>
      </div>

      `;

if (code.includes(anchor) && !code.includes('Chicken Biryani Hero Highlight')) {
  code = code.replace(anchor, newSection + anchor);
  fs.writeFileSync('swaddo-customer-app/src/app/lowest-prices/page.tsx', code);
  console.log('Successfully injected hero banner in lowest-prices page');
} else {
  console.log('Anchor not found or already injected');
}
