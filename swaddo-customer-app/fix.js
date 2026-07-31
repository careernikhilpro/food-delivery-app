const fs = require('fs');

let content = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

// Restore the category header
const badCategory =                 <div className="flex items-center gap-5 text-sm font-medium">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock size={18} className={stallData.isOpen !== false && stallData.is_open !== false ? "text-green-600" : "text-red-500"} />
                    <span className={stallData.isOpen !== false && stallData.is_open !== false ? "text-gray-800 font-bold" : "text-red-500 font-bold"}>
                      {stallData.isOpen !== false && stallData.is_open !== false ? \Open \uFFFD\uFFFD\uFFFD \ - \\ : \Closed\}
                    </span>
                  </div>    
                  <ChevronDown size={20} className="text-gray-400" />
                </div>;

const goodCategory =                 <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PromoIcon className="w-6 h-6 object-contain" />
                    <h2 className="text-[14px] font-black text-[#C2185B] tracking-tight leading-none uppercase">20% LOWER PRICES vs OTHER APPS</h2>
                  </div>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>;

// Note: It might have a weird character \uFFFD\uFFFD\uFFFD because of encoding issues from the replace. Let's just use regex.

content = content.replace(
  /                <div className="flex items-center gap-5 text-sm font-medium">[\s\S]*?<ChevronDown size={20} className="text-gray-400" \/>\n                <\/div>/,
  goodCategory
);

// Now correctly replace the Clock in the Info Card
content = content.replace(
  '<Clock size={14} className={stallData.isOpen ? "text-green-600" : "text-red-500"} />',
  '<Clock size={14} className={stallData.isOpen !== false && stallData.is_open !== false ? "text-green-600" : "text-red-500"} />'
);
content = content.replace(
  '<span className={stallData.isOpen ? "text-gray-800 font-bold" : "text-red-500 font-bold"}>',
  '<span className={stallData.isOpen !== false && stallData.is_open !== false ? "text-gray-800 font-bold" : "text-red-500 font-bold"}>'
);
content = content.replace(
  /\{stallData\.isOpen \? Open • \$\{stallData\.openingTime \|\| '09:00 AM'\} - \$\{stallData\.closingTime \|\| '10:00 PM'\} : Closed\}/g,
  "{stallData.isOpen !== false && stallData.is_open !== false ? Open •  -  : Closed}"
);


fs.writeFileSync('src/app/stall/page.tsx', content);
console.log("Done");
