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
  
  await page.goto('http://localhost:3001');
  
  await page.evaluate(() => {
    localStorage.setItem('swaddo_customer_token', 'mock_token_for_testing');
    localStorage.setItem('swaddo_customer_phone', '9999999999');
    localStorage.setItem('swaddo_onboarding_completed', 'true');
  });
  
  await page.reload();
  
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
