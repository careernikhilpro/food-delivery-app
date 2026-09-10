const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// 1. Fix the stray `)}` below "Other apps"
code = code.replace(
  /Other apps: &#8377;\{otherAppPrice\}<\/span>\s*<\/div>\s*\)\}/g,
  `Other apps: &#8377;{otherAppPrice}</span>\n            </div>`
);

// 2. Fix the Variant Logic:
// The issue was checking `item.has_variants`, which is often false because Admin panel doesn't set it.
// We should check `const parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []);`
// and then `parsedVariants.length > 0`.

// Replace Plus button onClick
code = code.replace(
  /onClick=\{\(\) => \{\s*if \(item\.has_variants && item\.variants && item\.variants\.length > 0\) \{/g,
  `onClick={() => {
                  const parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []);
                  if (parsedVariants.length > 0) {`
);

// Replace Minus button onClick
code = code.replace(
  /onClick=\{\(\) => \{\s*if \(item\.has_variants && item\.variants && item\.variants\.length > 0\) \{/g,
  `onClick={() => {
                  const parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []);
                  if (parsedVariants.length > 0) {`
);

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Fixed stray brace and variant logic');
