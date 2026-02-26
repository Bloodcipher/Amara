import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, X } from 'lucide-react';
import { fetchProducts, createProduct, fetchLookup } from '@/lib/api';

export default function ProductsCatalog() {
  const [products, setProducts] = useState([]);
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '',
    face_value_id: '', category_id: '', material_id: '',
    motif_id: '', finding_id: '', locking_id: '', size_id: '',
  });

  const LOOKUP_KEYS = ['face_value', 'category', 'material', 'motif', 'finding', 'locking', 'size'];

  const loadData = useCallback(async () => {
    try {
      const [prods, ...lks] = await Promise.all([
        fetchProducts(),
        ...LOOKUP_KEYS.map(k => fetchLookup(k)),
      ]);
      setProducts(prods);
      const lkMap = {};
      LOOKUP_KEYS.forEach((k, i) => { lkMap[k] = lks[i]; });
      setLookups(lkMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!form.name || LOOKUP_KEYS.some(k => !form[`${k}_id`])) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await createProduct(form);
      setShowForm(false);
      setForm({ name: '', description: '', face_value_id: '', category_id: '', material_id: '', motif_id: '', finding_id: '', locking_id: '', size_id: '' });
      loadData();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Error creating product');
    }
  };

  return (
    <div data-testid="products-catalog">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Products</h1>
          <p className="text-neutral-500 mt-1 text-sm">Jewellery catalog with auto-generated Base-36 SKUs</p>
        </div>
        <button
          data-testid="add-product-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-6 py-3 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Product'}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card rounded-lg p-6 mb-6"
        >
          <h3 className="font-heading text-lg font-bold mb-4">Create New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Product Name *</label>
              <input
                data-testid="product-name-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Silver Floral Bugadi"
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
              <input
                data-testid="product-desc-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
            {LOOKUP_KEYS.map((key) => (
              <div key={key}>
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">
                  {key.replace('_', ' ')} *
                </label>
                <select
                  data-testid={`product-${key}-select`}
                  value={form[`${key}_id`]}
                  onChange={(e) => setForm({ ...form, [`${key}_id`]: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-2 text-xs focus:border-gold/50 outline-none"
                >
                  <option value="">Select</option>
                  {(lookups[key] || []).map(item => (
                    <option key={item.id} value={item.id}>[{item.code}] {item.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            data-testid="create-product-btn"
            onClick={handleCreate}
            className="px-8 py-3 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            Create Product (Auto-Generate SKU)
          </button>
        </motion.div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Package className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium">{products.length} Products</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-950/80 backdrop-blur">
                  {['SKU', 'Name', 'Category', 'Material', 'Motif', 'Finding', 'Locking', 'Size', 'Seq'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} data-testid={`product-row-${p.id}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-gold text-xs tracking-wider">{p.sku}</td>
                    <td className="py-3 px-4 text-sm">{p.name}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.category_name || p.category_code}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.material_name || p.material_code}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.motif_name || p.motif_code}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.finding_name || p.finding_code}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.locking_name || p.locking_code}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{p.size_name || p.size_code}</td>
                    <td className="py-3 px-4 text-xs font-mono text-neutral-500">{p.sequence_num}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-neutral-500 text-sm">No products yet. Create one to see auto-generated SKU.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
