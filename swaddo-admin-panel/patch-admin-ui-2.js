const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

const anchor = `Currently Available
                              </label>
                            </div>`;

const newUI = `Currently Available
                              </label>
                            </div>
                            
                            <div className="mt-4 p-4 rounded-xl bg-pink-50 border border-pink-100">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-pink-700 uppercase flex items-center gap-1.5">
                                  Highlight as Top Offer <span className="text-[10px] lowercase text-pink-500 font-medium tracking-wide">(Show on store banner)</span>
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={formData.is_highlighted_offer}
                                    onChange={(e) => setFormData({...formData, is_highlighted_offer: e.target.checked})}
                                  />
                                  <div className="w-9 h-5 bg-pink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                                </label>
                              </div>
                              
                              {formData.is_highlighted_offer && (
                                <div className="mb-1">
                                  <label className="block text-[11px] font-bold text-pink-700 uppercase mb-1">Offer Price (₹)</label>
                                  <input 
                                    type="number"
                                    value={formData.offer_price}
                                    onChange={(e) => setFormData({...formData, offer_price: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:border-pink-500 text-sm font-medium text-pink-700"
                                    placeholder="e.g. 99"
                                  />
                                  <p className="text-[10px] text-pink-600 mt-1">This will show in bright pink with the original price crossed out.</p>
                                </div>
                              )}
                            </div>`;

if (code.includes('Currently Available\n                              </label>\n                            </div>')) {
  code = code.replace(anchor, newUI);
  fs.writeFileSync('src/app/vendors/page.tsx', code);
  console.log('Successfully injected UI');
} else {
  console.log('Could not find anchor');
}
