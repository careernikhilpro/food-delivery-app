const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/cart/page.tsx', 'utf8');

// 1. Add state for stallOffers
if (!code.includes('const [stallOffers, setStallOffers]')) {
  code = code.replace(
    /const \[stallOfferMax, setStallOfferMax\] = useState\(0\);/g,
    `const [stallOfferMax, setStallOfferMax] = useState(0);\n  const [stallOffers, setStallOffers] = useState<any[]>([]);\n  const [appliedOfferDiscount, setAppliedOfferDiscount] = useState(0);`
  );
}

// 2. Set stallOffers in API response
code = code.replace(
  /setStallOfferMax\(res\.data\.active_offer_max \? parseFloat\(res\.data\.active_offer_max\) : 0\);/g,
  `setStallOfferMax(res.data.active_offer_max ? parseFloat(res.data.active_offer_max) : 0);\n            setStallOffers(res.data.offers || []);`
);

// 3. Update discount calculation logic
const oldCalc = `  let discountAmount = 0;
  if (stallOfferIsActive && stallOfferDiscount > 0 && baseItemTotal >= stallOfferMin) {
    discountAmount = Math.round(baseItemTotal * (stallOfferDiscount / 100));
    if (stallOfferMax > 0 && discountAmount > stallOfferMax) {
      discountAmount = stallOfferMax;
    }
  }`;

const newCalc = `  let discountAmount = 0;
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

code = code.replace(oldCalc, newCalc);

// 4. Update UI to use activeDiscountPct instead of stallOfferDiscount
code = code.replace(
  /Discount \(\{stallOfferDiscount\}\%\)/g,
  `Discount ({activeDiscountPct}%)`
);

fs.writeFileSync('swaddo-customer-app/src/app/cart/page.tsx', code);
console.log('Fixed cart discount logic');
