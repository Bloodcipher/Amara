import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, Copy, Check } from 'lucide-react';
import { fetchMigrations } from '@/lib/api';

export default function MigrationViewer() {
  const [migrations, setMigrations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const loadMigrations = useCallback(async () => {
    try {
      const data = await fetchMigrations();
      setMigrations(data);
      if (data.length > 0) setActive(data[0].filename);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMigrations(); }, [loadMigrations]);

  const handleCopy = async (content, filename) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = content;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(filename);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeFile = migrations.find(m => m.filename === active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="migration-viewer">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold tracking-tight">SQL Migrations</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          {migrations.length} migration files executed against Supabase PostgreSQL
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* File list */}
        <div className="w-72 flex-shrink-0 glass-card rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-gold" />
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Files</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {migrations.map((m, idx) => (
              <button
                key={m.filename}
                data-testid={`migration-file-${idx}`}
                onClick={() => setActive(m.filename)}
                className={`w-full text-left px-4 py-3 text-xs font-mono transition-all border-b border-white/[0.02]
                  ${active === m.filename
                    ? 'bg-white/5 text-gold border-l-2 border-l-gold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
              >
                {m.filename}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 glass-card rounded-lg overflow-hidden flex flex-col">
          {activeFile && (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                <span className="text-sm font-mono text-gold">{activeFile.filename}</span>
                <button
                  data-testid="copy-sql-btn"
                  onClick={() => handleCopy(activeFile.content, activeFile.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
                >
                  {copied === activeFile.filename ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy SQL</>
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <pre className="text-sm font-mono leading-relaxed text-neutral-300 whitespace-pre-wrap">
                  {activeFile.content}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
