import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, DollarSign, CheckCircle, Users, Dice5, Clock, CircleCheck } from 'lucide-react';
import { fetchDashboardStats } from '@/lib/api';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="glass-card rounded-lg p-5 transition-all duration-500 hover:gold-border group"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-2">{label}</p>
        <p className="text-2xl font-bold font-heading" style={{ color }}>{value}</p>
      </div>
      <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="text-neutral-500 text-center py-10">Failed to load dashboard data</div>;

  const cards = [
    { icon: Package, label: 'Total Products', value: stats.total_products, color: '#D4AF37' },
    { icon: ClipboardList, label: 'Active Job Cards', value: stats.active_job_cards, color: '#3B82F6' },
    { icon: DollarSign, label: 'Inventory Value', value: `$${stats.total_inventory_value.toLocaleString()}`, color: '#10B981' },
    { icon: CheckCircle, label: 'QC Pass Rate', value: `${stats.qc_pass_rate}%`, color: '#8B5CF6' },
    { icon: Users, label: 'Team Members', value: stats.total_users, color: '#F59E0B' },
    { icon: Dice5, label: 'Active Dices', value: stats.total_dices, color: '#EC4899' },
    { icon: Clock, label: 'Pending Jobs', value: stats.pending_jobs, color: '#EF4444' },
    { icon: CircleCheck, label: 'Completed Jobs', value: stats.completed_jobs, color: '#10B981' },
  ];

  return (
    <div data-testid="dashboard-overview">
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-heading font-bold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <p className="text-neutral-500 mt-1 text-sm">AMARA Manufacturing Intelligence System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 0.08} />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-lg p-6"
        >
          <h3 className="font-heading text-lg font-bold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-neutral-400">Database</span>
              <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Connected (Supabase)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-neutral-400">SKU Engine</span>
              <span className="text-sm text-gold">Base-36 PL/pgSQL Trigger</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-neutral-400">Row Level Security</span>
              <span className="text-sm text-emerald-400">Enabled (16 tables)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-400">Migration Files</span>
              <span className="text-sm text-neutral-300">9 executed</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-lg p-6"
        >
          <h3 className="font-heading text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Product', desc: 'Auto-generate SKU' },
              { label: 'Create Job Card', desc: 'Assign production' },
              { label: 'QC Inspection', desc: 'Log quality check' },
              { label: 'View Inventory', desc: 'Stock & pricing' },
            ].map((action) => (
              <div key={action.label} className="p-3 rounded-md bg-white/[0.02] border border-white/5 hover:border-gold/30 transition-colors cursor-pointer group">
                <p className="text-sm font-medium group-hover:text-gold transition-colors">{action.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{action.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
