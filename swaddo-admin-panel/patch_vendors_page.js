const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

// 1. Initial State
const initMatch = "is_free_delivery: false,\n        free_delivery_min_amount: \"\",\n        free_delivery_max_km: \"\"";
const initRepl = "is_free_delivery: false,\n        free_delivery_min_amount: \"\",\n        free_delivery_max_km: \"\",\n        coupon_applicable: true";
if (code.includes(initMatch)) { code = code.replace(initMatch, initRepl); }

const initMatch2 = "is_free_delivery: false,\n        free_delivery_min_amount: \"\",\n        free_delivery_max_km: \"\"\n      });";
const initRepl2 = "is_free_delivery: false,\n        free_delivery_min_amount: \"\",\n        free_delivery_max_km: \"\",\n        coupon_applicable: true\n      });";
if (code.includes(initMatch2)) { code = code.replace(initMatch2, initRepl2); }

// 2. Edit Item Populating
const editMatch = "is_free_delivery: item.is_free_delivery || false,\n                                              free_delivery_min_amount: item.free_delivery_min_amount || \"\",\n                                              free_delivery_max_km: item.free_delivery_max_km || \"\"";
const editRepl = "is_free_delivery: item.is_free_delivery || false,\n                                              free_delivery_min_amount: item.free_delivery_min_amount || \"\",\n                                              free_delivery_max_km: item.free_delivery_max_km || \"\",\n                                              coupon_applicable: item.coupon_applicable ?? true";
if (code.includes(editMatch)) { code = code.replace(editMatch, editRepl); }

// 3. Payload
const payloadMatch = "is_free_delivery: formData.is_free_delivery,\n            free_delivery_min_amount: formData.free_delivery_min_amount ? Number(formData.free_delivery_min_amount) : 0,\n            free_delivery_max_km: formData.free_delivery_max_km ? Number(formData.free_delivery_max_km) : null,";
const payloadRepl = "is_free_delivery: formData.is_free_delivery,\n            free_delivery_min_amount: formData.free_delivery_min_amount ? Number(formData.free_delivery_min_amount) : 0,\n            free_delivery_max_km: formData.free_delivery_max_km ? Number(formData.free_delivery_max_km) : null,\n            coupon_applicable: formData.coupon_applicable,";
if (code.includes(payloadMatch)) { code = code.replace(payloadMatch, payloadRepl); }

// 4. UI Checkbox
const uiMatch = `<div className="flex items-center gap-2">\n                                      <div \n                                        onClick={() => setFormData({...formData, is_free_delivery: !formData.is_free_delivery})}`;
const uiRepl = `<div className="flex items-center gap-2 mb-4">\n                                      <div \n                                        onClick={() => setFormData({...formData, coupon_applicable: !formData.coupon_applicable})}\n                                        className={\`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors \${formData.coupon_applicable ? 'bg-blue-600' : 'bg-gray-300'}\`}\n                                      >\n                                        <div className={\`w-4 h-4 bg-white rounded-full transition-transform \${formData.coupon_applicable ? 'translate-x-6' : 'translate-x-0'}\`} />\n                                      </div>\n                                      <span className="text-[13px] font-bold text-gray-700">Coupon Applicable</span>\n                                    </div>\n                                    <div className="flex items-center gap-2">\n                                      <div \n                                        onClick={() => setFormData({...formData, is_free_delivery: !formData.is_free_delivery})}`;
if (code.includes(uiMatch)) { code = code.replace(uiMatch, uiRepl); }

fs.writeFileSync('src/app/vendors/page.tsx', code);
console.log('Patched admin vendors page.tsx for coupon_applicable');
