"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Store, Search, Phone, FileText, X, Coffee, Plus, Edit2, Trash2, Clock, Percent, Key, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [vendorDetails, setVendorDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Menu Form State
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showStallEditModal, setShowStallEditModal] = useState(false);
  const [editingStall, setEditingStall] = useState<any | null>(null);
  const [stallFormData, setStallFormData] = useState({ rating: "", prep_time: "", commission_rate: "" });
  const [activeStallId, setActiveStallId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // UI Toggles for Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [hasAddons, setHasAddons] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "Main Course",
    price: "",
    variants: [{ name: "", price: "" }] as {name: string, price: string}[],
    prep_time_minutes: "",
    discount_percentage: "",
    is_veg: true,
    is_available: true,
    addons: [{ name: "", price: "" }] as {name: string, price: string}[]
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleStatusToggle = async (vendorId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/vendors/${vendorId}/status`, { status: newStatus });
      fetchVendors();
      toast.success(`Vendor marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleDeleteVendor = async (vendorId: number) => {
    if (!window.confirm("Are you sure you want to delete this vendor and all their stalls, menu items, and past orders? This action cannot be undone.")) {
      return;
    }
    
    try {
      await api.delete(`/admin/vendors/${vendorId}`);
      toast.success("Vendor and all related data deleted successfully");
      fetchVendors();
    } catch (error) {
      toast.error("Failed to delete vendor");
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data);
    } catch (error) {
      console.log("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (vendor: any) => {
    setSelectedVendor(vendor);
    refreshVendorDetails(vendor.id);
  };

  const refreshVendorDetails = async (vendorId: string) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/vendors/${vendorId}/details`);
      setVendorDetails(res.data);
    } catch (err) {
      console.log("Failed to fetch vendor details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/stalls/${editingStall.id}`, stallFormData);
      setShowStallEditModal(false);
      setEditingStall(null);
      if (selectedVendor) {
        refreshVendorDetails(selectedVendor.id);
      }
    } catch (err) {
      console.error('Error updating stall:', err);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", category: "Main Course", price: "", 
      variants: [{ name: "", price: "" }], prep_time_minutes: "", 
      discount_percentage: "", is_veg: true, is_available: true, addons: [{ name: "", price: "" }]
    });
    setHasSizes(false);
    setHasAddons(false);
    setHasDiscount(false);
    setShowAdvanced(false);
    setEditingItem(null);
    setShowItemForm(false);
  };

  // Dynamic Handlers
  const addVariant = () => setFormData({ ...formData, variants: [...formData.variants, { name: "", price: "" }] });
  const removeVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };
  const updateVariant = (index: number, field: 'name'|'price', value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const addAddon = () => setFormData({ ...formData, addons: [...formData.addons, { name: "", price: "" }] });
  const removeAddon = (index: number) => {
    const newAddons = [...formData.addons];
    newAddons.splice(index, 1);
    setFormData({ ...formData, addons: newAddons });
  };
  const updateAddon = (index: number, field: 'name'|'price', value: string) => {
    const newAddons = [...formData.addons];
    newAddons[index][field] = value;
    setFormData({ ...formData, addons: newAddons });
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) {
      return toast.error("Name and Regular price are required");
    }
    
    setSubmitting(true);
    try {
      // Clean up fields based on toggles. Only send variants/addons that have both a name and price
      const cleanVariants = hasSizes ? formData.variants.filter(v => v.name.trim() !== '' && v.price !== '').map(v => ({ name: v.name, price: Number(v.price) })) : [];
      const cleanAddons = hasAddons ? formData.addons.filter(a => a.name.trim() !== '' && a.price !== '').map(a => ({ name: a.name, price: Number(a.price) })) : [];

      const payload = {
        ...formData,
        price: Number(formData.price),
        variants: cleanVariants,
        addons: cleanAddons,
        prep_time_minutes: formData.prep_time_minutes ? Number(formData.prep_time_minutes) : 15,
        discount_percentage: hasDiscount && formData.discount_percentage ? Number(formData.discount_percentage) : 0,
      };

      if (editingItem) {
        await api.put(`/admin/vendors/menu/${editingItem.id}`, payload);
        toast.success("Item updated successfully");
      } else {
        await api.post(`/admin/vendors/${activeStallId}/menu`, payload);
        toast.success("Item added successfully");
      }
      resetForm();
      if (selectedVendor) refreshVendorDetails(selectedVendor.id);
    } catch (error) {
      toast.error(editingItem ? "Failed to update item" : "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/admin/vendors/menu/${itemId}`);
      toast.success("Item deleted successfully");
      if (selectedVendor) refreshVendorDetails(selectedVendor.id);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-[80vh]">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-text-primary">Vendors & Merchants</h1>
          <p className="text-text-muted mt-1 font-medium">Manage restaurant partners and their business details.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search Vendors..." 
              className="pl-10 pr-4 py-2.5 bg-bg-alt border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-primary transition-colors w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v) => (
          <div key={v.id} className="bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-border-subtle hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">{v.business_name || 'N/A'}</h3>
                  <p className="text-sm text-text-muted font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {v.phone}
                  </p>
                  <p className="text-sm text-text-muted font-medium flex items-center gap-1 mt-1">
                    <Key className="w-3 h-3" /> PIN: {v.raw_password || 'Not set'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase ${v.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                {v.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted flex items-center gap-2"><FileText size={14} /> FSSAI License</span>
                  <span className="text-sm font-semibold text-text-primary">{v.fssai_license || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted flex items-center gap-2"><FileText size={14} /> GST Number</span>
                  <span className="text-sm font-semibold text-text-primary">{v.gst_number || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted flex items-center gap-2"><FileText size={14} /> PAN Number</span>
                  <span className="text-sm font-semibold text-text-primary">{v.pan_number || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleViewDetails(v)}
                className="flex-1 py-2.5 bg-bg-main border border-border-subtle text-text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/20 rounded-xl font-bold transition-colors"
              >
                Manage Menu
              </button>
              <button 
                onClick={() => handleDeleteVendor(v.id)}
                className="px-4 py-2.5 bg-bg-main border border-border-subtle text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-bold transition-colors"
                title="Delete Vendor"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedVendor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-text-primary/20 backdrop-blur-sm z-40"
              onClick={() => { setSelectedVendor(null); setVendorDetails(null); resetForm(); }}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-bg-alt border-l border-border-subtle shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 border-b border-border-subtle sticky top-0 bg-bg-alt/90 backdrop-blur flex justify-between items-center z-20">
                <div>
                  <h2 className="text-xl font-heading font-black text-text-primary">{selectedVendor.business_name}</h2>
                  <p className="text-sm text-text-muted mt-1 flex items-center gap-1"><Phone className="w-3 h-3"/> {selectedVendor.phone}</p>
                </div>
                <button 
                  onClick={() => { setSelectedVendor(null); setVendorDetails(null); resetForm(); }}
                  className="w-10 h-10 rounded-full bg-bg-main hover:bg-border-subtle flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <div className="p-6">
                {detailsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                ) : (
                  <div className="space-y-8 relative">
                    
                    {/* Merchant KYC and Bank Info */}
                    {vendorDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-bg-main border border-border-subtle rounded-xl p-4">
                          <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-500" /> Business Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-text-muted">FSSAI:</span> <span className="font-medium text-text-primary">{vendorDetails.fssai_license || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">GSTIN:</span> <span className="font-medium text-text-primary">{vendorDetails.gst_number || '-'}</span></div>
                          </div>
                        </div>
                        <div className="bg-bg-main border border-border-subtle rounded-xl p-4">
                          <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-500" /> KYC Documents
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-text-muted">PAN:</span> <span className="font-medium text-text-primary">{vendorDetails.pan_number || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">Aadhaar:</span> <span className="font-medium text-text-primary">{vendorDetails.aadhaar_number || '-'}</span></div>
                          </div>
                        </div>
                        <div className="bg-bg-main border border-border-subtle rounded-xl p-4 md:col-span-2">
                          <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                            <span className="text-emerald-500 font-bold">₹</span> Bank Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-text-muted">Name:</span> <span className="font-medium text-text-primary">{vendorDetails.bank_account_name || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">Account No:</span> <span className="font-medium text-text-primary">{vendorDetails.bank_account_number || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">IFSC:</span> <span className="font-medium text-text-primary">{vendorDetails.bank_ifsc || '-'}</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!vendorDetails?.stalls?.length ? (
                      <p className="text-center text-text-muted p-8 bg-bg-main rounded-2xl border border-border-subtle">This vendor hasn't created any stalls yet.</p>
                    ) : (
                      vendorDetails.stalls.map((stall: any) => (
                        <div key={stall.id} className="space-y-4">
                          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Store className="w-5 h-5 text-primary" /> {stall.name}
                            <button
                              onClick={() => {
                                setEditingStall(stall);
                                setStallFormData({
                                  rating: stall.rating || "",
                                  prep_time: stall.prep_time || "",
                                  commission_rate: stall.commission_rate || "22"
                                });
                                setShowStallEditModal(true);
                              }}
                              className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Stall Settings"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <span className={`ml-auto px-2 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${stall.is_open ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                              {stall.is_open ? 'Open' : 'Closed'}
                            </span>
                          </h3>
                          <p className="text-sm text-text-muted bg-bg-main px-4 py-2 rounded-xl">{stall.location}</p>

                          <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-bg-main/50 px-4 py-3 border-b border-border-subtle flex justify-between items-center">
                              <span className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Coffee className="w-4 h-4"/> Menu Items ({stall.menu_items?.length || 0})
                              </span>
                              <button 
                                onClick={() => { 
                                  setActiveStallId(stall.id); 
                                  resetForm();
                                  setShowItemForm(true); 
                                }}
                                className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                              >
                                <Plus className="w-3 h-3" /> Add Item
                              </button>
                            </div>
                            
                            {!stall.menu_items || stall.menu_items.length === 0 ? (
                              <p className="p-6 text-center text-text-muted text-sm">No items added to this stall.</p>
                            ) : (
                              <ul className="divide-y divide-border-subtle">
                                {stall.menu_items.map((item: any) => {
                                  const itemVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : (item.variants || []);
                                  const itemAddons = typeof item.addons === 'string' ? JSON.parse(item.addons) : (item.addons || []);
                                  return (
                                  <li key={item.id} className="p-4 flex items-center justify-between hover:bg-bg-main/30 transition-colors group/item">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-sm border-2 ${item.is_veg ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'}`}>
                                        <div className={`w-1.5 h-1.5 mx-auto mt-[1px] rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-text-primary flex items-center gap-2">
                                          {item.name}
                                          {Number(item.discount_percentage) > 0 && (
                                            <span className="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                                              <Percent className="w-2.5 h-2.5" /> {item.discount_percentage}% OFF
                                            </span>
                                          )}
                                          <span className="text-[10px] text-text-muted px-2 py-0.5 border border-border-subtle rounded-md bg-bg-main uppercase tracking-wider">{item.category}</span>
                                        </p>
                                        
                                        {itemVariants.length > 0 && (
                                          <div className="text-xs text-text-muted mt-0.5 flex flex-wrap gap-2">
                                            {itemVariants.map((v: any, idx: number) => (
                                              <span key={idx}>{v.name}: ₹{v.price}</span>
                                            ))}
                                          </div>
                                        )}
                                        <div className="text-xs text-text-muted mt-0.5 flex gap-2">
                                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.prep_time_minutes} min</span>
                                        </div>

                                        <div className="flex gap-3 mt-1 items-center">
                                          <span className="font-bold text-primary text-sm">₹{item.price}</span>
                                          {item.is_available ? (
                                            <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">In Stock</span>
                                          ) : (
                                            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Out of Stock</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setActiveStallId(stall.id);
                                          setEditingItem(item);
                                          setFormData({
                                            name: item.name,
                                            category: item.category,
                                            price: item.price,
                                            variants: itemVariants.length > 0 ? itemVariants : [{name: "", price: ""}],
                                            prep_time_minutes: item.prep_time_minutes || "",
                                            discount_percentage: item.discount_percentage || "",
                                            is_veg: item.is_veg,
                                            is_available: item.is_available,
                                            addons: itemAddons.length > 0 ? itemAddons : [{name: "", price: ""}]
                                          });
                                          setHasSizes(itemVariants.length > 0);
                                          setHasAddons(itemAddons.length > 0);
                                          setHasDiscount(Number(item.discount_percentage) > 0);
                                          setShowAdvanced(itemVariants.length > 0 || itemAddons.length > 0 || Number(item.discount_percentage) > 0 || !!item.prep_time_minutes);
                                          setShowItemForm(true);
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </li>
                                )})}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    <AnimatePresence>
                      {showItemForm && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-x-0 bottom-0 bg-bg-alt border border-border-subtle shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 rounded-t-3xl z-30 max-h-[80vh] overflow-y-auto"
                        >
                          <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg-alt/90 backdrop-blur-sm z-10 py-2 border-b border-border-subtle">
                            <h3 className="text-lg font-heading font-bold text-text-primary">
                              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                            </h3>
                            <button onClick={resetForm} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-text-muted uppercase mb-1">Item Name *</label>
                              <input 
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                placeholder="e.g. Masala Dosa"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Regular Price (₹) *</label>
                                <input 
                                  type="number"
                                  value={formData.price}
                                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                  placeholder="e.g. 150"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Category</label>
                                <select 
                                  value={formData.category}
                                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                >
                                  <option value="Starters">Starters</option>
                                  <option value="Main Course">Main Course</option>
                                  <option value="Breads">Breads</option>
                                  <option value="Desserts">Desserts</option>
                                  <option value="Beverages">Beverages</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-4 pt-2 border-b border-border-subtle pb-6">
                              <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
                                <input 
                                  type="checkbox"
                                  checked={formData.is_veg}
                                  onChange={(e) => setFormData({...formData, is_veg: e.target.checked})}
                                  className="rounded text-green-600 focus:ring-green-600 h-4 w-4"
                                />
                                Pure Veg 🟢
                              </label>
                              <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
                                <input 
                                  type="checkbox"
                                  checked={formData.is_available}
                                  onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                                  className="rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                Currently Available
                              </label>
                            </div>

                            <div className="border border-border-subtle rounded-2xl overflow-hidden bg-bg-main">
                              <button 
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full p-4 flex items-center justify-between bg-white hover:bg-bg-alt transition-colors"
                              >
                                <div className="text-left">
                                  <h4 className="font-bold text-text-primary text-sm">Advanced Options</h4>
                                  <p className="text-xs text-text-muted mt-0.5">Variants, Add-ons, Tags, Discount & Prep Time</p>
                                </div>
                                <div className={`w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                </div>
                              </button>

                              <AnimatePresence>
                                {showAdvanced && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white"
                                  >
                                    <div className="p-5 border-t border-border-subtle space-y-8">
                                      
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <label className="text-sm font-bold text-text-primary">Does this item come in different sizes?</label>
                                          <button 
                                            type="button"
                                            onClick={() => setHasSizes(!hasSizes)}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${hasSizes ? 'bg-primary' : 'bg-gray-200'}`}
                                          >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${hasSizes ? 'left-[22px]' : 'left-0.5'}`} />
                                          </button>
                                        </div>
                                        
                                        <AnimatePresence>
                                          {hasSizes && (
                                            <motion.div 
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="bg-bg-main rounded-xl p-4 border border-border-subtle space-y-3">
                                                {formData.variants.map((variant, idx) => (
                                                  <div key={idx} className="flex gap-3 items-center group/variant">
                                                    <input 
                                                      type="text" 
                                                      placeholder="e.g. Half Plate" 
                                                      value={variant.name}
                                                      onChange={e => updateVariant(idx, 'name', e.target.value)}
                                                      className="flex-1 px-4 py-2 bg-white border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-primary" 
                                                    />
                                                    <input 
                                                      type="number" 
                                                      placeholder="Price" 
                                                      value={variant.price}
                                                      onChange={e => updateVariant(idx, 'price', e.target.value)}
                                                      className="w-24 px-4 py-2 bg-white border border-border-subtle rounded-lg text-sm focus:outline-primary" 
                                                    />
                                                    {formData.variants.length > 1 && (
                                                      <button 
                                                        onClick={() => removeVariant(idx)}
                                                        className="text-red-500 hover:text-red-700 opacity-0 group-hover/variant:opacity-100 transition-opacity p-2"
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                                <button onClick={addVariant} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline mt-2">
                                                  <Plus className="w-4 h-4" /> Add Size
                                                </button>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <label className="text-sm font-bold text-text-primary">Add extra options for this item?</label>
                                          <button 
                                            type="button"
                                            onClick={() => setHasAddons(!hasAddons)}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${hasAddons ? 'bg-primary' : 'bg-gray-200'}`}
                                          >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${hasAddons ? 'left-[22px]' : 'left-0.5'}`} />
                                          </button>
                                        </div>
                                        
                                        <AnimatePresence>
                                          {hasAddons && (
                                            <motion.div 
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="bg-bg-main rounded-xl p-4 border border-border-subtle space-y-3">
                                                {formData.addons.map((addon, idx) => (
                                                  <div key={idx} className="flex gap-3 items-center group/addon">
                                                    <input 
                                                      type="text" 
                                                      placeholder="e.g. Extra Cheese" 
                                                      value={addon.name}
                                                      onChange={e => updateAddon(idx, 'name', e.target.value)}
                                                      className="flex-1 px-4 py-2 bg-white border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-primary" 
                                                    />
                                                    <input 
                                                      type="number" 
                                                      placeholder="Price" 
                                                      value={addon.price}
                                                      onChange={e => updateAddon(idx, 'price', e.target.value)}
                                                      className="w-24 px-4 py-2 bg-white border border-border-subtle rounded-lg text-sm focus:outline-primary" 
                                                    />
                                                    {formData.addons.length > 1 && (
                                                      <button 
                                                        onClick={() => removeAddon(idx)}
                                                        className="text-red-500 hover:text-red-700 opacity-0 group-hover/addon:opacity-100 transition-opacity p-2"
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                                <button onClick={addAddon} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline mt-2">
                                                  <Plus className="w-4 h-4" /> Add Addon
                                                </button>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>

                                      <div className="grid grid-cols-2 gap-6">
                                        <div>
                                          <div className="flex items-center gap-3 mb-2">
                                            <label className="text-sm font-bold text-text-primary">Apply Discount?</label>
                                            <button 
                                              type="button"
                                              onClick={() => setHasDiscount(!hasDiscount)}
                                              className={`w-9 h-5 rounded-full transition-colors relative ${hasDiscount ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${hasDiscount ? 'left-[18px]' : 'left-0.5'}`} />
                                            </button>
                                          </div>
                                          <AnimatePresence>
                                            {hasDiscount && (
                                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="relative mt-2">
                                                  <input 
                                                    type="number"
                                                    value={formData.discount_percentage}
                                                    onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-white focus:outline-none focus:border-primary text-sm font-medium pr-8"
                                                    placeholder="0.00"
                                                  />
                                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>

                                        <div>
                                          <label className="block text-sm font-bold text-text-primary mb-2">Prep Time</label>
                                          <div className="relative">
                                            <input 
                                              type="number"
                                              value={formData.prep_time_minutes}
                                              onChange={(e) => setFormData({...formData, prep_time_minutes: e.target.value})}
                                              className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-white focus:outline-none focus:border-primary text-sm font-medium"
                                              placeholder="Mins"
                                            />
                                          </div>
                                          <p className="text-[10px] text-text-muted mt-1">Leave blank for stall default</p>
                                        </div>
                                      </div>

                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            
                            <button 
                              onClick={handleSaveItem}
                              disabled={submitting}
                              className="w-full py-3 mt-4 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2"
                            >
                              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {editingItem ? 'Update Item' : 'Save Item'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Stall Edit Modal */}
                    <AnimatePresence>
                      {showStallEditModal && editingStall && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/20 backdrop-blur-sm"
                        >
                          <div className="bg-bg-alt rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border-subtle">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-heading font-black text-text-primary">Edit Stall Settings</h3>
                              <button onClick={() => setShowStallEditModal(false)} className="text-text-muted hover:text-text-primary">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <form onSubmit={handleUpdateStall} className="space-y-5">
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Rating</label>
                                <input 
                                  type="number" step="0.1" max="5" min="1"
                                  value={stallFormData.rating}
                                  onChange={e => setStallFormData({...stallFormData, rating: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                  placeholder="e.g. 4.5"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Preparation Time (mins)</label>
                                <input 
                                  type="number" min="0"
                                  value={stallFormData.prep_time}
                                  onChange={e => setStallFormData({...stallFormData, prep_time: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                  placeholder="e.g. 15"
                                />
                                <p className="text-xs text-text-muted mt-1">Customers will see a range like "15 - 25 mins".</p>
                              </div>
                              <div className="mb-6">
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Commission Rate (%)</label>
                                <input 
                                  type="number" step="0.01" min="0" max="100"
                                  value={stallFormData.commission_rate}
                                  onChange={e => setStallFormData({...stallFormData, commission_rate: e.target.value})}
                                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-main focus:outline-none focus:border-primary text-sm font-medium"
                                  placeholder="e.g. 22"
                                />
                                <p className="text-xs text-text-muted mt-1">Deducted automatically from daily payout.</p>
                              </div>
                              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-colors">
                                Save Settings
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                )}
                
                <div className="h-10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
