const fs = require('fs');

const files = [
  'src/app/page.tsx',
  'src/app/stall/page.tsx',
  'src/app/meals-under-99/page.tsx',
  'src/app/category/[name]/ClientCategoryPage.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace in mapped items or direct object literals
  // Format 1: free_delivery_max_km: item.free_delivery_max_km,
  let matchStr = "free_delivery_max_km: item.free_delivery_max_km,";
  let replStr = "free_delivery_max_km: item.free_delivery_max_km, coupon_applicable: item.coupon_applicable,";
  if (code.includes(matchStr)) { code = code.replaceAll(matchStr, replStr); }
  
  // Format 2: free_delivery_max_km: item.free_delivery_max_km }
  let matchStr2 = "free_delivery_max_km: item.free_delivery_max_km }";
  let replStr2 = "free_delivery_max_km: item.free_delivery_max_km, coupon_applicable: item.coupon_applicable }";
  if (code.includes(matchStr2)) { code = code.replaceAll(matchStr2, replStr2); }
  
  // Format 3: free_delivery_max_km: variantModal.item.free_delivery_max_km }
  let matchStr3 = "free_delivery_max_km: variantModal.item.free_delivery_max_km }";
  let replStr3 = "free_delivery_max_km: variantModal.item.free_delivery_max_km, coupon_applicable: variantModal.item.coupon_applicable }";
  if (code.includes(matchStr3)) { code = code.replaceAll(matchStr3, replStr3); }
  
  fs.writeFileSync(file, code);
  console.log('Patched mapping in ' + file);
});
