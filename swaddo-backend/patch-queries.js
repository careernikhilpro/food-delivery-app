const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

// 1. Fix /meals-under-99 query
const oldMealsQuery = `SELECT 
          m.id, m.stall_id, m.name, m.description, m.price, m.image_url, 
          m.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery,
          s.name as stall_name, s.rating as stall_rating, s.location as stall_address, s.is_pure_veg as stall_is_pure_veg, s.is_open
        FROM menu_items m
        JOIN stalls s ON m.stall_id = s.id
        WHERE CAST(m.price as numeric) <= 99 
            AND m.is_available = true
            AND s.is_active = true
        ORDER BY RANDOM()`;

const newMealsQuery = `SELECT 
          m.id, m.stall_id, m.name, m.description, m.price, m.image_url, 
          m.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery,
          m.offer_price, m.discount_percentage, m.is_highlighted_offer,
          s.name as stall_name, s.rating as stall_rating, s.location as stall_address, s.is_pure_veg as stall_is_pure_veg, s.is_open
        FROM menu_items m
        JOIN stalls s ON m.stall_id = s.id
        WHERE (CAST(m.price as numeric) <= 99 OR CAST(m.offer_price as numeric) <= 99 OR (m.discount_percentage > 0 AND CAST(m.price as numeric) * (1 - m.discount_percentage/100) <= 99))
            AND m.is_available = true
            AND s.is_active = true
        ORDER BY m.is_highlighted_offer DESC, RANDOM()`;

if (code.includes(oldMealsQuery)) {
  code = code.replace(oldMealsQuery, newMealsQuery);
  console.log('Replaced meals under 99 query');
} else {
  console.log('Could not find meals under 99 query');
}

// 2. Fix /search/all ordering so offers are at the top
const oldSearchQuery = `SELECT m.id, m.name, m.price, m.image_url, m.is_veg, m.description, m.has_variants, m.variants, m.is_free_delivery, m.offer_price, m.discount_percentage, m.is_highlighted_offer, m.stall_id, s.name as stall_name, s.cover_image as stall_image, s.location, s.rating, s.rating_count, s.is_open FROM menu_items m JOIN stalls s ON m.stall_id = s.id WHERE LOWER(m.name) LIKE $1 AND m.is_available = true LIMIT 30`;

const newSearchQuery = `SELECT m.id, m.name, m.price, m.image_url, m.is_veg, m.description, m.has_variants, m.variants, m.is_free_delivery, m.offer_price, m.discount_percentage, m.is_highlighted_offer, m.stall_id, s.name as stall_name, s.cover_image as stall_image, s.location, s.rating, s.rating_count, s.is_open FROM menu_items m JOIN stalls s ON m.stall_id = s.id WHERE LOWER(m.name) LIKE $1 AND m.is_available = true ORDER BY m.is_highlighted_offer DESC NULLS LAST LIMIT 30`;

if (code.includes(oldSearchQuery)) {
  code = code.replace(oldSearchQuery, newSearchQuery);
  console.log('Replaced search query');
} else {
  console.log('Could not find search query');
}

// 3. Fix /category/:name ordering
const oldCatQuery = `SELECT m.id, m.name, m.price, m.image_url, m.is_veg, m.description, m.has_variants, m.variants, m.is_free_delivery, m.offer_price, m.discount_percentage, m.is_highlighted_offer,
              m.stall_id, s.name as stall_name, s.cover_image as stall_image, s.location, s.rating, s.rating_count, s.is_open 
       FROM menu_items m 
       JOIN stalls s ON m.stall_id = s.id 
       WHERE LOWER(m.category) = $1 AND m.is_available = true 
       LIMIT 30`;

const newCatQuery = `SELECT m.id, m.name, m.price, m.image_url, m.is_veg, m.description, m.has_variants, m.variants, m.is_free_delivery, m.offer_price, m.discount_percentage, m.is_highlighted_offer,
              m.stall_id, s.name as stall_name, s.cover_image as stall_image, s.location, s.rating, s.rating_count, s.is_open 
       FROM menu_items m 
       JOIN stalls s ON m.stall_id = s.id 
       WHERE LOWER(m.category) = $1 AND m.is_available = true 
       ORDER BY m.is_highlighted_offer DESC NULLS LAST
       LIMIT 30`;

if (code.includes(oldCatQuery)) {
  code = code.replace(oldCatQuery, newCatQuery);
  console.log('Replaced category query');
} else {
  console.log('Could not find category query');
}

fs.writeFileSync('src/routes/stalls.routes.ts', code);
