const fs = require('fs');
let code = fs.readFileSync('src/routes/stalls.routes.ts', 'utf8');

const badQuery = `ORDER BY m.is_highlighted_offer DESC, m.updated_at DESC`;
const goodQuery = `ORDER BY m.is_highlighted_offer DESC, m.id DESC`;

if (code.includes(badQuery)) {
  code = code.replace(badQuery, goodQuery);
  fs.writeFileSync('src/routes/stalls.routes.ts', code);
  console.log('Fixed query');
} else {
  console.log('Could not find bad query');
}
