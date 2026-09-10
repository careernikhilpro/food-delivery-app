import { pool } from '../db';
async function run() {
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '[]'::jsonb;");
    
    // Migrate existing offers into the array
    await pool.query(`
        UPDATE stalls 
        SET offers = jsonb_build_array(
            jsonb_build_object(
                'id', gen_random_uuid(),
                'title', active_offer_title,
                'discountPercentage', active_offer_discount,
                'minOrderValue', active_offer_min,
                'maxDiscount', active_offer_max,
                'isActive', active_offer_is_active
            )
        )
        WHERE active_offer_title IS NOT NULL AND active_offer_is_active = true AND jsonb_array_length(offers) = 0;
    `);
    
    console.log('Migration complete');
    process.exit(0);
}
run();
