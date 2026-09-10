const fs = require('fs');
let code = fs.readFileSync('swaddo-backend/src/routes/stalls.routes.ts', 'utf8');

code = code.replace(
  /is_cutlery_enabled: stall\.is_cutlery_enabled,\s*is_free_delivery: stall\.is_free_delivery/g,
  `is_cutlery_enabled: stall.is_cutlery_enabled,
        is_free_delivery: stall.is_free_delivery,
        offers: stall.offers`
);

fs.writeFileSync('swaddo-backend/src/routes/stalls.routes.ts', code);
console.log('Added offers to GET stalls/:id');
