import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Promotion, DiscountType } from '../../types';
import { Tag, Plus, Trash2, Check, X, Calendar, DollarSign, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PromotionsManager: React.FC = () => {
  const { promotions, createPromotion, deletePromotion, togglePromotion, settings } = useStore();

  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);

  const offerTags = [
    'Happy Hour',
    'Weekend Offer',
    'Festival Offer',
    'Student Discount',
    'BOGO',
    'Flash Sale',
    'Free Drink',
    'Free Dessert',
  ] as const;

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo?.title || !editingPromo?.discountValue) return;

    createPromotion({
      title: editingPromo.title,
      description: editingPromo.description || '',
      discountType: editingPromo.discountType || 'percentage',
      discountValue: Number(editingPromo.discountValue),
      minimumOrderAmount: Number(editingPromo.minimumOrderAmount || 0),
      maxDiscountAmount: editingPromo.maxDiscountAmount ? Number(editingPromo.maxDiscountAmount) : undefined,
      offerTag: editingPromo.offerTag || 'Happy Hour',
      startDate: editingPromo.startDate || new Date().toISOString().split('T')[0],
      endDate: editingPromo.endDate || '2026-12-31',
      isActive: editingPromo.isActive ?? true,
    });

    setEditingPromo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <span>Promotions & Offers Engine</span>
          </h3>
          <p className="text-xs text-zinc-400">Configure discounts, BOGO specials, and automatic guest incentives</p>
        </div>

        <button
          onClick={() =>
            setEditingPromo({
              title: 'Happy Hour 15% Off',
              description: 'Special dining discount on minimum orders',
              discountType: 'percentage',
              discountValue: 15,
              minimumOrderAmount: 30,
              offerTag: 'Happy Hour',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '2026-12-31',
              isActive: true,
            })
          }
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className={`p-5 rounded-2xl border bg-zinc-900 flex flex-col justify-between space-y-4 transition ${
              promo.isActive ? 'border-amber-500/40' : 'border-zinc-800 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase">
                  {promo.offerTag}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {promo.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{promo.title}</h4>
              <p className="text-xs text-zinc-400">{promo.description}</p>

              <div className="pt-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
                {promo.discountType === 'percentage' ? (
                  <span className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    <Percent className="w-3.5 h-3.5" />
                    {promo.discountValue}% OFF
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    <DollarSign className="w-3.5 h-3.5" />
                    {settings.currencySymbol}{promo.discountValue} FLAT OFF
                  </span>
                )}
                <span className="text-zinc-500 text-[11px]">Min order {settings.currencySymbol}{promo.minimumOrderAmount}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <button
                onClick={() => togglePromotion(promo.id)}
                className="text-amber-400 font-semibold hover:underline"
              >
                {promo.isActive ? 'Disable Offer' : 'Enable Offer'}
              </button>

              <button
                onClick={() => deletePromotion(promo.id)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Promotion Modal */}
      <AnimatePresence>
        {editingPromo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white">Create Promotional Discount</h3>
                <button
                  onClick={() => setEditingPromo(null)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePromo} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Promotion Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPromo.title || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Offer Type Tag
                  </label>
                  <select
                    value={editingPromo.offerTag || 'Happy Hour'}
                    onChange={(e) => setEditingPromo({ ...editingPromo, offerTag: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  >
                    {offerTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Discount Calculation
                    </label>
                    <select
                      value={editingPromo.discountType || 'percentage'}
                      onChange={(e) => setEditingPromo({ ...editingPromo, discountType: e.target.value as DiscountType })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ({settings.currencySymbol})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingPromo.discountValue || ''}
                      onChange={(e) => setEditingPromo({ ...editingPromo, discountValue: parseFloat(e.target.value) })}
                      placeholder="e.g. 20"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Minimum Order Subtotal ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={editingPromo.minimumOrderAmount || 0}
                    onChange={(e) => setEditingPromo({ ...editingPromo, minimumOrderAmount: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingPromo.description || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingPromo(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                  >
                    Save Promotion
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
