import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Factory, Plus, X } from 'lucide-react';
import { fetchDices, createDice, fetchDiceMotifMappings, createDiceMotifMapping,
         fetchDiceLockingMappings, createDiceLockingMapping, fetchLookup } from '@/lib/api';

export default function Manufacturing() {
  const [dices, setDices] = useState([]);
  const [motifMappings, setMotifMappings] = useState([]);
  const [lockingMappings, setLockingMappings] = useState([]);
  const [motifs, setMotifs] = useState([]);
  const [lockings, setLockings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dices');
  const [showForm, setShowForm] = useState(false);
  const [diceForm, setDiceForm] = useState({ dice_number: '', dice_type: '', description: '' });
  const [mapForm, setMapForm] = useState({ dice_id: '', target_id: '' });

  const loadData = useCallback(async () => {
    try {
      const [d, mm, lm, mots, locks] = await Promise.all([
        fetchDices(), fetchDiceMotifMappings(), fetchDiceLockingMappings(),
        fetchLookup('motif'), fetchLookup('locking'),
      ]);
      setDices(d); setMotifMappings(mm); setLockingMappings(lm);
      setMotifs(mots); setLockings(locks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateDice = async () => {
    if (!diceForm.dice_number || !diceForm.dice_type) return;
    try {
      await createDice(diceForm);
      setDiceForm({ dice_number: '', dice_type: '', description: '' });
      setShowForm(false);
      loadData();
    } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
  };

  const handleCreateMapping = async () => {
    if (!mapForm.dice_id || !mapForm.target_id) return;
    try {
      if (activeTab === 'motif-map') await createDiceMotifMapping(mapForm);
      else await createDiceLockingMapping(mapForm);
      setMapForm({ dice_id: '', target_id: '' });
      setShowForm(false);
      loadData();
    } catch (e) { alert(e?.response?.data?.detail || 'Error'); }
  };

  const tabs = [
    { id: 'dices', label: 'Dices' },
    { id: 'motif-map', label: 'Motif Mappings' },
    { id: 'locking-map', label: 'Locking Mappings' },
  ];

  return (
    <div data-testid="manufacturing">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Manufacturing</h1>
          <p className="text-neutral-500 mt-1 text-sm">Dices and attribute mappings for production</p>
        </div>
        <button
          data-testid="add-manufacturing-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-6 py-3 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add New'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            data-testid={`mfg-tab-${t.id}`}
            onClick={() => { setActiveTab(t.id); setShowForm(false); }}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-all
              ${activeTab === t.id ? 'bg-gold text-black' : 'bg-white/5 text-neutral-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg p-6 mb-6">
          {activeTab === 'dices' ? (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Dice Number</label>
                <input data-testid="dice-number-input" value={diceForm.dice_number}
                  onChange={(e) => setDiceForm({ ...diceForm, dice_number: e.target.value })} placeholder="D-107"
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Type</label>
                <select data-testid="dice-type-select" value={diceForm.dice_type}
                  onChange={(e) => setDiceForm({ ...diceForm, dice_type: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                  <option value="">Select type</option>
                  {['stamping','casting','embossing','cutting','filigree','forming'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Description</label>
                <input value={diceForm.description} onChange={(e) => setDiceForm({ ...diceForm, description: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none" />
              </div>
              <button data-testid="save-dice-btn" onClick={handleCreateDice}
                className="px-6 h-10 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Dice</label>
                <select data-testid="mapping-dice-select" value={mapForm.dice_id}
                  onChange={(e) => setMapForm({ ...mapForm, dice_id: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                  <option value="">Select dice</option>
                  {dices.map(d => <option key={d.id} value={d.id}>{d.dice_number} ({d.dice_type})</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">
                  {activeTab === 'motif-map' ? 'Motif' : 'Locking'}
                </label>
                <select data-testid="mapping-target-select" value={mapForm.target_id}
                  onChange={(e) => setMapForm({ ...mapForm, target_id: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-md h-10 px-3 text-sm focus:border-gold/50 outline-none">
                  <option value="">Select</option>
                  {(activeTab === 'motif-map' ? motifs : lockings).map(item => (
                    <option key={item.id} value={item.id}>[{item.code}] {item.name}</option>
                  ))}
                </select>
              </div>
              <button data-testid="save-mapping-btn" onClick={handleCreateMapping}
                className="px-6 h-10 bg-gold text-black text-xs uppercase tracking-wider font-semibold hover:bg-gold-dark transition-colors">
                Save
              </button>
            </div>
          )}
        </motion.div>
      )}

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <Factory className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium">
            {activeTab === 'dices' ? `${dices.length} Dices` :
             activeTab === 'motif-map' ? `${motifMappings.length} Motif Mappings` :
             `${lockingMappings.length} Locking Mappings`}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'dices' ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-950/80">
                    {['Dice Number', 'Type', 'Description', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dices.map(d => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-6 font-mono text-gold text-sm">{d.dice_number}</td>
                      <td className="py-3 px-6 text-sm capitalize">{d.dice_type}</td>
                      <td className="py-3 px-6 text-sm text-neutral-400">{d.description || '-'}</td>
                      <td className="py-3 px-6">
                        <span className={`text-xs px-2 py-0.5 rounded ${d.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-950/80">
                    {['Dice', 'Attribute', 'Code'].map(h => (
                      <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-3 px-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'motif-map' ? motifMappings : lockingMappings).map(m => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-6 font-mono text-gold text-sm">{m.dice_number}</td>
                      <td className="py-3 px-6 text-sm">{m.target_name}</td>
                      <td className="py-3 px-6 font-mono text-gold text-xs">{m.target_code}</td>
                    </tr>
                  ))}
                  {(activeTab === 'motif-map' ? motifMappings : lockingMappings).length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-neutral-500 text-sm">No mappings yet</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
