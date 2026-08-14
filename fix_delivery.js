const fs = require('fs');
const filePath = 'd:/swaddoapk/swaddo-backend/src/routes/delivery.routes.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const replaceStrProfile = \      const calcRes = await pool.query(\\\
        SELECT SUM(earnings_amount) as total 
        FROM delivery_assignments 
        WHERE delivery_partner_id = \\\ AND status = 'completed' AND cashed_out = false
      \\\, [partnerId]);
      
      const pendingRes = await pool.query(\\\
        SELECT SUM(amount) as pending_total
        FROM cashout_requests
        WHERE delivery_partner_id = \\\ AND status = 'pending'
      \\\, [partnerId]);

      const rawAvailable = parseFloat(calcRes.rows[0].total || '0');
      const pendingAmount = parseFloat(pendingRes.rows[0].pending_total || '0');
      const availableCashout = Math.max(0, rawAvailable - pendingAmount);\;

content = content.replace(
    /      const calcRes = await pool\.query\(\\n        SELECT SUM\(earnings_amount\) as total \n        FROM delivery_assignments \n        WHERE delivery_partner_id = \ AND status = 'completed' AND cashed_out = false\n      \, \[partnerId\]\);\n      const availableCashout = parseFloat\(calcRes\.rows\[0\]\.total \|\| '0'\);/g,
    replaceStrProfile
);

const replaceStrRequest = \      const calcRes = await pool.query(\\\
        SELECT SUM(earnings_amount) as total 
        FROM delivery_assignments 
        WHERE delivery_partner_id = \\\ AND status = 'completed' AND cashed_out = false
      \\\, [partnerId]);
      
      const pendingRes = await pool.query(\\\
        SELECT SUM(amount) as pending_total
        FROM cashout_requests
        WHERE delivery_partner_id = \\\ AND status = 'pending'
      \\\, [partnerId]);

      const rawAvailable = parseFloat(calcRes.rows[0].total || '0');
      const pendingAmount = parseFloat(pendingRes.rows[0].pending_total || '0');
      const availableAmount = Math.max(0, rawAvailable - pendingAmount);\;

content = content.replace(
    /      const calcRes = await pool\.query\(\\n        SELECT SUM\(earnings_amount\) as total \n        FROM delivery_assignments \n        WHERE delivery_partner_id = \ AND status = 'completed' AND cashed_out = false\n      \, \[partnerId\]\);\n      \n      const availableAmount = parseFloat\(calcRes\.rows\[0\]\.total \|\| '0'\);/g,
    replaceStrRequest
);

fs.writeFileSync(filePath, content, 'utf-8');
