const axios = require('axios');
async function run() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6InZlbmRvciIsImlhdCI6MTc4NTc4NDg4OSwiZXhwIjoxNzg1ODcxMjg5fQ.g6TxR-d7t0w_MFxZ7zvO_Neeq8avq0SPmiepracuTF4';
    const menuRes = await axios.post(`https://swaddo-backend.onrender.com/api/stalls/14/menu`, {
      name: "Render Test Variants",
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
