import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Database, Key, ArrowRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { fetchERDiagram } from '@/lib/api';

const TABLE_GROUPS = {
  'SKU Lookups': ['sku_face_value', 'sku_category', 'sku_material', 'sku_motif', 'sku_finding', 'sku_locking', 'sku_size'],
  'Core': ['products', 'users'],
  'Manufacturing': ['dices', 'dice_motif_mapping', 'dice_locking_mapping'],
  'Production': ['job_cards', 'qc_logs'],
  'Inventory': ['inventory', 'production'],
};

const GROUP_COLORS = {
  'SKU Lookups': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: '#F59E0B' },
  'Core': { bg: 'bg-gold/10', border: 'border-gold/30', text: 'text-gold', accent: '#D4AF37' },
  'Manufacturing': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: '#3B82F6' },
  'Production': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: '#8B5CF6' },
  'Inventory': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: '#10B981' },
};

function getGroupForTable(tableName) {
  for (const [group, tables] of Object.entries(TABLE_GROUPS)) {
    if (tables.includes(tableName)) return group;
  }
  return 'Core';
}

function TypeBadge({ type }) {
  const short = type === 'uuid' ? 'UUID' : type === 'character varying' ? 'VARCHAR' :
    type === 'integer' ? 'INT' : type === 'boolean' ? 'BOOL' :
    type === 'timestamp with time zone' ? 'TIMESTAMPTZ' : type === 'numeric' ? 'DECIMAL' :
    type === 'text' ? 'TEXT' : type === 'character' ? 'CHAR' : type === 'date' ? 'DATE' : type.toUpperCase();
  return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-500">{short}</span>;
}

