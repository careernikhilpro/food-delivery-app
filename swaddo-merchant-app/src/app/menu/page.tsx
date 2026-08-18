"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Check, X, Camera, ChevronDown, ChevronUp, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import useSWR from "swr";

const PRESET_CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts", "Snacks", "Chaat", "Combos", "Custom"];
const PRESET_TAGS = ["Bestseller", "Chef's Special", "New", "Spicy", "Healthy"];

export default function MenuPage() {
  useAuth();
  const [items, setItems] = useState<any[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // For inline price editing
  const [editingItemFullId, setEditingItemFullId] = useState<string | null>(null); // For full modal editing
  const [editPrice, setEditPrice] = useState("");

  // Advanced Form State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [hasAddons, setHasAddons] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "Starters",
    customCategory: "",
    dietaryType: "veg", // veg, non-veg, egg
    inStock: true,
    variants: [{ name: "", price: "" }],
    addons: [{ name: "", price: "" }],
    prepTime: "",
    tags: [] as string[],
    discountPercentage: "",
    image_url: "" 
  });
  const [isUploading, setIsUploading] = useState(false);

  const { data: stallData } = useSWR('/stalls/merchant/my-stall', async (url) => {
    const res = await api.get(url);
    return res.data;
  });
  
  const stallId = stallData?.id || null;

  const { data: menuData, error, isLoading: isMenuLoading, mutate: mutateMenu } = useSWR(
    stallId ? `/stalls/${stallId}/menu/all` : null,
    async (url) => {
      const res = await api.get(url);
      return res.data;
    },
    { revalidateOnFocus: true }
  );

  useEffect(() => {
    if (menuData) {
      setItems(menuData);
    }
  }, [menuData]);

  const handleAddItem = async () => {
    // 1. Calculate final category
    const finalCategory = form.category === "Custom" ? form.customCategory : form.category;
    
    // Auto-calculate base price from variants if hasVariants is true
    let finalBasePrice = parseFloat(form.basePrice) || 0;
    if (hasVariants && form.variants.length > 0) {
      const validVariantPrices = form.variants.filter(v => v.name && v.price).map(v => parseFloat(v.price) || 0);
      if (validVariantPrices.length > 0) {
        finalBasePrice = Math.min(...validVariantPrices);
      }
    }

    // 2. Prepare advanced payload (for logging/future DB migration)
    const advancedPayload = {
      name: form.name,
      description: form.description,
      price: finalBasePrice,
      category: finalCategory,
      dietary_type: form.dietaryType,
      is_available: form.inStock,
      has_variants: hasVariants,
      variants: hasVariants ? form.variants.filter(v => v.name && v.price) : [],
      has_addons: hasAddons,
      add_ons: hasAddons ? form.addons.filter(a => a.name && a.price) : [],
      prep_time_minutes: form.prepTime ? parseInt(form.prepTime) : null,
      tags: form.tags,
      has_discount: hasDiscount,
      discount_percentage: hasDiscount ? parseFloat(form.discountPercentage) : null,
      photo_urls: form.photos
    };

    console.warn("TODO: Backend schema requires migration for variants, addons, tags, discount, prep_time, photos!");
    console.log("Full Advanced Payload ready to send:", advancedPayload);

    if (!stallId) return;

    try {
      if (editingItemFullId) {
        const payload = {
          name: form.name,
          description: form.description,
          price: finalBasePrice,
          is_veg: form.dietaryType === "veg",
          is_available: form.inStock,
          category: finalCategory,
          has_variants: hasVariants,
          variants: hasVariants ? form.variants.filter(v => v.name && v.price) : [],
          image_url: form.image_url
        };
        console.log("PUT Payload sent to backend:", payload);
        const res = await api.put(`/stalls/${stallId}/menu/${editingItemFullId}`, payload);
        console.log("PUT Response from backend:", res.data);
        setItems(items.map(i => i.id.toString() === editingItemFullId ? res.data : i));
      } else {
        const payload = {
          name: form.name,
          description: form.description,
          price: finalBasePrice,
          is_veg: form.dietaryType === "veg",
          is_available: form.inStock,
          category: finalCategory,
          has_variants: hasVariants,
          variants: hasVariants ? form.variants.filter(v => v.name && v.price) : [],
          image_url: form.image_url
        };
        console.log("POST Payload sent to backend:", payload);
        const res = await api.post(`/stalls/${stallId}/menu`, payload);
        console.log("POST Response from backend:", res.data);
        setItems([res.data, ...items]);
      }
      setIsAdding(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save item: " + (err.response?.data?.message || err.message));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "e583e164f1c859f3d3f681a797a931d7";
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, image_url: data.data.url }));
      } else {
        alert("Image upload failed");
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/stalls/${stallId}/menu/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (err: any) {
      alert("Failed to delete item");
    }
  };

  const resetForm = () => {
    setForm({
      name: "", description: "", basePrice: "", category: "Starters", customCategory: "",
      dietaryType: "veg", inStock: true, variants: [{ name: "", price: "" }],
      addons: [{ name: "", price: "" }], prepTime: "", tags: [], discountPercentage: "", image_url: ""
    });
    setEditingItemFullId(null);
    setHasVariants(false);
    setHasAddons(false);
    setHasDiscount(false);
    setShowAdvanced(false);
  };

  const updateItem = async (id: number, updates: any) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    try {
      await api.put(`/stalls/${stallId}/menu/${id}`, updates);
    } catch (err) {
      console.error(err);
      fetchStallAndMenu();
    }
  };
  const handleSaveEdit = async (itemId: string) => {
    if (!stallId) return;
    try {
      const res = await api.put(`/stalls/${stallId}/menu/${itemId}`, {
        price: parseFloat(editPrice)
      });
      setItems(items.map(item => item.id === itemId ? { ...item, price: res.data.price } : item));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStock = async (item: any) => {
    if (!stallId) return;
    try {
      const newStatus = !item.is_available;
      const res = await api.put(`/stalls/${stallId}/menu/${item.id}`, {
        is_available: newStatus
      });
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: res.data.is_available } : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!stallId) return;
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/stalls/${stallId}/menu/${itemId}`);
      setItems(items.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
      fetchStallAndMenu();
    }
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  // Group items by category
  const groupedItems = items.reduce((acc: any, item: any) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] bg-slate-50 relative max-w-md mx-auto w-full overflow-hidden">
      
      {/* Premium Header */}
      <div className="pt-10 px-6 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Menu Manager</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Control your offerings & availability</p>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 px-6 py-4 bg-slate-50/90 backdrop-blur-sm sticky top-[98px] z-20">
        {Object.keys(groupedItems).map(cat => (
          <a key={cat} href={`#cat-${cat}`} className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-[13px] rounded-full whitespace-nowrap transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
            {cat}
          </a>
        ))}
      </div>

      {/* Menu List */}
      <div className="flex-1 px-6 space-y-10 w-full overflow-y-auto pb-32 pt-2 max-w-md mx-auto">
        {(!menuData && isMenuLoading) && (
          <div className="space-y-4 mt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-24 animate-pulse"></div>
            ))}
          </div>
        )}

        {(menuData && Object.keys(groupedItems).length === 0 && !isAdding) && (
          <div className="flex flex-col items-center justify-center mt-32 opacity-50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
               <Edit2 size={32} className="text-slate-400" />
            </div>
            <p className="text-center font-bold text-xl text-slate-800">No items yet</p>
            <p className="text-center text-sm text-slate-500 mt-2 max-w-[200px]">Tap the + button below to add your first delicious dish.</p>
          </div>
        )}

        {(menuData && Object.keys(groupedItems).length > 0) && Object.keys(groupedItems).map(cat => (
          <div key={cat} id={`cat-${cat}`} className="scroll-mt-[160px]">
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight">{cat}</h2>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">{groupedItems[cat].length}</span>
            </div>
            
            <div className="space-y-5">
              {groupedItems[cat].map((item: any) => (
                <div key={item.id} className={`bg-white rounded-3xl p-3.5 flex gap-4 transition-all duration-300 ${item.is_available ? 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]' : 'border-slate-200 bg-slate-50 opacity-60 grayscale-[0.3]'}`}>
                  
                  {/* Image Section */}
                  <div className="w-[100px] flex flex-col shrink-0 relative">
                    <div className="w-[100px] h-[100px] rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-extrabold text-slate-300 text-3xl">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 flex flex-col py-1 justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        {/* Veg/Non-Veg Tag & Title */}
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-3.5 h-3.5 rounded-[4px] border-2 flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-600' : 'border-[#8B3A1A]'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-[#8B3A1A]'}`}></div>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-base leading-tight pr-1 truncate max-w-[130px]">{item.name}</h3>
                        </div>
                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1 -mt-1 -mr-1">
                          <button onClick={() => { 
                            setForm({
                              name: item.name,
                              description: item.description || "",
                              basePrice: item.price.toString(),
                              category: ["Starters", "Main Course", "Breads", "Desserts", "Beverages"].includes(item.category) ? item.category : "Custom",
                              customCategory: ["Starters", "Main Course", "Breads", "Desserts", "Beverages"].includes(item.category) ? "" : item.category,
                              dietaryType: item.is_veg ? "veg" : "non-veg",
                              inStock: item.is_available,
                              variants: item.has_variants && item.variants ? item.variants : [{ name: "", price: "" }],
                              addons: item.has_addons && item.addons ? item.addons : [{ name: "", price: "" }],
                              prepTime: item.prep_time_minutes ? item.prep_time_minutes.toString() : "",
                              tags: item.tags || [],
                              discountPercentage: item.discount_percentage ? item.discount_percentage.toString() : "",
                              image_url: item.image_url || ""
                            });
                            setEditingItemFullId(item.id.toString());
                            setHasVariants(item.has_variants || false);
                            setHasAddons(item.has_addons || false);
                            setIsAdding(true);
                          }} className="p-1.5 text-slate-400 hover:text-accent hover:bg-orange-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.has_variants ? (
                          <span className="font-bold text-accent text-[12px] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Multiple Sizes</span>
                        ) : (
                          <span className="font-black text-slate-900 text-[15px]">₹{item.price}</span>
                        )}
                        {item.discount_percentage && (
                           <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-md">-{item.discount_percentage}%</span>
                        )}
                      </div>
                      
                      <p className="text-[12px] text-slate-500 line-clamp-2 mt-1.5 leading-snug font-medium max-w-[180px]">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    {/* Footer toggles */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.is_available ? 'Available' : 'Hidden'}</span>
                      <button onClick={() => toggleStock(item)}
                              className={`relative inline-flex h-[22px] w-10 items-center rounded-full transition-colors duration-300 ${item.is_available ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${item.is_available ? 'translate-x-5' : 'translate-x-1'}`}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsAdding(true)} 
        className="fixed bottom-24 right-6 w-[60px] h-[60px] bg-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(15,23,42,0.3)] hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={30} className="drop-shadow-sm" />
      </button>

      {/* Add/Edit Item Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] flex justify-center items-end sm:items-center bg-black/60 p-0 sm:p-6 transition-opacity">
          <div className="bg-bg-alt w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-white shrink-0 shadow-sm z-10 relative">
              <h2 className="font-heading font-bold text-xl text-text-primary">{editingItemFullId ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* BASIC DETAILS */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Basic Details</h3>
                
                {/* Dietary Type */}
                <div className="flex gap-3">
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'veg' ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'veg'} onChange={() => setForm({...form, dietaryType: 'veg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-green-600 rounded-[3px] flex items-center justify-center"><div className="w-2 h-2 bg-green-600 rounded-full"></div></div>
                    <span className="font-bold text-sm text-green-800">Veg</span>
                  </label>
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'non-veg' ? 'bg-red-50 border-[#8B3A1A] shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'non-veg'} onChange={() => setForm({...form, dietaryType: 'non-veg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-[#8B3A1A] rounded-[3px] flex items-center justify-center"><div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-[#8B3A1A]"></div></div>
                    <span className="font-bold text-sm text-[#8B3A1A]">Non-Veg</span>
                  </label>
                  <label className={`flex-1 border p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${form.dietaryType === 'egg' ? 'bg-yellow-50 border-yellow-500 shadow-sm' : 'bg-white border-border-subtle hover:border-gray-300'}`}>
                    <input type="radio" name="dietary" checked={form.dietaryType === 'egg'} onChange={() => setForm({...form, dietaryType: 'egg'})} className="hidden" />
                    <div className="w-4 h-4 border-2 border-yellow-600 rounded-[3px] flex items-center justify-center"><div className="w-2 h-2 bg-yellow-600 rounded-full"></div></div>
                    <span className="font-bold text-sm text-yellow-800">Egg</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Item Name *</label>
                  <input type="text" placeholder="e.g. Paneer Tikka" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Base Price (₹) *</label>
                    <input type="number" placeholder="e.g. 150" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Category *</label>
                    <div className="relative">
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white appearance-none transition-colors">
                        {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {form.category === "Custom" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Custom Category Name *</label>
                    <input type="text" placeholder="e.g. Chef's Specials" value={form.customCategory} onChange={e => setForm({...form, customCategory: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white transition-colors" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Short Description</label>
                  <textarea placeholder="e.g. Delicious grilled cottage cheese marinated in spices..." rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-border-subtle p-3.5 rounded-xl text-sm outline-none focus:border-accent bg-white resize-none transition-colors" />
                </div>

                {/* Single Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-2">Item Photo</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {form.image_url ? (
                      <div className="w-24 h-24 rounded-xl border border-border-subtle bg-gray-100 shrink-0 relative overflow-hidden group shadow-sm">
                        <img src={form.image_url} alt="Item Photo" className="w-full h-full object-cover" />
                        <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 flex flex-col items-center justify-center shrink-0 hover:border-accent hover:text-accent transition-colors hover:bg-orange-50 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        {isUploading ? (
                          <Loader2 size={24} className="mb-1.5 opacity-80 animate-spin" />
                        ) : (
                          <Camera size={24} className="mb-1.5 opacity-80" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{isUploading ? 'Uploading' : 'Add Photo'}</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Stock Toggle inside form */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl mt-4">
                  <span className="text-sm font-bold text-text-primary">Currently In Stock?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({...form, inStock: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                  </label>
                </div>
              </div>

              {/* ADVANCED OPTIONS ACCORDION */}
              <div className="border border-border-subtle rounded-2xl bg-white overflow-hidden shadow-sm">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-5 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors border-b border-transparent">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-text-primary text-sm mb-0.5">Advanced Options</span>
                    <span className="text-xs text-text-muted">Variants, Add-ons, Tags, Discount & Prep Time</span>
                  </div>
                  <div className={`p-1.5 rounded-full bg-white border border-gray-200 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </button>

                {showAdvanced && (
                  <div className="p-5 space-y-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Variants */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-text-primary">Does this item come in different sizes?</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {hasVariants && (
                        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {form.variants.map((v, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input type="text" placeholder="Size (e.g. Half)" value={v.name} onChange={e => { const newV = [...form.variants]; newV[i].name = e.target.value; setForm({...form, variants: newV}); }} className="flex-1 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <input type="number" placeholder="Price (₹)" value={v.price} onChange={e => { const newV = [...form.variants]; newV[i].price = e.target.value; setForm({...form, variants: newV}); }} className="w-24 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <button onClick={() => setForm({...form, variants: form.variants.filter((_, idx) => idx !== i)})} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200"><X size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => setForm({...form, variants: [...form.variants, {name: "", price: ""}]})} className="text-accent text-sm font-bold flex items-center gap-1.5 hover:underline mt-3"><Plus size={16} /> Add Size</button>
                        </div>
                      )}
                    </div>

                    {/* Add-ons */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-text-primary">Add extra options for this item?</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={hasAddons} onChange={(e) => setHasAddons(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {hasAddons && (
                        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {form.addons.map((a, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input type="text" placeholder="Add-on (e.g. Extra Cheese)" value={a.name} onChange={e => { const newA = [...form.addons]; newA[i].name = e.target.value; setForm({...form, addons: newA}); }} className="flex-1 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <input type="number" placeholder="+₹" value={a.price} onChange={e => { const newA = [...form.addons]; newA[i].price = e.target.value; setForm({...form, addons: newA}); }} className="w-20 border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                              <button onClick={() => setForm({...form, addons: form.addons.filter((_, idx) => idx !== i)})} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200"><X size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => setForm({...form, addons: [...form.addons, {name: "", price: ""}]})} className="text-accent text-sm font-bold flex items-center gap-1.5 hover:underline mt-3"><Plus size={16} /> Add Add-on</button>
                        </div>
                      )}
                    </div>

                    {/* Discount & Prep Time */}
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-text-primary">Apply Discount?</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="sr-only peer" />
                            <div className="w-7 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-[14px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        {hasDiscount && (
                          <div className="mt-2 animate-in fade-in">
                            <input type="number" placeholder="% Off" value={form.discountPercentage} onChange={e => setForm({...form, discountPercentage: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent mb-1.5 bg-white" />
                            {form.basePrice && form.discountPercentage && (
                              <p className="text-[10px] text-text-muted font-medium bg-green-50 text-green-700 px-2 py-1 rounded">
                                Prev: <span className="line-through">₹{form.basePrice}</span> → <span className="font-bold">₹{Math.max(0, parseFloat(form.basePrice) * (1 - parseFloat(form.discountPercentage)/100)).toFixed(0)}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-text-primary mb-2">Prep Time</label>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Mins" value={form.prepTime} onChange={e => setForm({...form, prepTime: e.target.value})} className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-accent bg-white" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-tight">Leave blank for stall default</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-3">Item Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_TAGS.map(tag => {
                          const isSelected = form.tags.includes(tag);
                          return (
                            <button 
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${isSelected ? 'bg-orange-50 text-accent border-accent shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                              {isSelected && <span className="mr-1">Γ£ô</span>}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-border-subtle bg-white shrink-0 flex justify-end gap-3 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="px-6 py-3.5 rounded-xl font-bold text-text-muted hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleAddItem} disabled={!form.name || (!form.basePrice && (!hasVariants || !form.variants.some(v => v.name && v.price)))} className="px-8 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-yellow-600 shadow-md transition-all disabled:opacity-50 disabled:shadow-none">
                {editingItemFullId ? "Save Changes" : "Save Item"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
