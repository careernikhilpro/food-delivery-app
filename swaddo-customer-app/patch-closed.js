const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// The original condition for showing minus/plus cart buttons
// I will patch it to also check item.is_open !== false.
const oldButtonSection = `{item.has_variants && quantity > 0 && (
                            <div className="absolute -top-1 -right-1 bg-[#FF007F] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {quantity}
                            </div>
                          )}
                        </button>
                      )}
                    </div>`;

// Wait, the easier way is to just wrap the whole button logic in a check for item.is_open.
// Let's use regex to find where quantity > 0 is checked in categoryItems.
// Actually, `item.is_open === false ? 'grayscale opacity-80 pointer-events-none' : ''` is already on the card container, which effectively disables clicks!
// If pointer-events-none is on the container, they can't click it anyway. 
// BUT visually, they don't want to see the + button. So let's hide it if item.is_open === false.

code = code.replace(
  /\{quantity > 0 \? \(/g,
  '{item.is_open === false ? null : quantity > 0 ? ('
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched page.tsx closed buttons');
