const fs = require('fs');
let code = fs.readFileSync('swaddo-customer-app/src/app/stall/page.tsx', 'utf8');

// Add variantModal state
code = code.replace(
  /const \[isSearchOpen, setIsSearchOpen\] = useState\(false\);/,
  'const [isSearchOpen, setIsSearchOpen] = useState(false);\n    const [variantModal, setVariantModal] = useState<any>({ isOpen: false, stallId: \'\', stallName: \'\', item: null });'
);

// Update qty calculation in renderMenuItem
code = code.replace(
  /const qty = cart\.stallId === stallId \? \(cart\.items\.find\(i => i\.id === item\.id\.toString\(\)\)\?\.quantity \|\| 0\) : 0;/,
  `const variantsInCart = cart.stallId === stallId ? cart.items.filter(i => i.id === item.id.toString() || i.id.startsWith(\`\${item.id}_\`)) : [];
      const qty = variantsInCart.reduce((sum, i) => sum + i.quantity, 0);`
);

// Update the Add/Plus button logic
code = code.replace(
  /onClick=\{\(\) => handleUpdateCartLocal\(item, 1\)\}/g,
  `onClick={() => {
                  if (item.has_variants && item.variants && item.variants.length > 0) {
                    setVariantModal({ isOpen: true, stallId: stallId as string, stallName: stallData.name, item });
                  } else {
                    handleUpdateCartLocal(item, 1);
                  }
                }}`
);

// Update the Minus button logic
code = code.replace(
  /onClick=\{\(\) => handleUpdateCartLocal\(item, -1\)\}/g,
  `onClick={() => {
                  if (item.has_variants && item.variants && item.variants.length > 0) {
                    if (variantsInCart.length === 1) {
                      updateQuantity(stallId as string, stallData.name, variantsInCart[0], -1);
                    } else {
                      alert("You have multiple variants in cart. Please manage them from the cart.");
                    }
                  } else {
                    handleUpdateCartLocal(item, -1);
                  }
                }}`
);

// Add the VariantModalComponent below the Floating MENU Button
code = code.replace(
  /<div className="fixed bottom-24 right-5 z-40">\s*<button className="w-\[56px\] h-\[56px\] bg-black text-white rounded-full flex flex-col items-center justify-center shadow-\[0_4px_15px_rgba\(0,0,0,0\.3\)\] hover:scale-105 transition-transform">\s*<BookOpen size=\{18\} className="text-gray-200 mb-0\.5" strokeWidth=\{2\} \/>\s*<span className="text-\[9px\] font-bold tracking-widest text-gray-200">MENU<\/span>\s*<\/button>\s*<\/div>/,
  `<div className="fixed bottom-24 right-5 z-40">
          <button className="w-[56px] h-[56px] bg-black text-white rounded-full flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform">
            <BookOpen size={18} className="text-gray-200 mb-0.5" strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest text-gray-200">MENU</span>
          </button>
        </div>
        {variantModal.isOpen && variantModal.item && (
          <VariantModalComponent 
            modalState={variantModal} 
            setModalState={setVariantModal} 
            updateQuantity={updateQuantity}
          />
        )}`
);

// Check if VariantModalComponent is already defined at the bottom, if not, append it
if (!code.includes('function VariantModalComponent')) {
  const modalComp = `
function VariantModalComponent({ modalState, setModalState, updateQuantity }: any) {
  const { cartItemCount } = useCart();
  const { item, stallId, stallName } = modalState;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalQty, setModalQty] = useState(1);

  const variantsList = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []);
  const selectedVariant = variantsList[selectedIndex];
  const variantId = \`\${item.id}_\${selectedVariant?.name}\`;
  
  const handleAdd = () => {
    updateQuantity(stallId, stallName, { 
      id: variantId, 
      name: \`\${item.name} (\${selectedVariant.name})\`, 
      price: Number(selectedVariant.price), 
    }, modalQty);
    setModalState({ isOpen: false, stallId: '', stallName: '', item: null });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={() => setModalState({ isOpen: false, stallId: '', stallName: '', item: null })} />
      
      {/* Floating Close Button */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-10 h-10 bg-[#2D3035] shadow-lg rounded-full flex items-center justify-center text-white cursor-pointer z-[60]" onClick={() => setModalState({ isOpen: false, stallId: '', stallName: '', item: null })}>
        <X size={18} strokeWidth={2.5} />
      </div>

      <div className={\`fixed \${cartItemCount > 0 ? 'bottom-[85px]' : 'bottom-0'} left-0 w-full bg-[#f3f4f6] rounded-t-3xl z-50 overflow-hidden flex flex-col max-h-[80vh] transition-all duration-300\`}>
        {/* Header */}
        <div className="bg-white p-4 rounded-t-3xl flex items-center gap-3 shadow-sm z-10 shrink-0 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-gray-50 border border-gray-100">
            <img src={item.image_url || item.image || "/placeholder.png"} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="font-extrabold text-[17px] text-gray-900 leading-tight">{item.name}</h3>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar pb-28">
          <h4 className="font-extrabold text-[16px] text-gray-800">Size</h4>
          <p className="text-[13px] text-gray-500 mb-3 font-medium">Select any 1</p>
          
          <div className="bg-white rounded-[16px] shadow-sm overflow-hidden border border-gray-100/60">
            {variantsList.map((v: any, i: number) => (
              <div 
                key={i} 
                onClick={() => setSelectedIndex(i)}
                className={\`flex justify-between items-center px-4 py-4 cursor-pointer transition-colors \${i !== variantsList.length - 1 ? 'border-b border-gray-100' : ''}\`}
              >
                <div className="flex items-center gap-3">
                  <div className={\`shrink-0 w-[14px] h-[14px] border-[1.5px] flex items-center justify-center rounded-[3px] \${item.is_veg ? 'border-[#00A14F]' : 'border-[#8B3A1A]'}\`}>
                    <div className={\`w-1.5 h-1.5 rounded-full \${item.is_veg ? 'bg-[#00A14F]' : 'bg-[#8B3A1A]'}\`}></div>
                  </div>
                  <span className="font-bold text-[15px] text-gray-800">{v.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[14px] text-gray-600">&#8377;{v.price}</span>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${selectedIndex === i ? 'border-[#00A14F]' : 'border-gray-300'}\`}>
                    {selectedIndex === i && <div className="w-2.5 h-2.5 bg-[#00A14F] rounded-full"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Fixed Bar */}
        <div className="absolute bottom-0 left-0 w-full bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center gap-4 z-20">
          <div className="h-[48px] w-[110px] rounded-full flex items-center justify-between border-2 border-[#d94696] px-1 bg-white">
            <button 
              onClick={() => setModalQty(Math.max(1, modalQty - 1))}
              className="w-10 h-full flex items-center justify-center text-[#d94696] hover:bg-pink-50 transition-colors rounded-l-full"
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="font-black text-[16px] text-gray-800">{modalQty}</span>
            <button 
              onClick={() => setModalQty(modalQty + 1)}
              className="w-10 h-full flex items-center justify-center text-[#d94696] hover:bg-pink-50 transition-colors rounded-r-full"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 h-[48px] bg-primary text-white font-bold text-[16px] rounded-2xl flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
          >
            Add item
          </button>
        </div>
      </div>
    </>
  );
}

`;

  code = code.replace(/export default function StallDetail\(\) \{/, modalComp + 'export default function StallDetail() {');
}

fs.writeFileSync('swaddo-customer-app/src/app/stall/page.tsx', code);
console.log('Patched variants completely');
