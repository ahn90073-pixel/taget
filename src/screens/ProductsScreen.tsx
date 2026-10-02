import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Package, Edit2, Trash2, X, AlertCircle,
  CheckCircle2, FileText, Filter, Tag, Boxes, Scale
} from 'lucide-react';
import type { Product, VendorData } from '@/types';
import { formatEGP, formatNumber } from '@/utils/format';
import { mockProducts, productCategories } from '@/data/mockData';

interface ProductsScreenProps {
  vendor: VendorData;
}

export default function ProductsScreen({ vendor }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', category: productCategories[0], price: '', stock: '', weight: ''
  });

  const filtered = products.filter(p =>
    (p.name.includes(search) || p.category.includes(search)) &&
    (filterCategory === 'all' || p.category === filterCategory)
  );

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product: Product = {
      id: String(Date.now()),
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock) || 0,
      weight: Number(newProduct.weight) || 0,
      status: 'active',
    };
    setProducts([product, ...products]);
    setNewProduct({ name: '', category: productCategories[0], price: '', stock: '', weight: '' });
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const isVerified = vendor.status === 'verified';

  return (
    <div className="space-y-6">
      {/* Lock Warning for Unverified */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-alert-50 border-2 border-alert-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-6 h-6 text-alert-600 flex-shrink-0" />
          <p className="text-alert-800 text-sm font-semibold">
            حسابك غير مكتمل. لا يمكنك إضافة منتجات جديدة حتى استكمال البيانات الوثائقية الرسمية.
          </p>
        </motion.div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">كتالوج المنتجات</h2>
          <p className="text-slate-400 text-sm mt-1">
            إدارة منتجات متجرك — {products.length} منتج إجمالاً
          </p>
        </div>
        <button
          onClick={() => isVerified && setShowAddModal(true)}
          disabled={!isVerified}
          className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            isVerified
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-w-40"
          >
            <option value="all">جميع التصنيفات</option>
            {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">المنتج</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">التصنيف</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">السعر</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">المخزون</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600 hidden sm:table-cell">الوزن (كجم)</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm">{product.category}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-800 text-sm">{formatEGP(product.price)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-600' : product.stock < 50 ? 'text-alert-600' : 'text-slate-700'}`}>
                      {formatNumber(product.stock)}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-slate-600 text-sm">{product.weight}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'active'
                        ? 'bg-financial-100 text-financial-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {product.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      {product.status === 'active' ? 'نشط' : 'مسودة'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-100 hover:text-brand-600 flex items-center justify-center transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد منتجات مطابقة</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 font-display">إضافة منتج جديد</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم المنتج</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="مثال: كابل شحن سريع"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">التصنيف</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">السعر (ج.م)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">المخزون</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">الوزن (كجم)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!newProduct.name || !newProduct.price}
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors disabled:opacity-50"
                >
                  إضافة المنتج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
