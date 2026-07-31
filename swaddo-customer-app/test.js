const axios = require('axios');
axios.get('http://localhost:5005/api/stalls/1').then(res => {
  console.log("Is array:", Array.isArray(res.data));
  console.log(JSON.stringify(res.data, null, 2).substring(0, 500));
}).catch(err => {
  console.error("Error fetching stall:", err.message);
});
