const fs = require('fs');
const path = require('path');
const p = path.resolve('src/routes/admin.routes.ts');
let content = fs.readFileSync(p, 'utf8');

const newRoutes = \
// Admin Vendor Profile Override
router.patch('/vendors/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { fssai_license, gst_number, pan_number, aadhaar_number, bank_account_name, bank_account_number, bank_ifsc } = req.body;
    const result = await pool.query(
      'UPDATE vendors SET fssai_license=, gst_number=, pan_number=, aadhaar_number=, bank_account_name=, bank_account_number=, bank_ifsc= WHERE id= RETURNING *',
      [fssai_license, gst_number, pan_number, aadhaar_number, bank_account_name, bank_account_number, bank_ifsc, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update vendor profile error', err);
    res.status(500).json({ message: 'Error updating vendor profile' });
  }
});

// Get all Campaign Requests
router.get('/campaigns', async (req, res) => {
  try {
    const result = await pool.query(\
      SELECT c.*, v.business_name, s.name as stall_name 
      FROM campaign_requests c
      JOIN vendors v ON c.vendor_id = v.id
      JOIN stalls s ON c.stall_id = s.id
      ORDER BY c.created_at DESC
    \);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get campaigns error', err);
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
});

// Update Campaign Status
router.patch('/campaigns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE campaign_requests SET status = , updated_at = NOW() WHERE id =  RETURNING *", 
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update campaign status error', err);
    res.status(500).json({ message: 'Error updating campaign status' });
  }
});

// Get Active Store Offers
router.get('/offers', async (req, res) => {
  try {
    const result = await pool.query(\
      SELECT s.id, s.name as stall_name, v.business_name,
             s.active_offer_title, s.active_offer_discount, 
             s.active_offer_min, s.active_offer_max, s.active_offer_is_active
      FROM stalls s
      JOIN vendors v ON s.vendor_id = v.id
      WHERE s.active_offer_title IS NOT NULL
      ORDER BY s.id DESC
    \);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get offers error', err);
    res.status(500).json({ message: 'Error fetching active offers' });
  }
});

\;

content = content.replace('export default router;', newRoutes + 'export default router;');
fs.writeFileSync(p, content);
console.log('Successfully appended routes to admin.routes.ts');