export default function ERDiagram() {
  const [erData, setErData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [zoom, setZoom] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchERDiagram();
      setErData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!erData) return <div className="text-neutral-500 text-center py-10">Failed to load schema</div>;

  const { tables, relationships, schema } = erData;
  const selectedSchema = selectedTable ? schema[selectedTable] : null;
  const selectedRels = selectedTable
    ? relationships.filter(r => r.from_table === selectedTable || r.to_table === selectedTable)
    : [];

  return (
    <div data-testid="er-diagram">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight">Schema Explorer</h1>
          <p className="text-neutral-500 mt-1 text-sm">
            {tables.length} tables, {relationships.length} foreign key relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-neutral-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1); setSelectedTable(null); }} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Table Grid */}
        <div className="flex-1">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.3s' }}>
            {Object.entries(TABLE_GROUPS).map(([groupName, groupTables]) => {
              const colors = GROUP_COLORS[groupName];
              return (
                <div key={groupName} className="mb-6">
                  <h3 className={`text-xs uppercase tracking-widest font-semibold mb-3 ${colors.text}`}>
                    {groupName}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {groupTables.filter(t => tables.includes(t)).map((tbl) => {
                      const isSelected = selectedTable === tbl;
                      const cols = schema[tbl] || [];
                      const pkCols = cols.filter(c => c.is_pk);
                      const fkCols = relationships.filter(r => r.from_table === tbl);
                      const incomingFks = relationships.filter(r => r.to_table === tbl);

                      return (
                        <motion.div
                          key={tbl}
                          data-testid={`table-card-${tbl}`}
                          onClick={() => setSelectedTable(isSelected ? null : tbl)}
                          whileHover={{ scale: 1.02 }}
                          className={`cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden
                            ${isSelected
                              ? `${colors.bg} ${colors.border} border-2 shadow-lg`
                              : 'bg-neutral-950/60 border-white/5 hover:border-white/15'
                            }`}
                        >
                          <div className={`px-3 py-2 border-b ${isSelected ? colors.border : 'border-white/5'} flex items-center gap-2`}>
                            <Database className={`w-3.5 h-3.5 ${isSelected ? colors.text : 'text-neutral-500'}`} />
                            <span className={`text-xs font-mono font-bold ${isSelected ? colors.text : 'text-neutral-300'}`}>
                              {tbl}
                            </span>
                          </div>
                          <div className="px-3 py-2 space-y-0.5 max-h-32 overflow-y-auto">
                            {cols.slice(0, 6).map(col => (
                              <div key={col.column} className="flex items-center gap-1.5">
                                {col.is_pk && <Key className="w-2.5 h-2.5 text-gold flex-shrink-0" />}
                                <span className={`text-[10px] font-mono ${col.is_pk ? 'text-gold' : 'text-neutral-400'}`}>
                                  {col.column}
                                </span>
                              </div>
                            ))}
                            {cols.length > 6 && (
                              <span className="text-[9px] text-neutral-600">+{cols.length - 6} more</span>
                            )}
                          </div>
                          <div className="px-3 py-1.5 bg-black/20 flex items-center gap-3">
                            <span className="text-[9px] text-neutral-500">{cols.length} cols</span>
                            {fkCols.length > 0 && <span className="text-[9px] text-blue-400">{fkCols.length} FK out</span>}
                            {incomingFks.length > 0 && <span className="text-[9px] text-emerald-400">{incomingFks.length} FK in</span>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedTable && selectedSchema && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 flex-shrink-0 glass-card rounded-lg overflow-hidden sticky top-6 self-start max-h-[calc(100vh-160px)] overflow-y-auto"
          >
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Database className={`w-4 h-4 ${GROUP_COLORS[getGroupForTable(selectedTable)]?.text || 'text-gold'}`} />
              <span className="font-mono text-sm font-bold">{selectedTable}</span>
            </div>

            {/* Columns */}
            <div className="px-5 py-3">
              <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-2">Columns ({selectedSchema.length})</h4>
              <div className="space-y-1.5">
                {selectedSchema.map(col => (
                  <div key={col.column} className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                    <div className="flex items-center gap-2">
                      {col.is_pk && <Key className="w-3 h-3 text-gold" />}
                      <span className={`text-xs font-mono ${col.is_pk ? 'text-gold font-bold' : 'text-neutral-300'}`}>{col.column}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={col.type} />
                      {col.nullable === 'YES' && <span className="text-[9px] text-neutral-600">NULL</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relationships */}
            {selectedRels.length > 0 && (
              <div className="px-5 py-3 border-t border-white/5">
                <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-medium mb-2">
                  Relationships ({selectedRels.length})
                </h4>
                <div className="space-y-2">
                  {selectedRels.map((rel, i) => {
                    const isOutgoing = rel.from_table === selectedTable;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`font-mono ${isOutgoing ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {isOutgoing ? rel.from_column : rel.to_column}
                        </span>
                        <ArrowRight className="w-3 h-3 text-neutral-600" />
                        <button
                          onClick={() => setSelectedTable(isOutgoing ? rel.to_table : rel.from_table)}
                          className="font-mono text-gold hover:underline"
                        >
                          {isOutgoing ? `${rel.to_table}.${rel.to_column}` : `${rel.from_table}.${rel.from_column}`}
                        </button>
                        <span className="text-[9px] text-neutral-600">{isOutgoing ? 'FK OUT' : 'FK IN'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Relationship Matrix */}
      <div className="mt-8 glass-card rounded-lg p-6">
        <h3 className="font-heading text-lg font-bold mb-4">Foreign Key Map</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-950/80">
                {['Source Table', 'Source Column', '', 'Target Table', 'Target Column'].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-widest text-neutral-500 font-medium py-2.5 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relationships.map((rel, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2 px-4">
                    <button onClick={() => setSelectedTable(rel.from_table)} className="text-xs font-mono text-blue-400 hover:underline">{rel.from_table}</button>
                  </td>
                  <td className="py-2 px-4 text-xs font-mono text-neutral-400">{rel.from_column}</td>
                  <td className="py-2 px-4"><ArrowRight className="w-3 h-3 text-neutral-600" /></td>
                  <td className="py-2 px-4">
                    <button onClick={() => setSelectedTable(rel.to_table)} className="text-xs font-mono text-emerald-400 hover:underline">{rel.to_table}</button>
                  </td>
                  <td className="py-2 px-4 text-xs font-mono text-neutral-400">{rel.to_column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
