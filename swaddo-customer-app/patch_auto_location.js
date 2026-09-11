const fs = require('fs');
let code = fs.readFileSync('src/app/cart/page.tsx', 'utf8');

const target = "fetchAddresses();\n  }, []);";
const injection = `fetchAddresses();
  }, []);

  useEffect(() => {
    if (isMapOpen && !mapSearchQuery && mapLat && mapLng) {
      handleMapDragEnd(mapLat, mapLng);
    }
  }, [isMapOpen]);`;

if (code.includes(target)) {
  code = code.replace(target, injection);
  fs.writeFileSync('src/app/cart/page.tsx', code);
  console.log('Patched successfully');
} else {
  // try different whitespace
  const regex = /fetchAddresses\(\);\s*\}, \[\]\);/;
  if (code.match(regex)) {
    code = code.replace(regex, injection);
    fs.writeFileSync('src/app/cart/page.tsx', code);
    console.log('Patched with regex successfully');
  } else {
    console.log('Still not found');
  }
}
