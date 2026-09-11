const fs = require('fs');
let code = fs.readFileSync('src/app/lowest-prices/page.tsx', 'utf8');

// Replace + ADD button for closed stores in both highlighted offers and all dishes
const regexAddButton = /<button \s*onClick=\{\(\) => updateQuantity\(stallIdStr, item\.stall_name, \{ id: itemIdStr, name: item\.name, price: finalPrice, markup: 0, isVeg: item\.is_veg \}, 1\)\}\s*className="bg-white border border-red-500 text-red-600 font-black text-\[13px\] px-6 py-1\.5 rounded-lg shadow-sm hover:bg-red-50"\s*>\s*\+ ADD\s*<\/button>/g;

const replacementAddButton = `{item.is_open === false ? (
                            <div className="bg-gray-100 text-gray-500 text-[11px] font-black px-4 py-1.5 rounded-lg border border-gray-200">CLOSED</div>
                          ) : (
                            <button 
                              onClick={() => updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1)}
                              className="bg-white border border-red-500 text-red-600 font-black text-[13px] px-6 py-1.5 rounded-lg shadow-sm hover:bg-red-50"
                            >
                              + ADD
                            </button>
                          )}`;

code = code.replace(regexAddButton, replacementAddButton);

const regexPlusIcon = /<button \s*onClick=\{\(e\) => \{ e\.preventDefault\(\); e\.stopPropagation\(\); updateQuantity\(stallIdStr, item\.stall_name, \{ id: itemIdStr, name: item\.name, price: finalPrice, markup: 0, isVeg: item\.is_veg \}, 1\); \}\}\s*className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:bg-gray-50"\s*>\s*<Plus size=\{16\} className="text-\[\#FF007F\]" \/>\s*<\/button>/g;

const replacementPlusIcon = `{item.is_open === false ? (
                          <div className="absolute bottom-2 right-2 bg-gray-100 rounded px-1.5 py-0.5 shadow-sm border border-gray-200">
                            <span className="text-gray-500 font-black text-[8px]">CLOSED</span>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(stallIdStr, item.stall_name, { id: itemIdStr, name: item.name, price: finalPrice, markup: 0, isVeg: item.is_veg }, 1); }}
                            className="absolute bottom-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 active:bg-gray-50"
                          >
                            <Plus size={16} className="text-[#FF007F]" />
                          </button>
                        )}`;

code = code.replace(regexPlusIcon, replacementPlusIcon);

fs.writeFileSync('src/app/lowest-prices/page.tsx', code);
console.log('Patched lowest-prices CLOSED buttons');
