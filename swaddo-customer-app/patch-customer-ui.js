const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const mapOld = `variants: item.variants,
          discount_percentage: item.discount_percentage,
          is_free_delivery: item.is_free_delivery,
          addons: item.addons
        }));`;
const mapNew = `variants: item.variants,
          discount_percentage: item.discount_percentage,
          is_free_delivery: item.is_free_delivery,
          addons: item.addons,
          is_highlighted_offer: item.is_highlighted_offer,
          offer_price: item.offer_price
        }));`;
code = code.replace(mapOld, mapNew);


const uiAnchor = `<p className="font-extrabold text-[#C2185B] text-[15px] leading-tight">20% LOWER PRICES vs OTHER APPS</p>
              <p className="text-gray-500 text-[12px] mt-0.5">Prices seen only on Swaddo</p>
            </div>
          </div>`;

const highlightedSliderUI = `
          {/* Highlighted Offers Carousel */}
          {(() => {
            const highlightedItems = items.filter(item => item.is_highlighted_offer);
            if (highlightedItems.length === 0) return null;
            
            return (
              <div className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 mb-5 pb-2 pt-1">
                <div className="flex gap-4 min-w-max">
                  {highlightedItems.map((item) => {
                    const priceToDisplay = item.offer_price ? Number(item.offer_price) : (item.discount_percentage ? item.price * (1 - item.discount_percentage/100) : item.price);
                    
                    return (
                      <div key={item.id} className="relative w-[280px] h-[120px] rounded-2xl bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 p-3 shadow-sm overflow-hidden flex justify-between items-center shrink-0">
                        {/* Background Decoration */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-200 opacity-30 rounded-full blur-xl pointer-events-none"></div>
                        
                        <div className="flex flex-col z-10 w-[60%] justify-center h-full">
                          <span className="text-[9px] font-black text-white bg-pink-600 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit uppercase tracking-wider mb-1"><Tag size={10} /> Limited Offer</span>
                          <h3 className="text-[15px] font-black text-gray-900 leading-tight line-clamp-2 mb-1">{item.name}</h3>
                          
                          <div className="flex items-center gap-1.5 mb-2">
                             <span className="text-pink-600 font-black text-[16px]">&#8377;{priceToDisplay}</span>
                             {item.offer_price && <span className="text-gray-400 font-medium text-[12px] line-through">&#8377;{item.price}</span>}
                          </div>
                          
                          <div className="flex items-center">
                            {cart.stallId === stallId && cart.items.find(i => i.id === item.id) ? (
                                <div className="h-7 bg-white rounded-lg flex items-center justify-between shadow-sm border border-pink-200 px-1">
                                  <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateCartLocal({ ...item, price: priceToDisplay }, -1); }}
                                    className="w-6 h-full flex justify-center items-center text-pink-600 font-bold"
                                  ><Minus size={14} /></button>
                                  <span className="text-[12px] font-bold text-pink-700 w-5 text-center">{cart.items.find(i => i.id === item.id)?.quantity}</span>
                                  <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateCartLocal({ ...item, price: priceToDisplay }, 1); }}
                                    className="w-6 h-full flex justify-center items-center text-pink-600 font-bold"
                                  ><Plus size={14} /></button>
                                </div>
                            ) : (
                               <button 
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   if (item.variants?.length > 0) {
                                     setVariantModal({ isOpen: true, stallId: stallId as string, stallName: stallData.name, item });
                                   } else {
                                     handleUpdateCartLocal({ ...item, price: priceToDisplay }, 1);
                                   }
                                 }}
                                 className="bg-white border border-pink-500 text-pink-600 font-black text-[12px] px-5 py-1 rounded-lg shadow-sm hover:bg-pink-50"
                               >
                                 + ADD
                               </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative w-[100px] h-[100px] z-10 shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl shadow-sm border border-pink-100" />
                          ) : (
                            <div className="w-full h-full bg-pink-100 rounded-xl flex items-center justify-center text-pink-300">
                              <Star size={32} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}`;

code = code.replace(uiAnchor, uiAnchor + "\n" + highlightedSliderUI);
fs.writeFileSync('src/app/stall/page.tsx', code);
console.log('Successfully added Highlighted Offers slider to Stall Page');
