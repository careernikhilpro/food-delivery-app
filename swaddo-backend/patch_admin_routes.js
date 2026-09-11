const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.routes.ts', 'utf8');

const regexPost = /addons, is_free_delivery, free_delivery_min_amount, free_delivery_max_km } = req\.body;/;
const replPost = `addons, is_free_delivery, free_delivery_min_amount, free_delivery_max_km, coupon_applicable } = req.body;`;

const regexPost2 = /is_free_delivery, free_delivery_min_amount, free_delivery_max_km\) \n\s*VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12, \$13, \$14\) RETURNING \*/;
const replPost2 = `is_free_delivery, free_delivery_min_amount, free_delivery_max_km, coupon_applicable) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;

const regexPost3 = /free_delivery_max_km \|\| null\n\s*\]/;
const replPost3 = `free_delivery_max_km || null,
          coupon_applicable ?? true
        ]`;

let patched = false;
if (code.match(regexPost)) { code = code.replace(regexPost, replPost); patched = true; }
if (code.match(regexPost2)) { code = code.replace(regexPost2, replPost2); patched = true; }
if (code.match(regexPost3)) { code = code.replace(regexPost3, replPost3); patched = true; }

// PUT
const regexPut = /offer_price, is_free_delivery, free_delivery_min_amount, free_delivery_max_km } = req\.body;/;
const replPut = `offer_price, is_free_delivery, free_delivery_min_amount, free_delivery_max_km, coupon_applicable } = req.body;`;

const regexPut2 = /free_delivery_max_km = \$14\n\s*WHERE id = \$15 AND stall_id = \$16 RETURNING \*/;
const replPut2 = `free_delivery_max_km = $14, coupon_applicable = COALESCE($17, coupon_applicable)
           WHERE id = $15 AND stall_id = $16 RETURNING *`;

const regexPut3 = /free_delivery_max_km,\n\s*itemId, stallId\n\s*\]/;
const replPut3 = `free_delivery_max_km,
               itemId, stallId,
               coupon_applicable
             ]`;

if (code.match(regexPut)) { code = code.replace(regexPut, replPut); patched = true; }
if (code.match(regexPut2)) { code = code.replace(regexPut2, replPut2); patched = true; }
if (code.match(regexPut3)) { code = code.replace(regexPut3, replPut3); patched = true; }

if (patched) {
  fs.writeFileSync('src/routes/admin.routes.ts', code);
  console.log('Patched admin.routes.ts for coupon_applicable');
} else {
  console.log('Failed to patch admin.routes.ts');
}
