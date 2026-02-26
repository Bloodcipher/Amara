import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ArrowRight } from 'lucide-react';
import { fetchLookup, previewSKU } from '@/lib/api';

const SLOTS = [
  { key: 'face_value', label: 'Face Value', position: 1 },
  { key: 'category', label: 'Category', position: 2 },
  { key: 'material', label: 'Material', position: 3 },
  { key: 'motif', label: 'Motif', position: 4 },
  { key: 'finding', label: 'Finding', position: 5 },
  { key: 'locking', label: 'Locking', position: 6 },
  { key: 'size', label: 'Size', position: 7 },
];

export default function SKUGenerator() {
  const [lookups, setLookups] = useState({});
  const [selected, setSelected] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const promises = SLOTS.map(slot => fetchLookup(slot.key));
      const responses = await Promise.all(promises);
      const results = {};
      SLOTS.forEach((slot, i) => { results[slot.key] = responses[i]; });
      setLookups(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const allSelected = SLOTS.every(s => selected[s.key]);

  const handlePreview = async () => {
    if (!allSelected) return;
    setGenerating(true);
    setPreview(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      const data = await previewSKU({
        name: 'Preview',
        face_value_id: selected.face_value,
        category_id: selected.category,
        material_id: selected.material,
        motif_id: selected.motif,
        finding_id: selected.finding,
        locking_id: selected.locking,
        size_id: selected.size,
      });
      setPreview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const getSelectedCode = (key) => {
    const items = lookups[key] || [];
    const item = items.find(i => i.id === selected[key]);
    return item?.code || '_';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="sku-generator">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold tracking-tight">SKU Generator</h1>
        <p className="text-neutral-500 mt-1 text-sm">Interactive Base-36 SKU preview tool</p>
      </div>

      {/* SKU Preview Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-lg p-8 mb-8 text-center"
      >
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">Generated SKU Preview</p>
        <div className="flex items-center justify-center gap-1">
          {SLOTS.map((slot, i) => (
            <motion.div
              key={slot.key}
              animate={{ scale: selected[slot.key] ? 1 : 0.9 }}
              className={`w-12 h-14 flex items-center justify-center rounded text-lg font-mono font-bold
                ${selected[slot.key]
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'bg-white/5 text-neutral-600 border border-white/10'
                }`}
            >
              {getSelectedCode(slot.key)}
            </motion.div>
          ))}
          <div className="w-4 flex items-center justify-center text-neutral-600">
            <ArrowRight className="w-4 h-4" />
          </div>
          {(preview ? preview.suffix.split('') : ['_', '_', '_']).map((ch, i) => (
            <motion.div
              key={`suffix-${i}`}
              animate={{ scale: preview ? 1 : 0.9 }}
              className={`w-12 h-14 flex items-center justify-center rounded text-lg font-mono font-bold
                ${preview
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-white/5 text-neutral-600 border border-white/10'
                }`}
            >
              {ch}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4"
            >
              <p className="text-2xl font-mono text-gold tracking-[0.3em]">{preview.full_sku}</p>
              <p className="text-xs text-neutral-500 mt-2">Sequence #{preview.next_sequence} for prefix {preview.prefix}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Slot Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {SLOTS.map((slot, idx) => (
          <motion.div
            key={slot.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="glass-card rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs text-gold font-mono">Position {slot.position}</span>
                <h4 className="text-sm font-medium">{slot.label}</h4>
              </div>
              <span className="text-2xl font-mono font-bold text-gold">{getSelectedCode(slot.key)}</span>
            </div>
            <select
              data-testid={`select-${slot.key}`}
              value={selected[slot.key] || ''}
              onChange={(e) => {
                setSelected({ ...selected, [slot.key]: e.target.value });
                setPreview(null);
              }}
              className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/20 outline-none"
            >
              <option value="">Select {slot.label}</option>
              {(lookups[slot.key] || []).map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.code}] {item.name}
                </option>
              ))}
            </select>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          data-testid="generate-sku-btn"
          onClick={handlePreview}
          disabled={!allSelected || generating}
          className={`flex items-center gap-2 px-8 py-4 text-sm uppercase tracking-wider font-semibold transition-all duration-300
            ${allSelected
              ? 'bg-gold text-black hover:bg-gold-dark shadow-[0_0_25px_rgba(212,175,55,0.3)]'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
        >
          {generating ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          {generating ? 'Generating...' : 'Preview SKU'}
        </button>
      </div>

      {/* Base-36 Reference */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 glass-card rounded-lg p-6"
      >
        <h3 className="font-heading text-lg font-bold mb-3">Base-36 Encoding Reference</h3>
        <p className="text-sm text-neutral-400 mb-4">
          The suffix uses Base-36 encoding (0-9, A-Z) to compress sequence numbers into 3 characters.
          Maximum capacity per prefix: 46,656 unique SKUs (000 to ZZZ).
        </p>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch, i) => (
            <div key={ch} className="text-center p-2 bg-white/[0.02] rounded border border-white/5">
              <span className="text-xs font-mono text-gold">{ch}</span>
              <span className="block text-[10px] text-neutral-500">{i}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
