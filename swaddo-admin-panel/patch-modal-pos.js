const fs = require('fs');
let code = fs.readFileSync('src/app/vendors/page.tsx', 'utf8');

const modalClassOld = `className="absolute inset-x-0 bottom-0 bg-bg-alt border border-border-subtle shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 rounded-t-3xl z-30 max-h-[80vh] overflow-y-auto"`;
const modalClassNew = `className="fixed bottom-0 right-0 w-full md:w-[600px] bg-bg-alt border border-border-subtle shadow-[0_-20px_60px_rgba(0,0,0,0.2)] p-6 rounded-t-3xl z-[100] max-h-[85vh] overflow-y-auto"`;

if (code.includes(modalClassOld)) {
  code = code.replace(modalClassOld, modalClassNew);
  fs.writeFileSync('src/app/vendors/page.tsx', code);
  console.log('Successfully fixed modal positioning');
} else {
  console.log('Could not find modal class');
}
