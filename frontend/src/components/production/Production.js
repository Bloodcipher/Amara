import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, X } from 'lucide-react';
import { fetchJobCards, createJobCard, updateJobCardStatus, fetchQCLogs, createQCLog,
         fetchProducts, fetchUsers } from '@/lib/api';
import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';
import ExportButton from '@/components/ui/ExportButton';

const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  on_hold: 'bg-orange-500/20 text-orange-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function Production() {
  const [activeTab, setActiveTab] = useState('job-cards');
  const [jcData, setJcData] = useState({ items: [], total: 0, page: 1, page_size: 15, total_pages: 1 });
  const [qcData, setQcData] = useState({ items: [], total: 0, page: 1, page_size: 15, total_pages: 1 });
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jcPage, setJcPage] = useState(1);
  const [qcPage, setQcPage] = useState(1);
  const searchTimeout = useRef(null);
  const [jcForm, setJcForm] = useState({
    product_id: '', job_card_number: '', target_qty: '', assigned_artisan_id: '',
    status: 'pending', priority: 'normal', notes: '',
  });
  const [qcForm, setQcForm] = useState({
    job_card_id: '', inspected_by: '', qty_passed: '', qty_failed: '', defect_reason: '', notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jc, qc, prods, usrs] = await Promise.all([
        fetchJobCards({ page: jcPage, page_size: 15, q: search, status: statusFilter }),
        fetchQCLogs({ page: qcPage, page_size: 15, q: search }),
        fetchProducts({ page_size: 200 }),
        fetchUsers(),
      ]);
      setJcData(jc);
      setQcData(qc);
      setProducts(prods.items || []);
      setUsers(usrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [jcPage, qcPage, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setJcPage(1);
      setQcPage(1);
    }, 400);
  };

  const handleCreateJC = async () => {
    if (!jcForm.product_id || !jcForm.job_card_number || !jcForm.target_qty) return;
    try {
      await createJobCard({ ...jcForm, target_qty: parseInt(jcForm.target_qty) });
      setJcForm({ product_id: '', job_card_number: '', target_qty: '', assigned_artisan_id: '', status: 'pending', priority: 'normal', notes: '' });
      setShowForm(false);
      loadData();
    } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
  };

  const handleCreateQC = async () => {
    if (!qcForm.job_card_id || !qcForm.qty_passed || !qcForm.qty_failed) return;
    try {
      await createQCLog({ ...qcForm, qty_passed: parseInt(qcForm.qty_passed), qty_failed: parseInt(qcForm.qty_failed) });
      setQcForm({ job_card_id: '', inspected_by: '', qty_passed: '', qty_failed: '', defect_reason: '', notes: '' });
      setShowForm(false);
      loadData();
    } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await updateJobCardStatus(id, newStatus); loadData(); } catch (e) { alert('Error updating status'); }
  };

  return (
    <div data-testid="production">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Production & QC</h1>
          <p className="text-neutral-500 mt-1 text-sm">Job cards workflow and quality control</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton entity={activeTab === 'job-cards' ? 'job-cards' : 'qc-logs'} />
          <button data-testid="add-production-btn" onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add New'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {[{ id: 'job-cards', label: 'Job Cards' }, { id: 'qc-logs', label: 'QC Logs' }].map(t => (
            <button key={t.id} data-testid={`prod-tab-${t.id}`}
              onClick={() => { setActiveTab(t.id); setShowForm(false); setSearch(''); }}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all
                ${activeTab === t.id ? 'bg-gold text-black' : 'bg-white/5 text-neutral-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={handleSearch} placeholder={activeTab === 'job-cards' ? 'Search job cards...' : 'Search QC logs...'} />
        </div>
        {activeTab === 'job-cards' && (
          <select data-testid="status-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setJcPage(1); }}
            className="bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-xs focus:border-gold/50 outline-none">
            <option value="">All statuses</option>
            {['pending','in_progress','completed','on_hold','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg p-6 mb-6">
          {activeTab === 'job-cards' ? (
            <>
              <h3 className="font-heading text-lg mb-4">New Job Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Product *</label>
                  <select data-testid="jc-product-select" value={jcForm.product_id}
                    onChange={(e) => setJcForm({ ...jcForm, product_id: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Job Card # *</label>
                  <input data-testid="jc-number-input" value={jcForm.job_card_number}
                    onChange={(e) => setJcForm({ ...jcForm, job_card_number: e.target.value })} placeholder="0BSFXSS001-P042"
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Target Qty *</label>
                  <input data-testid="jc-qty-input" type="number" value={jcForm.target_qty}
                    onChange={(e) => setJcForm({ ...jcForm, target_qty: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Artisan</label>
                  <select value={jcForm.assigned_artisan_id} onChange={(e) => setJcForm({ ...jcForm, assigned_artisan_id: e.target.value || null })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                    <option value="">Unassigned</option>
                    {users.filter(u => u.role === 'artisan').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Priority</label>
                  <select value={jcForm.priority} onChange={(e) => setJcForm({ ...jcForm, priority: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                    {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button data-testid="save-jc-btn" onClick={handleCreateJC}
                className="px-6 py-2.5 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">Create Job Card</button>
            </>
          ) : (
            <>
              <h3 className="font-heading text-lg mb-4">New QC Log</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Job Card *</label>
                  <select data-testid="qc-jobcard-select" value={qcForm.job_card_id}
                    onChange={(e) => setQcForm({ ...qcForm, job_card_id: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                    <option value="">Select job card</option>
                    {jcData.items.map(jc => <option key={jc.id} value={jc.id}>{jc.job_card_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Inspector</label>
                  <select value={qcForm.inspected_by} onChange={(e) => setQcForm({ ...qcForm, inspected_by: e.target.value || null })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                    <option value="">Select inspector</option>
                    {users.filter(u => u.role === 'qc_inspector').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Qty Passed *</label>
                  <input data-testid="qc-passed-input" type="number" value={qcForm.qty_passed}
                    onChange={(e) => setQcForm({ ...qcForm, qty_passed: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Qty Failed *</label>
                  <input data-testid="qc-failed-input" type="number" value={qcForm.qty_failed}
                    onChange={(e) => setQcForm({ ...qcForm, qty_failed: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Defect Reason</label>
                  <input value={qcForm.defect_reason} onChange={(e) => setQcForm({ ...qcForm, defect_reason: e.target.value })} placeholder="Describe any defects"
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
                </div>
              </div>
              <button data-testid="save-qc-btn" onClick={handleCreateQC}
                className="px-6 py-2.5 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">Save QC Log</button>
            </>
          )}
        </motion.div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <ClipboardList className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium">
            {activeTab === 'job-cards' ? `${jcData.total} Job Cards` : `${qcData.total} QC Logs`}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'job-cards' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-950/80">
                    {['Job Card #', 'Product', 'SKU', 'Qty', 'Artisan', 'Priority', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jcData.items.map(jc => (
                    <tr key={jc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">{jc.job_card_number}</td>
                      <td className="py-3 px-4 text-sm">{jc.product_name}</td>
                      <td className="py-3 px-4 font-mono text-gold text-xs">{jc.product_sku}</td>
                      <td className="py-3 px-4 text-sm">{jc.completed_qty}/{jc.target_qty}</td>
                      <td className="py-3 px-4 text-sm text-neutral-400">{jc.artisan_name || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize
                          ${jc.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : jc.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-neutral-400'}`}>
                          {jc.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[jc.status] || ''}`}>{jc.status.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select data-testid={`status-select-${jc.id}`} value={jc.status} onChange={(e) => handleStatusChange(jc.id, e.target.value)}
                          className="bg-neutral-900/50 border border-white/10 rounded text-xs px-2 py-1 focus:border-gold/50 outline-none">
                          {['pending','in_progress','completed','on_hold','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {jcData.items.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-neutral-500 text-sm">No job cards found</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={jcData.page} totalPages={jcData.total_pages} total={jcData.total} pageSize={jcData.page_size} onPageChange={(p) => setJcPage(p)} />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-950/80">
                    {['Job Card', 'Inspector', 'Passed', 'Failed', 'Pass Rate', 'Defect Reason', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qcData.items.map(q => {
                    const total = q.qty_passed + q.qty_failed;
                    const rate = total > 0 ? ((q.qty_passed / total) * 100).toFixed(1) : 0;
                    return (
                      <tr key={q.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{q.job_card_number}</td>
                        <td className="py-3 px-4 text-sm">{q.inspector_name || '-'}</td>
                        <td className="py-3 px-4 text-sm text-emerald-400">{q.qty_passed}</td>
                        <td className="py-3 px-4 text-sm text-red-400">{q.qty_failed}</td>
                        <td className="py-3 px-4"><span className={`text-xs font-mono ${parseFloat(rate) >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{rate}%</span></td>
                        <td className="py-3 px-4 text-sm text-neutral-400 max-w-[200px] truncate">{q.defect_reason || '-'}</td>
                        <td className="py-3 px-4 text-xs text-neutral-500">{q.inspection_date ? new Date(q.inspection_date).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })}
                  {qcData.items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-neutral-500 text-sm">No QC logs found</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={qcData.page} totalPages={qcData.total_pages} total={qcData.total} pageSize={qcData.page_size} onPageChange={(p) => setQcPage(p)} />
          </>
        )}
      </div>
    </div>
  );
}
