const fs = require('fs');
const file = 'd:/swaddoapk/swaddo-customer-app/src/app/page.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /<div className=\{\`w-2\.5 h-2\.5 rounded-sm border flex items-center justify-center \$\{item\.is_veg !== false \? 'border-green-600' : 'border-red-600'\}\`\}>\s*<div className=\{\`w-1\.5 h-1\.5 rounded-full \$\{item\.is_veg !== false \? 'bg-green-600' : 'bg-red-600'\}\`\} \/>\s*<\/div>/g,
    '<div className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${item.is_veg ? \\'border-green-600\\' : \\'border-red-600\\'}`}>\n                          <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? \\'bg-green-600\\' : \\'bg-red-600\\'}`} />\n                        </div>'
);

data = data.replace(
    /<div className="mt-\[3px\] shrink-0 w-\[11px\] h-\[11px\] border border-\[#00A14F\] flex items-center justify-center rounded-\[2px\]">\s*<div className="w-1\.5 h-1\.5 bg-\[#00A14F\] rounded-full"><\/div>\s*<\/div>/g,
    '<div className={`mt-[3px] shrink-0 w-[11px] h-[11px] border flex items-center justify-center rounded-[2px] ${item.is_veg ? \\'border-[#00A14F]\\' : \\'border-[#8B3A1A]\\'`}>\n                            {item.is_veg ? (\n                              <div className=\"w-1.5 h-1.5 bg-[#00A14F] rounded-full\"></div>\n                            ) : (\n                              <div className=\"w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[4px] border-b-[#8B3A1A] mt-[1px]\"></div>\n                            )}\n                         </div>'
);

fs.writeFileSync(file, data);
