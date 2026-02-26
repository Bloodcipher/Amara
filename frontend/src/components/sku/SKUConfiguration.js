import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tags, Plus, Trash2, X } from 'lucide-react';
import { fetchLookup, createLookup, deleteLookup } from '@/lib/api';

const TABLES = [
  { key: 'face_value', label: 'Face Value', desc: 'Price range classification' },
  { key: 'category', label: 'Category', desc: 'Jewellery type (Bugadi, Jhumka, etc.)' },
  { key: 'material', label: 'Material', desc: 'Metal type (Silver, Gold, etc.)' },
  { key: 'motif', label: 'Motif', desc: 'Design pattern (Floral, Geometric, etc.)' },
  { key: 'finding', label: 'Finding', desc: 'Back/clasp type' },
  { key: 'locking', label: 'Locking', desc: 'Locking mechanism' },
  { key: 'size', label: 'Size', desc: 'Product size classification' },
];

export default function SKUConfiguration() {
  const [activeTable, setActiveTable] = useState('face_value');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLookup(activeTable);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTable]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleCreate = async () => {
    if (!form.name || !form.code) return;
    try {
      await createLookup(activeTable, form);
      setForm({ name: '', code: '', description: '' });
      setShowForm(false);
      loadItems();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Error creating item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lookup entry?')) return;
    try {
      await deleteLookup(activeTable, id);
      loadItems();
    } catch (e) {
      alert(e?.response?.data?.detail || 'Cannot delete - may be referenced by products');
    }
  };

  const activeInfo = TABLES.find(t => t.key === activeTable);

  return (
    <div data-testid="sku-configuration">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">SKU Configuration</h1>
          <p className="text-neutral-500 mt-1 text-sm">Manage the 7 lookup tables that compose the Base-36 SKU</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABLES.map((t) => (
          <button
            key={t.key}
            data-testid={`tab-${t.key}`}
            onClick={() => { setActiveTable(t.key); setShowForm(false); }}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all duration-200
              ${activeTable === t.key
                ? 'bg-gold text-black'
                : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Tags className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-medium text-sm">{activeInfo?.label}</h3>
              <p className="text-xs text-neutral-500">{activeInfo?.desc}</p>
            </div>
          </div>
          <button
            data-testid="add-lookup-btn"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel' : 'Add Entry'}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-6 py-4 bg-white/[0.02] border-b border-white/5"
          >
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Name</label>
                <input
                  data-testid="lookup-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sterling Silver"
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Code</label>
                <input
                  data-testid="lookup-code-input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 1) })}
                  placeholder="S"
                  maxLength={1}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm font-mono text-gold text-center focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
                <input
                  data-testid="lookup-desc-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
                />
              </div>
              <button
                data-testid="save-lookup-btn"
                onClick={handleCreate}
                className="px-6 h-10 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-950/80 backdrop-blur">
                  <th className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6">Code</th>
                  <th className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6">Name</th>
                  <th className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6">Description</th>
                  <th className="text-right text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-6">
                      <span className="font-mono text-gold text-sm bg-gold/10 px-2 py-0.5 rounded">{item.code}</span>
                    </td>
                    <td className="py-3 px-6 text-sm">{item.name}</td>
                    <td className="py-3 px-6 text-sm text-neutral-400">{item.description || '-'}</td>
                    <td className="py-3 px-6 text-right">
                      <button
                        data-testid={`delete-${item.id}`}
                        onClick={() => handleDelete(item.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-neutral-500 text-sm">No entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
