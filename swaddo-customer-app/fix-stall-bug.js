const fs = require('fs');
let code = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

const badBlock = `          addons: item.addons,
            is_highlighted_offer: item.is_highlighted_offer,
            offer_price: item.offer_price
          }));
    }, [rawMenuData]);`;

const goodBlock = `          addons: item.addons,
            is_highlighted_offer: item.is_highlighted_offer,
            offer_price: item.offer_price
          }));
          
          return mapped.sort((a, b) => {
            if (a.is_highlighted_offer && !b.is_highlighted_offer) return -1;
            if (!a.is_highlighted_offer && b.is_highlighted_offer) return 1;
            if (a.offer_price && !b.offer_price) return -1;
            if (!a.offer_price && b.offer_price) return 1;
            return 0;
          });
    }, [rawMenuData]);`;

if (code.includes(badBlock)) {
  code = code.replace(badBlock, goodBlock);
  fs.writeFileSync('src/app/stall/page.tsx', code);
  console.log('Fixed useMemo return bug');
} else {
  console.log('Bad block not found, trying regex');
  
  const regex = /offer_price:\s*item\.offer_price\s*\}\)\);\s*\}, \[rawMenuData\]\);/
  if (code.match(regex)) {
    code = code.replace(regex, `offer_price: item.offer_price
          }));
          
          return mapped.sort((a, b) => {
            if (a.is_highlighted_offer && !b.is_highlighted_offer) return -1;
            if (!a.is_highlighted_offer && b.is_highlighted_offer) return 1;
            if (a.offer_price && !b.offer_price) return -1;
            if (!a.offer_price && b.offer_price) return 1;
            return 0;
          });
    }, [rawMenuData]);`);
    fs.writeFileSync('src/app/stall/page.tsx', code);
    console.log('Fixed useMemo return bug with regex');
  } else {
    console.log('Could not fix');
  }
}
