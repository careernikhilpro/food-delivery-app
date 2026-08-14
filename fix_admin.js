const fs = require('fs');
const filePath = 'd:/swaddoapk/swaddo-backend/src/routes/admin.routes.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix pending query
content = content.replace(
    '        JOIN users u ON c.rider_id = u.id\n        WHERE c.status = \\'pending\\'',
    '        JOIN delivery_partners dp ON c.delivery_partner_id = dp.id\n        JOIN users u ON dp.user_id = u.id\n        WHERE c.status = \\'pending\\''
);

// Fix history query
content = content.replace(
    '        JOIN users u ON c.rider_id = u.id\n        WHERE c.status IN (\\'approved\\', \\'rejected\\')',
    '        JOIN delivery_partners dp ON c.delivery_partner_id = dp.id\n        JOIN users u ON dp.user_id = u.id\n        WHERE c.status IN (\\'approved\\', \\'rejected\\')'
);

// Fix approve query
content = content.replace(
    '          AND da.delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id =  LIMIT 1)\n          AND da.status = \\'completed\\'\n          AND da.cashed_out = false\n          AND (o.payment_method != \\'cod\\' OR da.cash_deposited = true)\n      \, [cashout.rider_id]);',
    '          AND da.delivery_partner_id = \n          AND da.status = \\'completed\\'\n          AND da.cashed_out = false\n          AND (o.payment_method != \\'cod\\' OR da.cash_deposited = true)\n      \, [cashout.delivery_partner_id]);'
);

fs.writeFileSync(filePath, content, 'utf-8');
