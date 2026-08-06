import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { VegBadge } from '../../components/common/StatusBadge';
import { X, Clock, Flame, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveMediaUrl } from '../../services/api';

interface FoodDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes: string) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, notes);
    onClose();
    setQuantity(1);
    setNotes('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-zinc-950/70 border border-zinc-800 text-zinc-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Header Image */}
          <div className="relative h-64 shrink-0 bg-zinc-950">
            <img
              src={resolveMediaUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30" />
            
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <VegBadge type={item.vegType} />
              {item.isBestSeller && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-zinc-950 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Bestseller
                </span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{item.name}</h2>
                <span className="text-lg font-extrabold text-amber-400">
                  {settings.currencySymbol}{item.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Prep Time: {item.prepTimeMinutes} mins
                </span>
                {item.spicyLevel && item.spicyLevel > 0 ? (
                  <span className="flex items-center gap-1 text-rose-400">
                    <Flame className="w-3.5 h-3.5" />
                    Spicy ({'🌶️'.repeat(item.spicyLevel)})
                  </span>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/80">
              {item.description}
            </p>

            {/* Cooking Instructions / Special Requests */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Special Preparation Requests
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra sauce, no onions, dressing on side..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/95 flex items-center gap-3 shrink-0">
            {/* Quantity Controls */}
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-zinc-400 hover:text-white transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-white w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-zinc-400 hover:text-white transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAdd}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart • {settings.currencySymbol}{(item.price * quantity).toFixed(2)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
