const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');

// We need to calculate couponApplicableTotal
const initStr = "const taxAndFees = Math.round(cartTotal * 0.05);";
const initRepl = `const taxAndFees = Math.round(cartTotal * 0.05);
  
  let couponApplicableTotal = 0;
  cart.items.forEach((item) => {
    // Note: in checkout, cart.items are the raw items from context. 
    // They don't have the fresh stallMenu, but we mapped coupon_applicable into the cart items in the updated VariantModalComponent?
    // Wait! I didn't map coupon_applicable into cart items in VariantModalComponent or RestaurantCard!
    // I need to map it in RestaurantCard, Stall page mapping, Meals Under 99 mapping, and Category mapping!
    if (item.coupon_applicable !== false) {
      couponApplicableTotal += item.price * item.quantity;
    }
  });`;

if (code.includes(initStr)) { code = code.replace(initStr, initRepl); }

// Patch array logic
const arrayStr = `if (cartTotal >= minOrder) {
          const amt = Math.min((cartTotal * discountPct) / 100, maxDiscount);`;
const arrayRepl = `if (cartTotal >= minOrder) {
          const amt = Math.min((couponApplicableTotal * discountPct) / 100, maxDiscount);`;
if (code.includes(arrayStr)) { code = code.replace(arrayStr, arrayRepl); }

// Patch fallback logic
const fallbackStr = `if (cartTotal >= minOrder) {
      discountAmount = Math.min((cartTotal * discountPct) / 100, maxDiscount);`;
const fallbackRepl = `if (cartTotal >= minOrder) {
      discountAmount = Math.min((couponApplicableTotal * discountPct) / 100, maxDiscount);`;
if (code.includes(fallbackStr)) { code = code.replace(fallbackStr, fallbackRepl); }

fs.writeFileSync('src/app/checkout/page.tsx', code);
console.log('Patched checkout/page.tsx for coupon_applicable');
