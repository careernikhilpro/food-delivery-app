const fs = require('fs');

let content = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

// 1. Update Hero Image
content = content.replace(
  '<img src={stallData.image} alt={stallData.name} className="w-full h-full object-cover" />',
  \<div className="absolute inset-0 bg-[#FDEADD] z-0"><div className="w-full h-full bg-[url('/placeholder.png')] bg-repeat opacity-50 bg-[length:150px]"></div></div>
        <img src={stallData.image || '/placeholder.png'} alt={stallData.name} className="relative z-10 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />\
);

// 2. Update Menu Item Images
content = content.replace(
  '<img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />',
  \<div className="absolute inset-0 bg-[#FDEADD] z-0"><div className="w-full h-full bg-[url('/placeholder.png')] bg-repeat opacity-50 bg-[length:100px]"></div></div>
                            <img src={item.image || '/placeholder.png'} alt={item.name} className="relative z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />\
);

fs.writeFileSync('src/app/stall/page.tsx', content);
console.log("Updated stall page");
