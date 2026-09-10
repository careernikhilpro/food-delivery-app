const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

code = code.replace(
  /category: \(item\.category && item\.category\.trim\(\)\.toLowerCase\(\) !== "all"\) \? item\.category : "Others",\s*image: \(item\.image_url && !item\.image_url\.includes\('unsplash\.com'\) && !item\.image_url\.includes\('picsum\.photos'\)\) \? item\.image_url : ""\s*\}\)\);/g,
  `category: (item.category && item.category.trim().toLowerCase() !== "all") ? item.category : "Others",
        image: (item.image_url && !item.image_url.includes('unsplash.com') && !item.image_url.includes('picsum.photos')) ? item.image_url : "",
        variants: item.variants,
        discount_percentage: item.discount_percentage,
        is_free_delivery: item.is_free_delivery,
        addons: item.addons
      }));`
);

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed item mapping (Regex)');
