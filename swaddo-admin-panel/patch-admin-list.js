const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

// The original map start
const mapAnchor = `{stall.menu_items.map((item: any) => {`;

// The sorted items map
const mapNew = `{(() => {
                                    const sortedItems = [...stall.menu_items].sort((a, b) => {
                                      if (a.is_highlighted_offer && !b.is_highlighted_offer) return -1;
                                      if (!a.is_highlighted_offer && b.is_highlighted_offer) return 1;
                                      return 0;
                                    });
                                    return sortedItems.map((item: any) => {`;

code = code.replace(mapAnchor, mapNew);

// Wait, the end of the map:
// `})}` -> `})})()}`
// It's safer to just replace `})}` near the end of the `<ul>`.
const mapEndOld = `})}`;
const mapEndNew = `})})()}`;
// There might be multiple `})}` so we should target it more specifically.
// Actually, I can use regex to replace the ul block entirely.
const ulRegex = /<ul className="divide-y divide-border-subtle">[\s\S]*?<\/ul>/;

const oldUlMatch = code.match(ulRegex);
if (oldUlMatch) {
  let ulStr = oldUlMatch[0];
  
  // Sort items
  ulStr = ulStr.replace(`{stall.menu_items.map((item: any) => {`, `{(() => {
                                    const sortedItems = [...stall.menu_items].sort((a, b) => {
                                      if (a.is_highlighted_offer && !b.is_highlighted_offer) return -1;
                                      if (!a.is_highlighted_offer && b.is_highlighted_offer) return 1;
                                      return 0;
                                    });
                                    return sortedItems.map((item: any) => {`);
                                    
  // End of map closure
  // We look for `})}` right before `</ul>`
  ulStr = ulStr.replace(/}\)}\s*<\/ul>/, `})})()}\n                                </ul>`);
  
  // Price display
  const priceRegex = /<span className="font-bold text-primary text-sm">[\s\S]*?\{item\.price\}<\/span>/;
  const priceNew = `{item.is_highlighted_offer ? (
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-pink-600 text-sm">₹{item.offer_price || (item.discount_percentage ? item.price * (1 - item.discount_percentage/100) : item.price)}</span>
                                                {item.offer_price && <span className="font-medium text-text-muted text-[11px] line-through">₹{item.price}</span>}
                                              </div>
                                            ) : (
                                              <span className="font-bold text-primary text-sm">₹{item.price}</span>
                                            )}`;
  ulStr = ulStr.replace(priceRegex, priceNew);
  
  // Name display (Add Top Offer badge)
  const nameRegex = /{item\.name}/;
  const nameNew = `{item.name}
                                            {item.is_highlighted_offer && (
                                              <span className="text-[9px] text-pink-700 bg-pink-100 border border-pink-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-black uppercase tracking-wider shadow-sm">
                                                Top Offer
                                              </span>
                                            )}`;
  ulStr = ulStr.replace(nameRegex, nameNew);
  
  code = code.replace(oldUlMatch[0], ulStr);
  fs.writeFileSync('src/app/vendors/page.tsx', code);
  console.log('Successfully updated list map and price UI');
} else {
  console.log('Could not find ul list');
}
