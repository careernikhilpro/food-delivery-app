const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/page.tsx', 'utf8');

// 1. Replace image src
code = code.replace(
  /src="\/chicken_special\.png"/g,
  `src="/chicken_biryani_offer.png"`
);

// 2. Replace router.push for the Sunday offer banner to /lowest-prices
const oldButtonStr = `<button onClick={() => router.push('/stall?id=40')} className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform shadow-md">\n                     ORDER NOW\n                   </button>`;

const newButtonStr = `<button onClick={() => router.push('/lowest-prices')} className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform shadow-md">\n                     ORDER NOW\n                   </button>`;

if (code.includes(oldButtonStr)) {
  code = code.replace(oldButtonStr, newButtonStr);
  fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
  console.log('Successfully updated image source and routing link.');
} else {
  console.log('Could not find the button string. Let me try regex.');
  const regexBtn = /<button onClick=\{\(\) => router\.push\('\/stall\?id=40'\)\} className="bg-\[\#FF007F\].*?ORDER NOW\s*<\/button>/s;
  if (regexBtn.test(code)) {
    code = code.replace(regexBtn, `<button onClick={() => router.push('/lowest-prices')} className="bg-[#FF007F] text-white font-black text-[13px] px-6 py-2.5 rounded-full w-fit uppercase tracking-wide mt-1 relative z-20 ml-0 hover:scale-105 transition-transform shadow-md">\n                     ORDER NOW\n                   </button>`);
    fs.writeFileSync('swaddo-customer-app/src/app/page.tsx', code);
    console.log('Successfully updated image source and routing link via regex.');
  } else {
    console.log('Regex also failed.');
  }
}
