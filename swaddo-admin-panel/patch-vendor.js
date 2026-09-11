const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

// 1. Initial State
code = code.replace(
  /is_highlighted_offer: false,\s*offer_price: ""/g,
  `is_highlighted_offer: false,
      offer_price: "",
      is_free_delivery: false,
      free_delivery_min_amount: "",
      free_delivery_max_km: ""`
);

// 2. Loading State in handleSaveItem
// Wait, when loading editingItem:
code = code.replace(
  /is_highlighted_offer: item\.is_highlighted_offer \|\| false,\s*offer_price: item\.offer_price \|\| ""/g,
  `is_highlighted_offer: item.is_highlighted_offer || false,
                                            offer_price: item.offer_price || "",
                                            is_free_delivery: item.is_free_delivery || false,
                                            free_delivery_min_amount: item.free_delivery_min_amount || "",
                                            free_delivery_max_km: item.free_delivery_max_km || ""`
);

// 3. Payload
code = code.replace(
  /offer_price: formData\.offer_price \? Number\(formData\.offer_price\) : null,/g,
  `offer_price: formData.offer_price ? Number(formData.offer_price) : null,
          is_free_delivery: formData.is_free_delivery,
          free_delivery_min_amount: formData.free_delivery_min_amount ? Number(formData.free_delivery_min_amount) : 0,
          free_delivery_max_km: formData.free_delivery_max_km ? Number(formData.free_delivery_max_km) : null,`
);

// 4. UI addition
const uiAddition = `
                            {/* Free Delivery Options */}
                            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1.5">
                                  Enable Free Delivery <span className="text-[10px] lowercase text-blue-500 font-medium tracking-wide">(Set rules)</span>
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={formData.is_free_delivery}
                                    onChange={(e) => setFormData({...formData, is_free_delivery: e.target.checked})}
                                  />
                                  <div className="w-9 h-5 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                              </div>
                              
                              {formData.is_free_delivery && (
                                <div className="grid grid-cols-2 gap-3 mb-1">
                                  <div>
                                    <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1">Min Order Amt (₹)</label>
                                    <input 
                                      type="number"
                                      value={formData.free_delivery_min_amount}
                                      onChange={(e) => setFormData({...formData, free_delivery_min_amount: e.target.value})}
                                      className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:border-blue-500 text-sm font-medium text-blue-700"
                                      placeholder="0 for all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1">Max Distance (km)</label>
                                    <input 
                                      type="number"
                                      value={formData.free_delivery_max_km}
                                      onChange={(e) => setFormData({...formData, free_delivery_max_km: e.target.value})}
                                      className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:border-blue-500 text-sm font-medium text-blue-700"
                                      placeholder="Blank for any"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border border-border-subtle rounded-2xl overflow-hidden bg-bg-main">
`;

code = code.replace(
  /                            <div className="border border-border-subtle rounded-2xl overflow-hidden bg-bg-main">/g,
  uiAddition
);

fs.writeFileSync('src/app/vendors/page.tsx', code);
console.log('Patched vendors page');
