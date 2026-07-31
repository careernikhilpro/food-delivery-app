import { pool } from './index';

const test = async () => {
  try {
    const result = await pool.query(
      'UPDATE stalls SET name = COALESCE($1, name), location = COALESCE($2, location), latitude = COALESCE($3, latitude), longitude = COALESCE($4, longitude), is_open = COALESCE($5, is_open), cover_image = COALESCE($6, cover_image), opening_time = COALESCE($7, opening_time), closing_time = COALESCE($8, closing_time), prep_time = COALESCE($10, prep_time), tags = COALESCE($11, tags), offer_text = COALESCE($12, offer_text), is_pure_veg = COALESCE($13, is_pure_veg) WHERE id = $9 RETURNING *',
      [null, null, null, null, true, null, null, null, 1, null, null, null, null]
    );
    console.log('Success:', result.rows[0]);
  } catch (e: any) {
    console.log('ERROR:', e.message);
  }
  process.exit(0);
};
test();
