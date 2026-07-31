const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://swaddo_user:swaddo_password@127.0.0.1:5432/swaddo_db'
});

const restaurants = [
  { name: 'Thalaiva Biryani', location: 'Shaniwar Peth, Pune', tags: 'Biryani, South Indian', is_pure_veg: false, prep: 35 },
  { name: 'Apka Apna Chaiwala', location: 'NH 33, Muraura, Bihar', tags: 'Tea, Snacks', is_pure_veg: true, prep: 20 },
  { name: 'Burger King', location: 'Patna Central', tags: 'Burger, Fast Food', is_pure_veg: false, prep: 25 },
  { name: 'Subway', location: 'Frazer Road, Patna', tags: 'Healthy, Salads', is_pure_veg: false, prep: 15 },
  { name: 'Haldirams Prabhuji', location: 'Kankarbagh, Patna', tags: 'Sweets, North Indian', is_pure_veg: true, prep: 30 },
  { name: 'Domino Pizza', location: 'Boring Road, Patna', tags: 'Pizza, Fast Food', is_pure_veg: false, prep: 40 },
  { name: 'KFC', location: 'Dak Bungalow, Patna', tags: 'Fried Chicken, Fast Food', is_pure_veg: false, prep: 25 }
];

const categories = ['Main Course', 'Starters', 'Beverages', 'Desserts', 'Breads', 'Fast Food'];

async function seed() {
  try {
    for (let i = 0; i < restaurants.length; i++) {
      const rest = restaurants[i];
      const phone = '99999999' + i.toString().padStart(2, '0');
      
      // 1. Create User
      const userRes = await pool.query(
        'INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING id',
        [phone, rest.name + ' Owner', 'vendor']
      );
      const userId = userRes.rows[0].id;

      // 2. Create Vendor
      const vendorRes = await pool.query(
        'INSERT INTO vendors (user_id, business_name, status) VALUES ($1, $2, $3) RETURNING id',
        [userId, rest.name + ' LLC', 'approved']
      );
      const vendorId = vendorRes.rows[0].id;

      // 3. Create Stall
      const stallRes = await pool.query(`
        INSERT INTO stalls (
          vendor_id, name, location, latitude, longitude, 
          cover_image, opening_time, closing_time, is_open, rating, rating_count, 
          is_pure_veg, prep_time, tags
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8, $9, $10, $11, 
          $12, $13, $14
        ) RETURNING id
      `, [
        vendorId, rest.name, rest.location, 25.5941 + (Math.random()*0.1), 85.1376 + (Math.random()*0.1),
        'https://source.unsplash.com/800x400/?restaurant,food', '10:00 AM', '11:00 PM', true, (4 + Math.random()).toFixed(1), Math.floor(Math.random() * 500) + 50,
        rest.is_pure_veg, rest.prep, rest.tags
      ]);
      const stallId = stallRes.rows[0].id;

      // 4. Create Menu Items
      const numItems = Math.floor(Math.random() * 6) + 10; // 10 to 15 items
      for (let j = 0; j < numItems; j++) {
        // We assume menu_items table has category and image_url columns. 
        // If they don't exist, we will use a try-catch to fallback to basic columns
        const isVeg = rest.is_pure_veg ? true : Math.random() > 0.3;
        const price = Math.floor(Math.random() * 300) + 50;
        const cat = categories[Math.floor(Math.random() * categories.length)];
        
        try {
          await pool.query(
            'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [stallId, `Item ${j+1} ${cat}`, `Delicious ${cat} item made with fresh ingredients.`, price, isVeg, true, cat, `https://source.unsplash.com/400x300/?food,dish`]
          );
        } catch(e) {
          // Fallback if category and image_url don't exist
          await pool.query(
            'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available) VALUES ($1, $2, $3, $4, $5, $6)',
            [stallId, `Item ${j+1}`, `Delicious item made with fresh ingredients.`, price, isVeg, true]
          );
        }
      }
      console.log(`Added ${rest.name} with ${numItems} items.`);
    }
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    pool.end();
  }
}

seed();
