const fs = require('fs');
const file = 'd:/swaddoapk/swaddo-customer-app/src/app/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. RestaurantCard container
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function RestaurantCard')) {
    for (let j = i; j < i + 50; j++) {
      if (lines[j].includes('<div className="w-full bg-white border border-gray-200 rounded-[20px] p-4 shadow-sm relative overflow-hidden">')) {
        lines[j] = lines[j].replace(
          '<div className="w-full bg-white border border-gray-200 rounded-[20px] p-4 shadow-sm relative overflow-hidden">',
          '<div className={w-full bg-white border border-gray-200 rounded-[20px] p-4 shadow-sm relative overflow-hidden }>\n        {data.isOpen === false && (\n           <div className="absolute inset-0 bg-black/5 z-[60] flex items-center justify-center">\n             <span className="bg-black/80 text-white font-black text-xl tracking-wider px-4 py-2 border-2 border-white rounded-lg -rotate-12 shadow-lg">STORE CLOSED</span>\n           </div>\n        )}'
        );
        break;
      }
    }
  }
}

// 2. RestaurantCard quantity buttons
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function RestaurantCard')) {
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('{quantity > 0 ? (')) {
        // Find the line that says <div className="absolute bottom-2 right-2 h-7 bg-white
        if (lines[j+1] && lines[j+1].includes('className="absolute bottom-2 right-2 h-7 bg-white')) {
           lines[j] = lines[j].replace('{quantity > 0 ? (', '{data.isOpen !== false && (quantity > 0 ? (');
           
           // Now find the end of this ternary block. 
           // It ends with:
           //                     </button>
           //                   )}
           //                   <div className="mt-2">
           let braceCount = 0;
           for (let k = j; k < lines.length; k++) {
              if (lines[k].includes('</button>') && lines[k+1] && lines[k+1].includes(')}')) {
                 if (lines[k+2] && lines[k+2].includes('<div className="mt-2">')) {
                    lines[k+1] = lines[k+1].replace(')}', ') : null)}');
                    break;
                 }
              }
           }
           break;
        }
      }
    }
  }
}

// 3. Meals Under 99 container
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{mealsUnder99.map((item, idx) => {')) {
    for (let j = i; j < i + 50; j++) {
      if (lines[j].includes('<div key={item.id} className="flex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 w-[150px] snap-start mb-2">')) {
        lines[j] = lines[j].replace(
          '<div key={item.id} className="flex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 w-[150px] snap-start mb-2">',
          '<div key={item.id} className={lex flex-col bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-visible relative border border-gray-100/50 shrink-0 w-[150px] snap-start mb-2 }>\n        {item.is_open === false && (\n           <div className="absolute inset-0 bg-black/5 z-[60] flex items-center justify-center rounded-2xl">\n             <span className="bg-black/80 text-white font-black text-[11px] px-2 py-1 border border-white rounded -rotate-12">CLOSED</span>\n           </div>\n        )}'
        );
        break;
      }
    }
  }
}

// 4. Meals Under 99 buttons
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{mealsUnder99.map((item, idx) => {')) {
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('{quantity > 0 ? (')) {
        // Find the next line
        if (lines[j+1] && lines[j+1].includes('className="absolute -bottom-4 right-3 h-7 bg-white')) {
           lines[j] = lines[j].replace('{quantity > 0 ? (', '{item.is_open !== false && (quantity > 0 ? (');
           
           for (let k = j; k < lines.length; k++) {
              if (lines[k].includes('</button>') && lines[k+1] && lines[k+1].includes(')}')) {
                 if (lines[k+2] && lines[k+2].includes('<div className="mt-3 px-1">')) {
                    lines[k+1] = lines[k+1].replace(')}', ') : null)}');
                    break;
                 }
              }
           }
           break;
        }
      }
    }
  }
}


fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log("Patched page.tsx successfully.");
