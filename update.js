const fs = require('fs');
const filePath = 'd:/swaddoapk/swaddo-merchant-app/src/app/profile/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const fields = ['fssai_license', 'gst_number', 'bank_account_name', 'bank_account_number', 'bank_ifsc', 'pan_number', 'aadhaar_number'];

for (const field of fields) {
    const pattern = new RegExp('(<input\\s+type="text"\\s+value=\\{merchantSettings\\.' + field + '\\}.*?)className="([^"]*)"', 'gs');
    content = content.replace(pattern, (match, p1, p2) => {
        return `${p1}className={\`${p2} \${initialMerchantSettings.${field} ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}\`} disabled={!!initialMerchantSettings.${field}}`;
    });
}

// Add state to initial merchant settings
// Replace all so we don't accidentally get it nested if it was already partly replaced
content = content.replace(
    'setMerchantSettings({',
    'setInitialMerchantSettings({\n          merchant_id: myStall.merchant_id || "",\n          business_name: myStall.business_name || "",\n          fssai_license: myStall.fssai_license || "",\n          gst_number: myStall.gst_number || "",\n          bank_account_name: myStall.bank_account_name || "",\n          bank_account_number: myStall.bank_account_number || "",\n          bank_ifsc: myStall.bank_ifsc || "",\n          pan_number: myStall.pan_number || "",\n          aadhaar_number: myStall.aadhaar_number || ""\n        });\n        setMerchantSettings({'
);

// We need to undo the duplicate setInitialMerchantSettings if it happened 
content = content.replace(/setInitialMerchantSettings\(\{.*?\}\);\s+setInitialMerchantSettings\(\{/gs, 'setInitialMerchantSettings({');

fs.writeFileSync(filePath, content, 'utf-8');
