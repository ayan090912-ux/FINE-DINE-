import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Table, TableSection } from '../../types';
import { Plus, Edit2, Trash2, X, Users, MapPin, Merge, LogOut, BookmarkCheck, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TableManager: React.FC = () => {
  const { tables, addTable, updateTable, deleteTable, mergeTables, vacateTable, reserveTable, unreserveTable } = useStore();

  const [editingTable, setEditingTable] = useState<Partial<Table> | null>(null);

  // Merge state
  const [primaryMergeId, setPrimaryMergeId] = useState<string>('');
  const [secondaryMergeId, setSecondaryMergeId] = useState<string>('');
  const [showMergeModal, setShowMergeModal] = useState(false);

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable?.tableNumber || !editingTable?.name) return;

    if (editingTable.id) {
      updateTable(editingTable.id, editingTable);
    } else {
      addTable({
        tableNumber: editingTable.tableNumber,
        name: editingTable.name,
        capacity: Number(editingTable.capacity || 4),
        section: editingTable.section || 'Indoor',
        isActive: editingTable.isActive ?? true,
      });
    }

    setEditingTable(null);
  };

  const handleExecuteMerge = () => {
    if (primaryMergeId && secondaryMergeId && primaryMergeId !== secondaryMergeId) {
      mergeTables(primaryMergeId, secondaryMergeId);
      setShowMergeModal(false);
      setPrimaryMergeId('');
      setSecondaryMergeId('');
    }
  };

  const sections: TableSection[] = ['Indoor', 'Outdoor', 'VIP', 'Rooftop'];

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white">Dining Tables Floor Manager</h3>
          <p className="text-xs text-zinc-400">Manage dining sessions, vacate tables, reserve seating & merging</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMergeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center gap-2 border border-zinc-700 transition"
          >
            <Merge className="w-4 h-4" />
            <span>Merge Tables</span>
          </button>

          <button
            onClick={() =>
              setEditingTable({
                tableNumber: `0${tables.length + 1}`,
                name: `Table 0${tables.length + 1}`,
                capacity: 4,
                section: 'Indoor',
                isActive: true,
              })
            }
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Table</span>
          </button>
        </div>
      </div>

      {/* Grid by Sections */}
      <div className="space-y-6">
        {sections.map((sec) => {
          const sectionTables = tables.filter((t) => t.section === sec);
          if (sectionTables.length === 0) return null;

          return (
            <div key={sec} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{sec} Dining Area ({sectionTables.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sectionTables.map((t) => {
                  const status = t.status || (t.isOccupied ? 'OCCUPIED' : 'VACANT');
                  const isOccupied = status === 'OCCUPIED';
                  const isReserved = status === 'RESERVED';

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border bg-zinc-900 flex flex-col justify-between space-y-3 transition relative ${
                        !t.isActive
                          ? 'opacity-50 border-zinc-800'
                          : isOccupied
                          ? 'border-amber-500/50 bg-amber-950/10'
                          : isReserved
                          ? 'border-purple-500/50 bg-purple-950/10'
                          : 'border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-amber-400">TABLE {t.tableNumber}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isOccupied
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                : isReserved
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-zinc-200 mt-1">{t.name}</h5>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-2">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Capacity: {t.capacity} Guests</span>
                        </div>
                      </div>

                      {/* Session Actions */}
                      <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                        {isOccupied && (
                          <button
                            onClick={() => vacateTable(t.id)}
                            className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Vacate Table</span>
                          </button>
                        )}

                        {!isOccupied && !isReserved && (
                          <button
                            onClick={() => reserveTable(t.id)}
                            className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-purple-500/30 transition"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Reserve Table</span>
                          </button>
                        )}

                        {isReserved && (
                          <button
                            onClick={() => unreserveTable(t.id)}
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Unreserve Table</span>
                          </button>
                        )}

                        {/* Edit & Delete Controls */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            onClick={() => updateTable(t.id, { isActive: !t.isActive })}
                            className="text-zinc-400 hover:text-white font-medium"
                          >
                            {t.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingTable(t)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTable(t.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Create/Edit Modal */}
      <AnimatePresence>
        {editingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingTable.id ? 'Edit Table Settings' : 'Create New Table'}
                </h3>
                <button
                  onClick={() => setEditingTable(null)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTable.tableNumber || ''}
                      onChange={(e) => setEditingTable({ ...editingTable, tableNumber: e.target.value })}
                      placeholder="01"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Capacity (Guests)
                    </label>
                    <input
                      type="number"
                      required
                      value={editingTable.capacity || 4}
                      onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Table Name / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTable.name || ''}
                    onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                    placeholder="e.g. Garden Terrace Window"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Dining Section
                  </label>
                  <select
                    value={editingTable.section || 'Indoor'}
                    onChange={(e) => setEditingTable({ ...editingTable, section: e.target.value as TableSection })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  >
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
                  >
                    Save Table
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Merge Modal */}
      <AnimatePresence>
        {showMergeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Merge Tables for Large Groups</h3>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Primary Table (Keep Active)
                  </label>
                  <select
                    value={primaryMergeId}
                    onChange={(e) => setPrimaryMergeId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  >
                    <option value="">Select Primary Table...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Secondary Table to Merge Into Primary
                  </label>
                  <select
                    value={secondaryMergeId}
                    onChange={(e) => setSecondaryMergeId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  >
                    <option value="">Select Secondary Table...</option>
                    {tables
                      .filter((t) => t.id !== primaryMergeId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Table {t.tableNumber} - {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteMerge}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                >
                  Execute Merge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
