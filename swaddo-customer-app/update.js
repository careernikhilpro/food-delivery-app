const fs = require('fs');

let content = fs.readFileSync('src/app/stall/page.tsx', 'utf8');

// 1. Add isScrolled state
content = content.replace(
  'const [isVegMode, setIsVegMode] = useState(false);',
  'const [isVegMode, setIsVegMode] = useState(false);\n  const [isScrolled, setIsScrolled] = useState(false);'
);

// 2. Add scroll listener useEffect
content = content.replace(
  'useEffect(() => {\n    if (stallId && typeof window !== "undefined") {',
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (stallId && typeof window !== "undefined") {
);

// 3. Fix isOpen logic for dummy stalls
content = content.replace(
  "if (id === 'rest_1') return { id: 'rest_1', name: 'Subway', address: 'Patna', categories: 'Sandwich, Salads', rating: '4.2', distance: 2.6, image_url: '/categories/sandwich.png' };",
  "if (id === 'rest_1') return { id: 'rest_1', name: 'Subway', address: 'Patna', categories: 'Sandwich, Salads', rating: '4.2', distance: 2.6, image_url: '/categories/sandwich.png', isOpen: true, is_open: true };"
);
content = content.replace(
  "if (id === 'rest_2') return { id: 'rest_2', name: 'Burger King', address: 'Patna', categories: 'Burger, Fast Food', rating: '4.1', distance: 3.1, image_url: '/categories/burger.png' };",
  "if (id === 'rest_2') return { id: 'rest_2', name: 'Burger King', address: 'Patna', categories: 'Burger, Fast Food', rating: '4.1', distance: 3.1, image_url: '/categories/burger.png', isOpen: true, is_open: true };"
);

// Fix condition in hero section Clock
content = content.replace(
  '<span className={stallData.isOpen ? "text-gray-800 font-bold" : "text-red-500 font-bold"}>',
  '<span className={stallData.isOpen !== false ? "text-gray-800 font-bold" : "text-red-500 font-bold"}>'
);
content = content.replace(
  '<Clock size={14} className={stallData.isOpen ? "text-green-600" : "text-red-500"} />',
  '<Clock size={14} className={stallData.isOpen !== false ? "text-green-600" : "text-red-500"} />'
);
content = content.replace(
  "{stallData.isOpen ? \Open • \ - \\ : \Closed\}",
  "{stallData.isOpen !== false ? \Open • \ - \\ : \Closed\}"
);

// Fix condition in add button
content = content.replace(
  /\{item\.isSoldOut \|\| !stallData\?\.isOpen \? \([\s\S]*?{!stallData\?\.isOpen \? "Closed" : "Sold Out"}[\s\S]*?\) : qty === 0 \? \(/g,
  {item.isSoldOut || stallData?.isOpen === false || stallData?.is_open === false ? (
                                <div className="py-1 px-3 bg-gray-100 text-gray-500 shadow-md border border-gray-200 text-[10px] font-black text-center rounded-xl uppercase">
                                  {stallData?.isOpen === false || stallData?.is_open === false ? "Closed" : "Sold Out"}
                                </div>
                              ) : qty === 0 ? (
);

// Fix handleUpdateCartLocal checks
content = content.replace(/stallData\?\.is_open && /g, "");

// 4. Add Sticky Header to return block
const stickyHeader =       {/* Sticky Header */}
      <div className={\ixed top-0 left-0 w-full bg-white z-50 px-4 py-3 flex items-center justify-between shadow-sm transition-all duration-300 \\}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <div className="font-bold text-gray-900 text-[16px] tracking-tight">
            {stallData.name} <span className="text-gray-400 font-medium px-1">•</span> <span className="text-gray-600 font-medium text-[14px]">{stallData.prep_time || '35-45'} mins</span>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 border border-gray-100 shadow-sm">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Hero Section */};

content = content.replace('{/* Hero Section */}', stickyHeader);

fs.writeFileSync('src/app/stall/page.tsx', content);
console.log("Done");
