const fs = require('fs');
let code = fs.readFileSync('src/routes/orders.routes.ts', 'utf8');

const regex = /const stallRes = await client\.query\('SELECT latitude, longitude, is_open FROM stalls WHERE id = \$1', \[stallId\]\);[\s\S]*?const stallLoc = stallRes\.rows\[0\];\s*if \(\!stallLoc\.is_open\) \{\s*return res\.status\(400\)\.json\(\{ message: 'Stall is currently not accepting orders' \}\);\s*\}/;

const replacement = `const stallRes = await client.query('SELECT latitude, longitude, is_open, opening_time FROM stalls WHERE id = $1', [stallId]);
      if (stallRes.rows.length === 0) {
        return res.status(404).json({ message: \`Stall not found for ID: \${stallId}. Please check your cart or database.\` });
      }
      const stallLoc = stallRes.rows[0];
      
      if (!stallLoc.is_open) {
        const openTime = stallLoc.opening_time || 'later';
        return res.status(400).json({ message: \`Store closed, come at \${openTime}\` });
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/routes/orders.routes.ts', code);
  console.log('Patched orders backend for opening_time');
} else {
  console.log('Regex did not match for orders backend');
}
