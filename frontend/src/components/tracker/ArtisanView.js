import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CheckCircle, Play, Pause, ArrowLeft, ClipboardCheck,
  Gem, ChevronDown
} from 'lucide-react';
import { fetchJobCards, fetchUsers, updateJobCardStatus, createQCLog } from '@/lib/api';

const STATUS_STYLE = {
  pending: { bg: 'bg-amber-500', label: 'Pending' },
  in_progress: { bg: 'bg-blue-500', label: 'In Progress' },
  completed: { bg: 'bg-emerald-500', label: 'Completed' },
  on_hold: { bg: 'bg-orange-500', label: 'On Hold' },
};

export default function ArtisanView({ onBack }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQC, setShowQC] = useState(null);
  const [qcForm, setQcForm] = useState({ qty_passed: '', qty_failed: '', defect_reason: '' });

  const loadData = useCallback(async () => {
    try {
      const [usrs, jcData] = await Promise.all([
        fetchUsers(),
        fetchJobCards({ page_size: 200 }),
      ]);
      setUsers(usrs.filter(u => u.role === 'artisan'));
      setJobCards(jcData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const myJobs = selectedUser
    ? jobCards.filter(jc => jc.assigned_artisan_id === selectedUser.id)
    : [];

  const handleStatusChange = async (jcId, newStatus) => {
    try {
      await updateJobCardStatus(jcId, newStatus);
      loadData();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleQCSubmit = async (jcId) => {
    if (!qcForm.qty_passed && !qcForm.qty_failed) return;
    try {
      await createQCLog({
        job_card_id: jcId,
        inspected_by: selectedUser?.id || null,
        qty_passed: parseInt(qcForm.qty_passed) || 0,
        qty_failed: parseInt(qcForm.qty_failed) || 0,
        defect_reason: qcForm.defect_reason,
      });
      setShowQC(null);
      setQcForm({ qty_passed: '', qty_failed: '', defect_reason: '' });
      loadData();
    } catch (e) {
      alert('Failed to log QC');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // User Selection Screen
  if (!selectedUser) {
    return (
      <div data-testid="artisan-view">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Artisan Portal</h1>
            <p className="text-neutral-500 text-sm">Select your profile to view assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user, idx) => {
            const userJobs = jobCards.filter(jc => jc.assigned_artisan_id === user.id);
            const activeCount = userJobs.filter(jc => jc.status === 'in_progress').length;
            const pendingCount = userJobs.filter(jc => jc.status === 'pending').length;
            return (
              <motion.button
                key={user.id}
                data-testid={`select-artisan-${user.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelectedUser(user)}
                className="glass-card rounded-xl p-6 text-left hover:border-gold/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <span className="text-xl font-bold text-gold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-medium group-hover:text-gold transition-colors">{user.name}</h3>
                <p className="text-xs text-neutral-500 mb-3">{user.email}</p>
                <div className="flex gap-2">
                  {activeCount > 0 && (
                    <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full">
                      {activeCount} active
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                      {pendingCount} pending
                    </span>
                  )}
                  {activeCount === 0 && pendingCount === 0 && (
                    <span className="text-xs bg-white/5 text-neutral-500 px-2.5 py-1 rounded-full">No assignments</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Artisan Dashboard
  const activeJobs = myJobs.filter(j => j.status === 'in_progress');
  const pendingJobs = myJobs.filter(j => j.status === 'pending');
  const completedJobs = myJobs.filter(j => j.status === 'completed');

  return (
    <div data-testid="artisan-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            data-testid="back-to-artisan-list"
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-white/5 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <span className="text-lg font-bold text-gold">
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold">{selectedUser.name}</h2>
            <p className="text-xs text-neutral-500">My Assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-400">{activeJobs.length} active</span>
          <span className="text-neutral-600">|</span>
          <span className="text-amber-400">{pendingJobs.length} pending</span>
          <span className="text-neutral-600">|</span>
          <span className="text-emerald-400">{completedJobs.length} done</span>
        </div>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-3 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> In Progress
          </h3>
          <div className="space-y-3">
            {activeJobs.map(jc => (
              <motion.div key={jc.id} layout className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-gold text-sm tracking-wider">{jc.product_sku}</p>
                    <p className="text-lg font-medium mt-0.5">{jc.product_name}</p>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{jc.job_card_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-heading text-gold">{jc.completed_qty}/{jc.target_qty}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">pieces</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${jc.target_qty > 0 ? (jc.completed_qty / jc.target_qty) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid={`artisan-complete-${jc.id}`}
                    onClick={() => handleStatusChange(jc.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/15 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange(jc.id, 'on_hold')}
                    className="px-4 py-3 bg-orange-500/15 text-orange-400 rounded-lg text-sm hover:bg-orange-500/25 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                  <button
                    data-testid={`artisan-qc-${jc.id}`}
                    onClick={() => setShowQC(showQC === jc.id ? null : jc.id)}
                    className="px-4 py-3 bg-purple-500/15 text-purple-400 rounded-lg text-sm hover:bg-purple-500/25 transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                </div>
                {/* Inline QC Form */}
                <AnimatePresence>
                  {showQC === jc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/5"
                    >
                      <h4 className="text-xs uppercase tracking-widest text-purple-400 font-medium mb-3">Quick QC Log</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] text-neutral-500 uppercase block mb-1">Passed</label>
                          <input data-testid="artisan-qc-passed" type="number" value={qcForm.qty_passed}
                            onChange={(e) => setQcForm({ ...qcForm, qty_passed: e.target.value })}
                            className="w-full bg-neutral-900/50 border border-white/10 rounded-lg h-10 px-3 text-sm focus:border-emerald-500/50 outline-none text-emerald-400" />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-500 uppercase block mb-1">Failed</label>
                          <input data-testid="artisan-qc-failed" type="number" value={qcForm.qty_failed}
                            onChange={(e) => setQcForm({ ...qcForm, qty_failed: e.target.value })}
                            className="w-full bg-neutral-900/50 border border-white/10 rounded-lg h-10 px-3 text-sm focus:border-red-500/50 outline-none text-red-400" />
                        </div>
                      </div>
                      <input value={qcForm.defect_reason} onChange={(e) => setQcForm({ ...qcForm, defect_reason: e.target.value })}
                        placeholder="Defect reason (if any)"
                        className="w-full bg-neutral-900/50 border border-white/10 rounded-lg h-10 px-3 text-sm focus:border-purple-500/50 outline-none mb-3" />
                      <button
                        data-testid="artisan-submit-qc"
                        onClick={() => handleQCSubmit(jc.id)}
                        className="w-full py-2.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        Submit QC Log
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Jobs */}
      {pendingJobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-3">Queued</h3>
          <div className="space-y-2">
            {pendingJobs.map(jc => (
              <div key={jc.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold">{jc.product_sku}</span>
                    <span className="text-sm">{jc.product_name}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{jc.job_card_number} | {jc.target_qty} pcs</p>
                </div>
                <button
                  data-testid={`artisan-start-${jc.id}`}
                  onClick={() => handleStatusChange(jc.id, 'in_progress')}
                  className="px-4 py-2 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/25 transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-3">Completed</h3>
          <div className="space-y-2">
            {completedJobs.map(jc => (
              <div key={jc.id} className="glass-card rounded-lg p-4 flex items-center justify-between opacity-60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold">{jc.product_sku}</span>
                    <span className="text-sm">{jc.product_name}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{jc.job_card_number} | {jc.target_qty} pcs</p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {myJobs.length === 0 && (
        <div className="text-center py-12">
          <Gem className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">No assignments yet</p>
          <p className="text-xs text-neutral-600 mt-1">Job cards will appear here when assigned to you</p>
        </div>
      )}
    </div>
  );
}
