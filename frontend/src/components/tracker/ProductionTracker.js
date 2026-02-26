import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Activity, Clock, CheckCircle, AlertTriangle,
  Pause, XCircle, User, Zap, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { fetchJobCards, fetchUsers, fetchDashboardStats, updateJobCardStatus } from '@/lib/api';
import supabase from '@/lib/supabase';

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Clock, label: 'Pending' },
  in_progress: { color: '#3B82F6', bg: 'bg-blue-500/15', text: 'text-blue-400', icon: Activity, label: 'In Progress' },
  completed: { color: '#10B981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: CheckCircle, label: 'Completed' },
  on_hold: { color: '#F97316', bg: 'bg-orange-500/15', text: 'text-orange-400', icon: Pause, label: 'On Hold' },
  cancelled: { color: '#EF4444', bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle, label: 'Cancelled' },
};

const PRIORITY_CONFIG = {
  urgent: { color: '#EF4444', pulse: true },
  high: { color: '#F97316', pulse: false },
  normal: { color: '#6B7280', pulse: false },
  low: { color: '#374151', pulse: false },
};

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <span className="text-xs text-emerald-400 uppercase tracking-widest font-semibold">Live</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ProgressRing({ completed, target, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = target > 0 ? Math.min(completed / target, 1) : 0;
  const offset = circumference - percent * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#D4AF37"
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-gold">{Math.round(percent * 100)}%</span>
      </div>
    </div>
  );
}

