const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

// Update sorting logic inside rawMenuData useMemo
const oldSort = `return rawMenuData.map((item) => ({`;
const newSort = `const mapped = rawMenuData.map((item) => ({`;

if (code.includes(oldSort)) {
  code = code.replace(oldSort, newSort);
  
  // replace closing bracket of map
  const oldMapClose = `offer_price: item.offer_price
        }));
    }, [rawMenuData]);`;
  
  const newMapClose = `offer_price: item.offer_price
        }));
        
        return mapped.sort((a, b) => {
          if (a.is_highlighted_offer && !b.is_highlighted_offer) return -1;
          if (!a.is_highlighted_offer && b.is_highlighted_offer) return 1;
          if (a.offer_price && !b.offer_price) return -1;
          if (!a.offer_price && b.offer_price) return 1;
          return 0;
        });
    }, [rawMenuData]);`;

  code = code.replace(oldMapClose, newMapClose);
}

// Update price calculation to 20% over base price
const oldPriceCalc = `const originalBasePrice = Number(item.price) + itemMarkup;
      let basePrice = originalBasePrice;
      if (item.offer_price) {
        basePrice = Number(item.offer_price) + itemMarkup;
      } else if (item.discount_percentage) {
        basePrice = Math.floor(originalBasePrice * (1 - Number(item.discount_percentage)/100));
      }
      const originalPrice = (item.offer_price || item.discount_percentage) ? originalBasePrice : Math.floor(originalBasePrice * 1.3);
      const hasOffer = !!(item.offer_price || item.discount_percentage);`;

const newPriceCalc = `const merchantPrice = Number(item.price);
      let basePrice = merchantPrice + itemMarkup;
      
      // Calculate 20% markup on original merchant price as the display original price
      const originalPrice = Math.floor(merchantPrice * 1.2);
      
      if (item.offer_price) {
        basePrice = Number(item.offer_price); // exact offer price
      } else if (item.discount_percentage) {
        basePrice = Math.floor(merchantPrice * (1 - Number(item.discount_percentage)/100));
      }
      const hasOffer = !!(item.offer_price || item.discount_percentage);`;

if (code.includes(oldPriceCalc)) {
  code = code.replace(oldPriceCalc, newPriceCalc);
}

fs.writeFileSync('src/app/stall/page.tsx', code);
console.log('Stall page patched');
