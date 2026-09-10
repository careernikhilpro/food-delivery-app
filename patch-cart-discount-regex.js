const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/cart/page.tsx', 'utf8');

const regex = /let discountAmount = 0;\s*if\s*\(stallOfferIsActive\s*&&\s*stallOfferDiscount\s*>\s*0\s*&&\s*baseItemTotal\s*>=\s*stallOfferMin\)\s*\{\s*discountAmount\s*=\s*Math\.round\(baseItemTotal\s*\*\s*\(stallOfferDiscount\s*\/\s*100\)\);\s*if\s*\(stallOfferMax\s*>\s*0\s*&&\s*discountAmount\s*>\s*stallOfferMax\)\s*\{\s*discountAmount\s*=\s*stallOfferMax;\s*\}\s*\}/;

const newLogic = `  let discountAmount = 0;
  let activeDiscountPct = 0;
  
  if (stallOffers && stallOffers.length > 0) {
    let bestDiscount = 0;
    const activeOffers = stallOffers.filter((o: any) => o.isActive || o.is_active);
    activeOffers.forEach((o: any) => {
      const minOrder = parseFloat(o.minOrderValue || o.minOrder) || 0;
      const maxDiscount = parseFloat(o.maxDiscount) || Infinity;
      const discountPct = parseFloat(o.discountPercentage || o.discount) || 0;
      if (baseItemTotal >= minOrder) {
        const amt = Math.min((baseItemTotal * discountPct) / 100, maxDiscount);
        if (amt > bestDiscount) {
          bestDiscount = amt;
          activeDiscountPct = discountPct;
        }
      }
    });
    discountAmount = Math.round(bestDiscount);
  } else if (stallOfferIsActive && stallOfferDiscount > 0 && baseItemTotal >= stallOfferMin) {
    discountAmount = Math.round(baseItemTotal * (stallOfferDiscount / 100));
    if (stallOfferMax > 0 && discountAmount > stallOfferMax) {
      discountAmount = stallOfferMax;
    }
    activeDiscountPct = stallOfferDiscount;
  }`;

if (regex.test(code)) {
  code = code.replace(regex, newLogic);
  fs.writeFileSync('swaddo-customer-app/src/app/cart/page.tsx', code);
  console.log('Fixed cart/page.tsx successfully');
} else {
  console.log('Regex did not match!');
}
