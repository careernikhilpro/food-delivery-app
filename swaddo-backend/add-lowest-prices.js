const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

const newRoute = `// Lowest Prices / Offers Route
router.get('/lowest-prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemsRes = await pool.query(\`
      SELECT 
        m.id, m.stall_id, m.name, m.description, m.price, m.image_url, 
        m.category, m.is_veg, m.is_available, m.has_variants, m.variants, m.is_free_delivery,
        m.discount_percentage, m.is_highlighted_offer, m.offer_price,
        s.name as stall_name, s.rating as stall_rating, s.location as stall_address, s.is_pure_veg as stall_is_pure_veg, s.is_open
      FROM menu_items m
      JOIN stalls s ON m.stall_id = s.id
      WHERE (m.is_highlighted_offer = true OR m.discount_percentage > 0 OR m.offer_price IS NOT NULL)
          AND m.is_available = true
          AND s.is_active = true
      ORDER BY m.is_highlighted_offer DESC, m.updated_at DESC
    \`);
    res.json({ data: itemsRes.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/meals-under-99'`;

if (!code.includes('/lowest-prices')) {
  code = code.replace(`router.get('/meals-under-99'`, newRoute);
  fs.writeFileSync('src/routes/stalls.routes.ts', code);
  console.log('Added /lowest-prices route');
} else {
  console.log('Route already exists');
}
