const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

code = code.replace(
  /WHERE CAST\(m\.price as numeric\) <= 99\s*AND m\.is_available = true\s*AND s\.is_active = true\s*ORDER BY RANDOM\(\)/,
  `WHERE (CAST(m.price as numeric) <= 99 OR CAST(m.offer_price as numeric) <= 99 OR (m.discount_percentage > 0 AND CAST(m.price as numeric) * (1 - m.discount_percentage/100) <= 99))
            AND m.is_available = true
            AND s.is_active = true
        ORDER BY m.is_highlighted_offer DESC NULLS LAST, RANDOM()`
);

// add offer_price to meals under 99 select
code = code.replace(
  /m\.category, m\.is_veg, m\.is_available, m\.has_variants, m\.variants, m\.is_free_delivery,/,
  `m.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery,
          m.offer_price, m.discount_percentage, m.is_highlighted_offer,`
);

// category query
code = code.replace(
  /WHERE LOWER\(m\.category\) = \$1 AND m\.is_available = true\s*LIMIT 30/,
  `WHERE LOWER(m.category) = $1 AND m.is_available = true 
       ORDER BY m.is_highlighted_offer DESC NULLS LAST
       LIMIT 30`
);

fs.writeFileSync('src/routes/stalls.routes.ts', code);
console.log('Regex patch done');
