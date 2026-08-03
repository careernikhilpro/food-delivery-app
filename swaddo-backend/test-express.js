require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres' });
const app = express();
app.use(express.json());

// Simplified route logic
app.put('/api/stalls/:id/menu/:itemId', async (req, res) => {
  try {
    const { id: stallId, itemId } = req.params;
    const { name, description, price, is_veg, is_available, category, has_variants, variants } = req.body;
    
    console.log("RECEIVED PAYLOAD:", req.body);
    console.log("Variants JSON stringified:", variants ? JSON.stringify(variants) : null);
    
    const result = await pool.query(
      'UPDATE menu_items SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), is_veg = COALESCE($4, is_veg), is_available = COALESCE($5, is_available), category = COALESCE($8, category), has_variants = COALESCE($9, has_variants), variants = COALESCE($10, variants) WHERE id = $6 AND stall_id = $7 RETURNING *',
      [name, description, price, is_veg, is_available, itemId, stallId, category, has_variants, variants ? JSON.stringify(variants) : null]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB ERROR", err);
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(5006, async () => {
  console.log("Server listening on 5006");
  const axios = require('axios');
  try {
    const response = await axios.put('http://localhost:5006/api/stalls/14/menu/18', {
      name: "Tikka Test",
      has_variants: true,
      variants: [{ name: "Small", price: "20" }]
    });
    console.log("API RESPONSE:", response.data);
  } catch(e) {
    console.error("REQUEST ERROR:", e.message);
  } finally {
    server.close();
    pool.end();
  }
});
