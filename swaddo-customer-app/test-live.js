const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  console.log("Navigating to swaddo.in...");
  await page.goto('https://swaddo.in', { waitUntil: 'networkidle2' });
  
  console.log("Setting localStorage...");
  await page.evaluate(() => {
    localStorage.setItem('swaddo_customer_token', 'mock_token_for_testing');
    localStorage.setItem('swaddo_customer_phone', '9999999999');
    localStorage.setItem('swaddo_onboarding_completed', 'true');
  });
  
  console.log("Reloading...");
  await page.reload({ waitUntil: 'networkidle2' });
  
  console.log("Waiting 5s for errors...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  console.log("Done");
})();
