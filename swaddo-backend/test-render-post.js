const axios = require('axios');

async function run() {
  try {
    const baseURL = 'https://swaddo-backend.onrender.com/api';
    
    // 1. Register a test vendor user
    const email = `testvendor${Date.now()}@example.com`;
    console.log("Registering", email);
    await axios.post(`${baseURL}/auth/register`, {
      name: "Test Vendor User",
      email,
      password: "password123",
      role: "vendor",
      phone: "9998887776"
    });
    
    // 2. Login
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email,
      password: "password123",
      role: "vendor"
    });
    const token = loginRes.data.token;
    
    // 3. Register as vendor
    const vendorRes = await axios.post(`${baseURL}/vendors/register`, {
      business_name: "Test Vendor Biz"
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // 4. Create stall
    const stallRes = await axios.post(`${baseURL}/stalls`, {
      name: "Test Stall with Variants",
      location: "Pune",
      is_open: true,
      tags: "Test",
      min_price: 50
    }, { headers: { Authorization: `Bearer ${token}` } });
    const stallId = stallRes.data.id;
    console.log("Created stall", stallId);
    
    // 5. Add menu item with variants
    const menuRes = await axios.post(`${baseURL}/stalls/${stallId}/menu`, {
      name: "Test Item from API",
      description: "Test Desc",
      price: 50,
      is_veg: true,
      is_available: true,
      category: "Test",
      has_variants: true,
      variants: [{name: "Half", price: "50"}]
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log("POST Result:", JSON.stringify(menuRes.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
