const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

const oldMap = `image: (item.image_url && !item.image_url.includes('unsplash.com') && !item.image_url.includes('picsum.photos')) ? item.image_url : ""
      }));`;

const newMap = `image: (item.image_url && !item.image_url.includes('unsplash.com') && !item.image_url.includes('picsum.photos')) ? item.image_url : "",
        variants: item.variants,
        discount_percentage: item.discount_percentage,
        is_free_delivery: item.is_free_delivery,
        addons: item.addons
      }));`;

code = code.replace(oldMap, newMap);
fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed item mapping');
