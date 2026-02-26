import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Plus, X } from 'lucide-react';
import { fetchInventory, createInventory, fetchProducts } from '@/lib/api';
import SearchBar from '@/components/ui/SearchBar';
import ExportButton from '@/components/ui/ExportButton';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const searchTimeout = useRef(null);
  const [form, setForm] = useState({
    product_id: '', stock_qty: '', unit_cost: '', selling_price: '', mrp: '', weight_grams: '', location: '',
  });

  const loadData = useCallback(async (q = search) => {
    try {
      const [inv, prods] = await Promise.all([fetchInventory(q), fetchProducts({ page_size: 200 })]);
      setInventory(inv);
      setProducts(prods.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadData(val), 400);
  };

  const handleCreate = async () => {
    if (!form.product_id) return;
    try {
      await createInventory({
        ...form,
        stock_qty: parseInt(form.stock_qty) || 0,
        unit_cost: parseFloat(form.unit_cost) || null,
        selling_price: parseFloat(form.selling_price) || null,
        mrp: parseFloat(form.mrp) || null,
        weight_grams: parseFloat(form.weight_grams) || null,
      });
      setForm({ product_id: '', stock_qty: '', unit_cost: '', selling_price: '', mrp: '', weight_grams: '', location: '' });
      setShowForm(false);
      loadData();
    } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
  };

  const totalValue = inventory.reduce((acc, i) => acc + (i.stock_qty * (i.selling_price || 0)), 0);
  const totalStock = inventory.reduce((acc, i) => acc + i.stock_qty, 0);

  return (
    <div data-testid="inventory">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Inventory</h1>
          <p className="text-neutral-500 mt-1 text-sm">Stock levels, pricing, and warehouse management</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton entity="inventory" />
          <button
            data-testid="add-inventory-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-6 py-3 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Stock'}
        </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-md">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by product, SKU, or location..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Total Items</p>
          <p className="text-2xl font-bold font-heading text-gold">{inventory.length}</p>
        </div>
        <div className="glass-card rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Total Stock</p>
          <p className="text-2xl font-bold font-heading">{totalStock.toLocaleString()} pcs</p>
        </div>
        <div className="glass-card rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Total Value</p>
          <p className="text-2xl font-bold font-heading text-emerald-400">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg p-6 mb-6">
          <h3 className="font-heading text-lg mb-4">Add Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Product *</label>
              <select data-testid="inv-product-select" value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Stock Qty</label>
              <input data-testid="inv-qty-input" type="number" value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Unit Cost</label>
              <input type="number" step="0.01" value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Selling Price</label>
              <input type="number" step="0.01" value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">MRP</label>
              <input type="number" step="0.01" value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Weight (grams)</label>
              <input type="number" step="0.001" value={form.weight_grams}
                onChange={(e) => setForm({ ...form, weight_grams: e.target.value })}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Location</label>
              <input value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Shelf A-12"
                className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
            </div>
          </div>
          <button data-testid="save-inventory-btn" onClick={handleCreate}
            className="px-6 py-2.5 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">
            Add to Inventory
          </button>
        </motion.div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Warehouse className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium">{inventory.length} Items in Stock</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-950/80">
                  {['SKU', 'Product', 'Stock', 'Unit Cost', 'Selling Price', 'MRP', 'Weight', 'Location', 'Value'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map(i => (
                  <tr key={i.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-gold text-xs">{i.product_sku}</td>
                    <td className="py-3 px-4 text-sm">{i.product_name}</td>
                    <td className="py-3 px-4 text-sm font-medium">{i.stock_qty}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400">{i.unit_cost ? `$${i.unit_cost}` : '-'}</td>
                    <td className="py-3 px-4 text-sm">{i.selling_price ? `$${i.selling_price}` : '-'}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400">{i.mrp ? `$${i.mrp}` : '-'}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{i.weight_grams ? `${i.weight_grams}g` : '-'}</td>
                    <td className="py-3 px-4 text-xs text-neutral-400">{i.location || '-'}</td>
                    <td className="py-3 px-4 text-sm font-medium text-emerald-400">
                      ${(i.stock_qty * (i.selling_price || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-neutral-500 text-sm">No inventory entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
