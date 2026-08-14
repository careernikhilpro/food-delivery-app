import re

file_path = r'd:\swaddoapk\swaddo-merchant-app\src\app\profile\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

fields = ['fssai_license', 'gst_number', 'bank_account_name', 'bank_account_number', 'bank_ifsc', 'pan_number', 'aadhaar_number']

for field in fields:
    # Match the entire input tag
    pattern = r'(<input\s+type="text"\s+value=\{merchantSettings\.' + field + r'\}.*?className=")([^"]*)(")'
    def repl(m):
        return f"{m.group(1)}{m.group(2)} {{initialMerchantSettings.{field} ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}}{m.group(3)} disabled={{!!initialMerchantSettings.{field}}}"
    content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
