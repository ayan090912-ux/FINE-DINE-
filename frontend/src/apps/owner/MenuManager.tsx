import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { MenuItem, VegType } from '../../types';
import { ImageUploader } from '../../components/common/ImageUploader';
import { VegBadge } from '../../components/common/StatusBadge';
import { Plus, Edit2, Trash2, X, Sparkles, Check, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MenuManager: React.FC = () => {
  const { categories, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, deleteCategory, settings } = useStore();

  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');

  // Item Modal Form State
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  // Category Modal Form State
  const [newCatName, setNewCatName] = useState('');

  const filteredItems = menuItems.filter((i) =>
    selectedCatFilter === 'all' ? true : i.category === selectedCatFilter
  );

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.price) return;

    if (editingItem.id) {
      updateMenuItem(editingItem.id, editingItem);
    } else {
      addMenuItem({
        name: editingItem.name,
        description: editingItem.description || '',
        price: Number(editingItem.price),
        category: editingItem.category || categories[0]?.id || 'cat-1',
        prepTimeMinutes: Number(editingItem.prepTimeMinutes || 15),
        vegType: editingItem.vegType || 'veg',
        available: editingItem.available ?? true,
        isBestSeller: editingItem.isBestSeller ?? false,
        isChefSpecial: editingItem.isChefSpecial ?? false,
        isTodaysSpecial: editingItem.isTodaysSpecial ?? false,
        imageUrl: editingItem.imageUrl || 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800',
        spicyLevel: editingItem.spicyLevel || 0,
      });
    }

    setEditingItem(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      description: 'Artisanal Selection',
      displayOrder: categories.length + 1,
    });
    setNewCatName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'items'
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Menu Dishes ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {activeTab === 'items' && (
          <button
            onClick={() =>
              setEditingItem({
                name: '',
                description: '',
                price: 15.0,
                category: categories[0]?.id || 'cat-1',
                prepTimeMinutes: 15,
                vegType: 'veg',
                available: true,
                imageUrl: '',
                spicyLevel: 0,
              })
            }
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        )}
      </div>

      {/* ITEMS VIEW */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCatFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedCatFilter === 'all'
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              All ({menuItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatFilter(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedCatFilter === c.id
                    ? 'bg-zinc-800 text-amber-400 border-amber-500/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Items Table / Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group"
              >
                <div className="flex gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-zinc-950 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <VegBadge type={item.vegType} />
                      <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                    <p className="text-xs font-extrabold text-amber-400 mt-1">
                      {settings.currencySymbol}{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Flags Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {item.isBestSeller && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      Bestseller
                    </span>
                  )}
                  {item.isChefSpecial && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                      Chef's Special
                    </span>
                  )}
                  {item.isTodaysSpecial && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      Today's Special
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded font-bold ${item.available ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {item.available ? 'Available' : 'Sold Out'}
                  </span>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => updateMenuItem(item.id, { available: !item.available })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      item.available
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.available ? 'Mark Unavailable' : 'Enable Item'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                      title="Edit Dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                      title="Delete Dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES VIEW */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-2xl">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New Category Name (e.g. Seafood & Grills)..."
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 outline-none transition"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
            >
              Add Category
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                  <p className="text-xs text-zinc-500">
                    {menuItems.filter((m) => m.category === cat.id).length} dishes assigned
                  </p>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Add Dish Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingItem.id ? 'Edit Dish Details' : 'Add New Menu Dish'}
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                {/* Image Upload directly from Computer */}
                <ImageUploader
                  label="Dish Image (Drag & Drop or Local Computer Upload)"
                  value={editingItem.imageUrl}
                  onChange={(url) => setEditingItem({ ...editingItem, imageUrl: url })}
                  aspectRatio="cover"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="e.g. Truffle Arancini"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Price ({settings.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      placeholder="18.50"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={editingItem.category || categories[0]?.id}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Dietary Type
                    </label>
                    <select
                      value={editingItem.vegType || 'veg'}
                      onChange={(e) => setEditingItem({ ...editingItem, vegType: e.target.value as VegType })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    >
                      <option value="veg">Pure Veg</option>
                      <option value="non-veg">Non-Veg</option>
                      <option value="egg">Contains Egg</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Describe ingredients and flavor notes..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl p-3 text-xs text-zinc-100 outline-none resize-none"
                  />
                </div>

                {/* Flags Checkboxes */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingItem.isBestSeller || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isBestSeller: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span className="text-zinc-300 font-semibold">Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingItem.isChefSpecial || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isChefSpecial: e.target.checked })}
                      className="accent-rose-500"
                    />
                    <span className="text-zinc-300 font-semibold">Chef's Special</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingItem.isTodaysSpecial || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isTodaysSpecial: e.target.checked })}
                      className="accent-cyan-500"
                    />
                    <span className="text-zinc-300 font-semibold">Today's Special</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
                  >
                    Save Dish Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
