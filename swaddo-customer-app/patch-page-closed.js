const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add CLOSED badge and styling to categoryItems
const categoryItemRegex = /<div key=\{item\.id\} className="flex flex-col bg-white rounded-2xl shadow-\[0_2px_10px_rgba\(0,0,0,0\.06\)\] overflow-visible relative border border-gray-100\/50 shrink-0 w-\[150px\] snap-start mb-2">/g;
const categoryItemReplacement = `<div key={item.id} className={\`flex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 w-[150px] snap-start mb-2 \${item.is_open === false ? 'grayscale opacity-80 pointer-events-none' : ''}\`}>
                    {item.is_open === false && (
                      <div className="absolute inset-0 bg-black/5 z-[60] flex items-center justify-center rounded-2xl">
                        <span className="bg-black/80 text-white font-black text-[11px] px-2 py-1 border border-white rounded -rotate-12 shadow-sm">CLOSED</span>
                      </div>
                    )}`;

if (code.match(categoryItemRegex)) {
  code = code.replace(categoryItemRegex, categoryItemReplacement);
  console.log('Patched categoryItems CLOSED styling');
} else {
  console.log('Could not match categoryItemRegex');
}

// 2. Fix the sorting to also prioritize offers. (It's possible my previous patch was overwritten or didn't match perfectly if there were multiple places).
// Actually, let's verify if the sort is there.
const sortRegex = /const sortedDishes = res\.data\.dishes\.sort\(\(a: any, b: any\) => \{[\s\S]*?return getFinalPrice\(a\) - getFinalPrice\(b\);\s*\}\);/;
if (!code.match(sortRegex)) {
  console.log('Sort regex not found, meaning it was not patched or is different.');
} else {
  console.log('Sort logic is present.');
}

fs.writeFileSync('src/app/page.tsx', code);
