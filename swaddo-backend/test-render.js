const axios = require('axios');

async function run() {
  try {
    // We don't have the merchant token, so we might not be able to PUT directly.
    console.log("No token available.");
  } catch (err) {
    console.error(err);
  }
}
run();
