const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/checkout/page.tsx', 'utf8');

code = code.replace(
  /const \[deliveryFee, setDeliveryFee\] = useState\(20\);/g,
  'const [deliveryFee, setDeliveryFee] = useState(20);\n    const [originalDeliveryFee, setOriginalDeliveryFee] = useState<number | null>(null);'
);

code = code.replace(
  /fee = Math\.round\(fee \* 100\) \/ 100;\s*setDeliveryFee\(fee\);\s*setDistanceKms\(dist\);\s*\}\s*\}, \[stallCoords, mapLat, mapLng, cartTotal\]\);/g,
  `fee = Math.round(fee * 100) / 100;
        
        const hasFreeDeliveryItem = cart.items.some((item: any) => item.is_free_delivery === true);
        const isFreeDeliveryStore = stallInfo?.is_free_delivery === true;

        if (isFreeDeliveryStore || hasFreeDeliveryItem) {
          setOriginalDeliveryFee(fee);
          setDeliveryFee(0);
        } else {
          setOriginalDeliveryFee(null);
          setDeliveryFee(fee);
        }
        
        setDistanceKms(dist);
      }
    }, [stallCoords, mapLat, mapLng, cartTotal, cart.items, stallInfo]);`
);

fs.writeFileSync('swaddo-customer-app/src/app/checkout/page.tsx', code);
console.log('Patched checkout logic');
