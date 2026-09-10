const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/checkout/page.tsx', 'utf8');

code = code.replace(
  /const \[stallInfo, setStallInfo\] = useState<any>\(null\);/g,
  'const [stallInfo, setStallInfo] = useState<any>(null);\n    const [liveMenu, setLiveMenu] = useState<any[]>([]);'
);

code = code.replace(
  /api\.get\(`\/stalls\/\$\{cart\.stallId\}`\)\.then\(res => \{([\s\S]*?) \}\)\.catch\(console\.error\);/g,
  `api.get(\`/stalls/\${cart.stallId}\`).then(res => { $1 }).catch(console.error);
      api.get(\`/stalls/\${cart.stallId}/menu\`).then(res => setLiveMenu(res.data)).catch(console.error);`
);

code = code.replace(
  /const hasFreeDeliveryItem = cart\.items\.some\(\(item: any\) => item\.is_free_delivery === true\);/g,
  `const hasFreeDeliveryItem = cart.items.some((item: any) => {
          const liveItem = liveMenu.find((m: any) => m.id.toString() === item.id.toString() || \`item-\${m.name.replace(/\\s+/g, '-').toLowerCase()}\` === item.id.toString());
          return liveItem?.is_free_delivery === true || item.is_free_delivery === true;
        });`
);

code = code.replace(
  /\}, \[stallCoords, mapLat, mapLng, cartTotal, cart\.items, stallInfo\]\);/g,
  '}, [stallCoords, mapLat, mapLng, cartTotal, cart.items, stallInfo, liveMenu]);'
);

fs.writeFileSync('swaddo-customer-app/src/app/checkout/page.tsx', code);
console.log('Successfully patched liveMenu check');
