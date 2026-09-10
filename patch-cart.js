const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/cart/page.tsx', 'utf8');

// Add states
code = code.replace(
  /const \[isCutleryEnabled, setIsCutleryEnabled\] = useState\(false\);/,
  'const [isCutleryEnabled, setIsCutleryEnabled] = useState(false);\n  const [isFreeDeliveryStore, setIsFreeDeliveryStore] = useState(false);\n  const [originalDeliveryFee, setOriginalDeliveryFee] = useState<number | null>(null);'
);

// Populate state
code = code.replace(
  /setIsCutleryEnabled\(res\.data\.is_cutlery_enabled === true\);/,
  'setIsCutleryEnabled(res.data.is_cutlery_enabled === true);\n            setIsFreeDeliveryStore(res.data.is_free_delivery === true);'
);

// Patch logic
code = code.replace(
  /fee = Math\.round\(fee \* 100\) \/ 100;\s*setDeliveryFee\(fee\);\s*setDistanceKms\(actualDist\.toFixed\(1\)\);\s*setFoodMarkup\(newMarkup\);\s*\}/,
  `fee = Math.round(fee * 100) / 100;
        
        const hasFreeDeliveryItem = cart.items.some((item) => {
          const liveItem = stallMenu.find((m) => m.id.toString() === item.id.toString() || \`item-\${m.name.replace(/\\s+/g, '-').toLowerCase()}\` === item.id.toString());
          return liveItem?.is_free_delivery === true || item.is_free_delivery === true;
        });

        if (isFreeDeliveryStore || hasFreeDeliveryItem) {
          setOriginalDeliveryFee(fee);
          setDeliveryFee(0);
        } else {
          setOriginalDeliveryFee(null);
          setDeliveryFee(fee);
        }

        setDistanceKms(actualDist.toFixed(1));
        setFoodMarkup(newMarkup);
      }`
);

// Add stallMenu and isFreeDeliveryStore to deps
code = code.replace(
  /savedAddresses,\s*\]\);/,
  `savedAddresses,\n    stallMenu,\n    isFreeDeliveryStore\n  ]);`
);

// Fix UI
code = code.replace(
  /Delivery Fee \| \{distanceKms \? distanceKms : "\.\.\."\} kms\s*<\/span>\s*<span className="text-gray-600 font-medium">\s*₹\{deliveryFee\.toFixed\(2\)\}\s*<\/span>/,
  `Delivery Fee | {distanceKms ? distanceKms : "..."} kms
                    </span>
                    <div className="flex items-center gap-2">
                      {originalDeliveryFee !== null && (
                        <span className="line-through text-xs text-gray-400">
                          &#8377;{originalDeliveryFee.toFixed(2)}
                        </span>
                      )}
                      <span className={originalDeliveryFee !== null ? "text-green-600 font-bold" : "text-gray-600 font-medium"}>
                        {originalDeliveryFee !== null ? "FREE" : \`\u20B9\${deliveryFee.toFixed(2)}\`}
                      </span>
                    </div>`
);

fs.writeFileSync('swaddo-customer-app/src/app/cart/page.tsx', code);
console.log('Patched cart page successfully');