function ActivityFeedItem({ event, index }) {
  const isNew = Date.now() - new Date(event.timestamp).getTime() < 5000;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 py-3 border-b border-white/[0.03] ${isNew ? 'bg-gold/5 -mx-4 px-4 rounded' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${STATUS_CONFIG[event.status]?.bg || 'bg-white/5'}`}>
        <Zap className={`w-3.5 h-3.5 ${STATUS_CONFIG[event.status]?.text || 'text-neutral-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="text-neutral-300 font-medium">{event.job_card_number || 'Job Card'}</span>
          <span className="text-neutral-500 mx-1.5">&rarr;</span>
          <StatusBadge status={event.status} />
        </p>
        {event.artisan_name && (
          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3" /> {event.artisan_name}
          </p>
        )}
        <p className="text-[10px] text-neutral-600 mt-0.5 font-mono">
          {new Date(event.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {isNew && (
        <span className="text-[9px] uppercase tracking-widest text-gold font-bold bg-gold/10 px-2 py-0.5 rounded-full">new</span>
      )}
    </motion.div>
  );
}

export default function ProductionTracker() {
  const [jobCards, setJobCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const channelRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [jcData, usrs, st] = await Promise.all([
        fetchJobCards({ page_size: 200 }),
        fetchUsers(),
        fetchDashboardStats(),
      ]);
      setJobCards(jcData.items || []);
      setUsers(usrs);
      setStats(st);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to load tracker data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('production-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_cards' }, (payload) => {
        const record = payload.new || payload.old;
        setActivityFeed(prev => [{
          id: `evt-${Date.now()}`,
          type: payload.eventType,
          status: record?.status || 'unknown',
          job_card_number: record?.job_card_number || '',
          artisan_name: null,
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 50));
        // Refresh data on any change
        loadData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qc_logs' }, () => {
        setActivityFeed(prev => [{
          id: `evt-qc-${Date.now()}`,
          type: 'qc_logged',
          status: 'completed',
          job_card_number: 'QC Inspection',
          artisan_name: null,
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 50));
        loadData();
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Polling fallback every 15s
    const interval = setInterval(loadData, 15000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadData]);

  const handleQuickStatus = async (jcId, newStatus) => {
    try {
      await updateJobCardStatus(jcId, newStatus);
      loadData();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const activeJobs = jobCards.filter(jc => jc.status === 'in_progress');
  const pendingJobs = jobCards.filter(jc => jc.status === 'pending');
  const completedToday = jobCards.filter(jc => {
    if (jc.status !== 'completed') return false;
    const created = new Date(jc.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });

  const statusCounts = {};
  jobCards.forEach(jc => {
    statusCounts[jc.status] = (statusCounts[jc.status] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="production-tracker">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Control Tower</h1>
          <p className="text-neutral-500 mt-1 text-sm">Real-time production floor tracker</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator />
          <div className="text-xs text-neutral-600 font-mono">
            {isConnected ? (
              <span className="text-emerald-500">Realtime connected</span>
            ) : (
              <span className="text-amber-500">Polling (15s)</span>
            )}
          </div>
          <button
            data-testid="refresh-tracker-btn"
            onClick={loadData}
            className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Overview Strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = statusCounts[key] || 0;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cfg.bg} border border-white/5 rounded-lg p-4 text-center`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${cfg.text}`} />
              <p className={`text-2xl font-bold font-heading ${cfg.text}`}>{count}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">{cfg.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs - Main Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* In Progress */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">In Progress ({activeJobs.length})</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {activeJobs.length === 0 ? (
                <div className="px-5 py-8 text-center text-neutral-500 text-sm">No active jobs on the floor</div>
              ) : activeJobs.map((jc) => (
                <motion.div
                  key={jc.id}
                  data-testid={`tracker-job-${jc.id}`}
                  layout
                  className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <ProgressRing completed={jc.completed_qty} target={jc.target_qty} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-gold">{jc.product_sku}</span>
                        <span className="text-neutral-600">|</span>
                        <span className="text-sm font-medium truncate">{jc.product_name}</span>
                        {PRIORITY_CONFIG[jc.priority]?.pulse && (
                          <span className="text-[9px] uppercase tracking-widest text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full animate-pulse">
                            {jc.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span className="font-mono">{jc.job_card_number}</span>
                        {jc.artisan_name && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{jc.artisan_name}</span>
                        )}
                        <span>{jc.completed_qty}/{jc.target_qty} pcs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`complete-job-${jc.id}`}
                        onClick={() => handleQuickStatus(jc.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs rounded hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Complete
                      </button>
                      <button
                        onClick={() => handleQuickStatus(jc.id, 'on_hold')}
                        className="px-3 py-1.5 bg-orange-500/15 text-orange-400 text-xs rounded hover:bg-orange-500/25 transition-colors flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Hold
                      </button>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${jc.target_qty > 0 ? (jc.completed_qty / jc.target_qty) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pending Queue */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Pending Queue ({pendingJobs.length})</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {pendingJobs.length === 0 ? (
                <div className="px-5 py-6 text-center text-neutral-500 text-sm">Queue empty</div>
              ) : pendingJobs.map((jc) => (
                <div key={jc.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold">{jc.product_sku}</span>
                        <span className="text-sm">{jc.product_name}</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {jc.job_card_number} | {jc.target_qty} pcs
                        {jc.artisan_name && ` | ${jc.artisan_name}`}
                      </div>
                    </div>
                  </div>
                  <button
                    data-testid={`start-job-${jc.id}`}
                    onClick={() => handleQuickStatus(jc.id, 'in_progress')}
                    className="px-3 py-1.5 bg-blue-500/15 text-blue-400 text-xs rounded hover:bg-blue-500/25 transition-colors flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Activity Feed + Artisan Status */}
        <div className="space-y-4">
          {/* Artisan Workload */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <User className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">Artisan Workload</span>
            </div>
            <div className="px-5 py-3 space-y-3">
              {users.filter(u => u.role === 'artisan').map(user => {
                const userJobs = jobCards.filter(jc => jc.artisan_name === user.name);
                const activeCount = userJobs.filter(jc => jc.status === 'in_progress').length;
                const pendingCount = userJobs.filter(jc => jc.status === 'pending').length;
                return (
                  <div key={user.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                        ${activeCount > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-neutral-500'}`}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeCount > 0 && (
                        <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                          {activeCount} active
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
                          {pendingCount} queued
                        </span>
                      )}
                      {activeCount === 0 && pendingCount === 0 && (
                        <span className="text-[10px] text-neutral-600">idle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">Activity Feed</span>
              </div>
              {activityFeed.length > 0 && (
                <span className="text-[10px] text-neutral-600">{activityFeed.length} events</span>
              )}
            </div>
            <div className="px-5 py-2 max-h-96 overflow-y-auto">
              <AnimatePresence initial={false}>
                {activityFeed.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500 text-sm">
                    <Radio className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p>Waiting for activity...</p>
                    <p className="text-xs text-neutral-600 mt-1">Events will appear here as jobs are updated</p>
                  </div>
                ) : activityFeed.map((evt, i) => (
                  <ActivityFeedItem key={evt.id} event={evt} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="glass-card rounded-lg p-5">
              <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-3">Today's Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Completed Today</span>
                  <span className="text-emerald-400 font-bold">{completedToday.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">QC Pass Rate</span>
                  <span className="text-gold font-bold">{stats.qc_pass_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Inventory Value</span>
                  <span className="font-bold">${stats.total_inventory_value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
