const fs = require('fs');
let code = fs.readFileSync('src/app/category/[name]/ClientCategoryPage.tsx', 'utf8');

const matchStr = 'isVeg: variantModal.item.is_veg }, 1)';
const replStr = 'isVeg: variantModal.item.is_veg, is_free_delivery: variantModal.item.is_free_delivery, free_delivery_min_amount: variantModal.item.free_delivery_min_amount, free_delivery_max_km: variantModal.item.free_delivery_max_km }, 1)';

const matchStr2 = 'isVeg: variantModal.item.is_veg }, -1)';
const replStr2 = 'isVeg: variantModal.item.is_veg, is_free_delivery: variantModal.item.is_free_delivery, free_delivery_min_amount: variantModal.item.free_delivery_min_amount, free_delivery_max_km: variantModal.item.free_delivery_max_km }, -1)';

let patched = false;
if (code.includes(matchStr)) {
  code = code.replaceAll(matchStr, replStr);
  patched = true;
}
if (code.includes(matchStr2)) {
  code = code.replaceAll(matchStr2, replStr2);
  patched = true;
}

if (patched) {
  fs.writeFileSync('src/app/category/[name]/ClientCategoryPage.tsx', code);
  console.log('Successfully patched ClientCategoryPage modal for free delivery');
} else {
  console.log('Regex failed for ClientCategoryPage modal free delivery');
}
