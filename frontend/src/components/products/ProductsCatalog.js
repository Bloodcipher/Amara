import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchLookup } from '@/lib/api';
import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';
import ExportButton from '@/components/ui/ExportButton';

export default function ProductsCatalog() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 15, total_pages: 1 });
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [form, setForm] = useState({
    name: '', description: '',
    face_value_id: '', category_id: '', material_id: '',
    motif_id: '', finding_id: '', locking_id: '', size_id: '',
  });
  const searchTimeout = useRef(null);

  const LOOKUP_KEYS = ['face_value', 'category', 'material', 'motif', 'finding', 'locking', 'size'];

  const loadData = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const [prods, ...lks] = await Promise.all([
        fetchProducts({ page: p, page_size: 15, q }),
        ...LOOKUP_KEYS.map(k => fetchLookup(k)),
      ]);
      setData(prods);
      const lkMap = {};
      LOOKUP_KEYS.forEach((k, i) => { lkMap[k] = lks[i]; });
      setLookups(lkMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadData(1, val);
    }, 400);
  };

  const handlePageChange = (p) => {
    setPage(p);
    loadData(p, search);
  };

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

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description || '' });
  };

  const saveEdit = async () => {
    try {
      await updateProduct(editingId, editForm);
      setEditingId(null);
      loadData();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Error updating product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will soft-delete (mark inactive).`)) return;
    try {
      await deleteProduct(id);
      loadData();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Error deleting product');
    }
  };

  return (
    <div data-testid="products-catalog">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Products</h1>
          <p className="text-neutral-500 mt-1 text-sm">Jewellery catalog with auto-generated Base-36 SKUs</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton entity="products" />
          <button
            data-testid="add-product-btn"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Product'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-md">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, SKU, or description..." />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card rounded-lg p-6 mb-6">
          <h3 className="font-heading text-lg font-bold mb-4">Create New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Product Name *</label>
              <input data-testid="product-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Silver Floral Bugadi"
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
              <input data-testid="product-desc-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description"
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
            {LOOKUP_KEYS.map((key) => (
              <div key={key}>
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">{key.replace('_', ' ')} *</label>
                <select data-testid={`product-${key}-select`} value={form[`${key}_id`]}
                  onChange={(e) => setForm({ ...form, [`${key}_id`]: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-2 text-xs focus:border-gold/50 outline-none">
                  <option value="">Select</option>
                  {(lookups[key] || []).map(item => <option key={item.id} value={item.id}>[{item.code}] {item.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button data-testid="create-product-btn" onClick={handleCreate}
            className="px-8 py-3 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            Create Product (Auto-Generate SKU)
          </button>
        </motion.div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium">{data.total} Products</span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-950/80 backdrop-blur">
                    {['SKU', 'Name', 'Category', 'Material', 'Motif', 'Size', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} data-testid={`product-row-${p.id}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-gold text-xs tracking-wider">{p.sku}</td>
                      <td className="py-3 px-4 text-sm">
                        {editingId === p.id ? (
                          <div className="flex gap-2 items-center">
                            <input data-testid="edit-name-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-neutral-900 border border-gold/30 rounded px-2 py-1 text-sm w-40 outline-none focus:border-gold" />
                            <button data-testid="save-edit-btn" onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                            <button data-testid="cancel-edit-btn" onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><XCircle className="w-4 h-4" /></button>
                          </div>
                        ) : p.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-neutral-400">{p.category_name}</td>
                      <td className="py-3 px-4 text-xs text-neutral-400">{p.material_name}</td>
                      <td className="py-3 px-4 text-xs text-neutral-400">{p.motif_name}</td>
                      <td className="py-3 px-4 text-xs text-neutral-400">{p.size_name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button data-testid={`edit-product-${p.id}`} onClick={() => startEdit(p)}
                            className="text-neutral-500 hover:text-gold transition-colors p-1"><Pencil className="w-3.5 h-3.5" /></button>
                          <button data-testid={`delete-product-${p.id}`} onClick={() => handleDelete(p.id, p.name)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.items.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-neutral-500 text-sm">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.total_pages} total={data.total} pageSize={data.page_size} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}
