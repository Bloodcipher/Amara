import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Tags, Package, Factory, ClipboardList,
  Warehouse, FileCode, Wand2, ChevronLeft, ChevronRight, Gem
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sku-config', label: 'SKU Configuration', icon: Tags },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'sku-generator', label: 'SKU Generator', icon: Wand2 },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory },
  { id: 'production', label: 'Production & QC', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'migrations', label: 'SQL Migrations', icon: FileCode },
];

export default function Sidebar({ activePage, onNavigate, onWidthChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onWidthChange) onWidthChange(next ? 72 : 256);
  };

  return (
    <motion.aside
      data-testid="sidebar"
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-[#050505] border-r border-white/5 z-50 flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center flex-shrink-0">
          <Gem className="w-4 h-4 text-black" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading text-lg font-bold text-gold tracking-wider whitespace-nowrap overflow-hidden"
            >
              AMARA
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white/5 text-gold'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-l"
                />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gold' : 'group-hover:text-white'}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      <button
        data-testid="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-white/5 text-neutral-500 hover:text-gold transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
