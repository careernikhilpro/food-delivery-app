const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

// 1. Add to initial state
const stateOld = `const [formData, setFormData] = useState({
    name: "",
    category: "Main Course",
    price: "",
    variants: [{ name: "", price: "" }] as {name: string, price: string}[],
    prep_time_minutes: "",
    discount_percentage: "",
    is_veg: true,
    is_available: true,
    addons: [{ name: "", price: "" }] as {name: string, price: string}[]
  });`;
  
const stateNew = `const [formData, setFormData] = useState({
    name: "",
    category: "Main Course",
    price: "",
    variants: [{ name: "", price: "" }] as {name: string, price: string}[],
    prep_time_minutes: "",
    discount_percentage: "",
    is_veg: true,
    is_available: true,
    addons: [{ name: "", price: "" }] as {name: string, price: string}[],
    is_highlighted_offer: false,
    offer_price: ""
  });`;
code = code.replace(stateOld, stateNew);

// 2. Add to resetForm
const resetOld = `setFormData({ 
      name: "", category: "Main Course", price: "", 
      variants: [{ name: "", price: "" }], prep_time_minutes: "", 
      discount_percentage: "", is_veg: true, is_available: true, addons: [{ name: "", price: "" }]
    });`;
const resetNew = `setFormData({ 
      name: "", category: "Main Course", price: "", 
      variants: [{ name: "", price: "" }], prep_time_minutes: "", 
      discount_percentage: "", is_veg: true, is_available: true, addons: [{ name: "", price: "" }],
      is_highlighted_offer: false, offer_price: ""
    });`;
code = code.replace(resetOld, resetNew);

// 3. Add to cleanData (payload to backend)
const cleanOld = `discount_percentage: hasDiscount && formData.discount_percentage ? Number(formData.discount_percentage) : 0,`;
const cleanNew = `discount_percentage: hasDiscount && formData.discount_percentage ? Number(formData.discount_percentage) : 0,
        is_highlighted_offer: formData.is_highlighted_offer,
        offer_price: formData.offer_price ? Number(formData.offer_price) : null,`;
code = code.replace(cleanOld, cleanNew);

// 4. Add to setFormData when editing existing item
const editOld = `discount_percentage: item.discount_percentage || "",
                                            is_veg: item.is_veg,
                                            is_available: item.is_available,
                                            addons: itemAddons.length > 0 ? itemAddons : [{name: "", price: ""}]
                                          });`;
const editNew = `discount_percentage: item.discount_percentage || "",
                                            is_veg: item.is_veg,
                                            is_available: item.is_available,
                                            addons: itemAddons.length > 0 ? itemAddons : [{name: "", price: ""}],
                                            is_highlighted_offer: item.is_highlighted_offer || false,
                                            offer_price: item.offer_price || ""
                                          });`;
code = code.replace(editOld, editNew);

// 5. Add UI Inputs
const uiAnchor = `<div className="mt-4 p-4 rounded-xl bg-gray-50 border border-border-subtle">
                                              <label className="block text-xs font-bold text-text-muted uppercase mb-3">Customization</label>`;
                                              
const uiNew = `<div className="mt-4 p-4 rounded-xl bg-pink-50 border border-pink-100">
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
                                                <div className="mb-3">
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
                                            </div>

                                            ` + uiAnchor;

code = code.replace(uiAnchor, uiNew);

fs.writeFileSync('src/app/vendors/page.tsx', code);
console.log('Successfully updated Admin Panel for Offer features');
