import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Edit2, Trash2, X, AlertCircle, CheckCircle2, FileText, Filter, ImagePlus, Upload, Image as ImageIcon } from 'lucide-react';
import { formatEGP, formatNumber } from '@/utils/format';
import { productCategories } from '@/data/mockData';
import { mapBackendProduct, productsApi } from '@/api/client';

const emptyProduct = { name: '', category: productCategories[0], price: '', stock: '', weight: '', image: '' };

export default function ProductsScreen({ vendor, token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    productsApi.list(vendor.apiCompanyId).then((result) => {
      if (active) setProducts((result.items || []).map(mapBackendProduct));
    }).catch((error) => { if (active) setApiError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [vendor.apiCompanyId, token]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const filtered = products.filter((product) =>
    (String(product?.name ?? '').includes(search) || String(product?.category ?? '').includes(search)) &&
    (filterCategory === 'all' || product.category === filterCategory)
  );

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onload = () => setNewProduct((current) => ({ ...current, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewProduct((current) => ({ ...current, image: '' }));
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewProduct(emptyProduct);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || saving) return;
    setSaving(true); setApiError('');
    try {
      const created = await productsApi.create(vendor.apiCompanyId, {
        sku: `SKU-${Date.now()}`, name: newProduct.name.trim(), price: Number(newProduct.price),
        currency: 'EGP', weightGrams: Math.round((Number(newProduct.weight) || 0) * 1000),
        metadata: { categoryLabel: newProduct.category, image: newProduct.image || '' },
      });
      setProducts((current) => [mapBackendProduct(created), ...current]);
      closeModal();
    } catch (error) { setApiError(error.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج نهائيًا؟')) return;
    setApiError('');
    try {
      await productsApi.remove(vendor.apiCompanyId, id);
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (error) { setApiError(error.message); }
  };
  const canManageProducts = Boolean(vendor.apiCompanyId);

  return (
    <div className="space-y-6">
      {apiError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{apiError}</div>}
      {loading && <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">جارٍ تحميل المنتجات من الخادم...</div>}
      {!canManageProducts && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl border-2 border-alert-200 bg-alert-50 p-4">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-alert-600" />
          <p className="text-sm font-semibold text-alert-800">حسابك غير مكتمل. لا يمكنك إضافة منتجات جديدة حتى استكمال البيانات الوثائقية الرسمية.</p>
        </motion.div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="font-display text-xl font-bold text-slate-900">كتالوج المنتجات</h2><p className="mt-1 text-sm text-slate-400">إدارة منتجات متجرك — {products.length} منتج إجمالاً</p></div>
        <button onClick={() => canManageProducts && setShowAddModal(true)} disabled={!canManageProducts} className={`flex items-center gap-2 rounded-xl px-5 py-3 font-bold transition-all ${canManageProducts ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}><Plus className="h-5 w-5" />إضافة منتج جديد</button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن منتج..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-11 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
        <div className="relative"><Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="min-w-40 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="all">جميع التصنيفات</option>{productCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto scrollbar-thin"><table className="w-full"><thead><tr className="border-b border-slate-100 bg-slate-50"><th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">المنتج</th><th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">التصنيف</th><th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">السعر</th><th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">المخزون</th><th className="hidden px-4 py-4 text-right text-sm font-semibold text-slate-600 sm:table-cell">الوزن (كجم)</th><th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">الحالة</th><th className="px-4 py-4 text-right text-sm font-semibold text-slate-600">إجراءات</th></tr></thead>
          <tbody className="divide-y divide-slate-50">{filtered.map((product, index) => <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="transition-colors hover:bg-slate-50">
            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}</div><span className="text-sm font-semibold text-slate-800">{product.name}</span></div></td>
            <td className="px-4 py-4 text-sm text-slate-600">{product.category}</td><td className="px-4 py-4 text-sm font-bold text-slate-800">{formatEGP(product.price)}</td><td className={`px-4 py-4 text-sm font-semibold ${product.stock === 0 ? 'text-red-600' : product.stock < 50 ? 'text-alert-600' : 'text-slate-700'}`}>{formatNumber(product.stock)}</td><td className="hidden px-4 py-4 text-sm text-slate-600 sm:table-cell">{product.weight}</td>
            <td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${product.status === 'active' ? 'bg-financial-100 text-financial-700' : product.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{product.status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}{product.status === 'active' ? 'نشط' : product.status === 'pending' ? 'قيد المراجعة' : product.status === 'archived' ? 'مؤرشف' : 'مسودة'}</span></td>
            <td className="px-4 py-4"><div className="flex items-center gap-2"><button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-brand-100 hover:text-brand-600"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDelete(product.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td>
          </motion.tr>)}</tbody></table></div>
        {filtered.length === 0 && <div className="p-12 text-center"><Package className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-slate-400">لا توجد منتجات مطابقة</p></div>}
      </div>

      <AnimatePresence>{showAddModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl scrollbar-thin">
        <div className="mb-6 flex items-center justify-between"><h3 className="font-display text-xl font-bold text-slate-900">إضافة منتج جديد</h3><button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button></div>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">صورة المنتج <span className="font-normal text-slate-400">(اختياري)</span></label><input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />{newProduct.image ? <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={newProduct.image} alt="معاينة صورة المنتج" className="h-44 w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-3"><button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm font-semibold text-white"><Upload className="h-4 w-4" />تغيير الصورة</button><button type="button" onClick={removeImage} className="text-sm font-semibold text-red-200 hover:text-white">حذف الصورة</button></div></div> : <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"><ImagePlus className="h-8 w-8" /><span className="text-sm font-semibold">اضغط لاختيار صورة المنتج</span><span className="text-xs text-slate-400">PNG أو JPG — حتى 5 ميجابايت</span></button>}{imageError && <p className="mt-2 text-xs font-semibold text-red-600">{imageError}</p>}</div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">اسم المنتج</label><input type="text" value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} placeholder="مثال: كابل شحن سريع" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">التصنيف</label><select value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500">{productCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">السعر (ج.م)</label><input type="number" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} placeholder="0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" /></div><div><label className="mb-1.5 block text-sm font-semibold text-slate-700">المخزون</label><input type="number" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })} placeholder="0" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" /></div></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-slate-700">الوزن (كجم)</label><input type="number" step="0.01" value={newProduct.weight} onChange={(event) => setNewProduct({ ...newProduct, weight: event.target.value })} placeholder="0.00" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" /></div>
        </div>
        <div className="mt-6 flex gap-3"><button onClick={closeModal} className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-50">إلغاء</button><button onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.price || saving} className="flex-1 rounded-xl bg-brand-600 py-3 font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50">{saving ? 'جارٍ الحفظ...' : 'إضافة المنتج'}</button></div>
      </motion.div></div>}</AnimatePresence>
    </div>
  );
}
