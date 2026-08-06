import React from 'react';
import { MenuItem } from '../../types';
import { VegBadge } from '../../components/common/StatusBadge';
import { Plus, Flame, Sparkles, Clock, Minus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

import { resolveMediaUrl } from '../../services/api';

interface FoodCardProps {
  item: MenuItem;
  quantityInCart: number;
  onUpdateCart: (quantity: number) => void;
  onSelect: () => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  quantityInCart,
  onUpdateCart,
  onSelect,
}) => {
  const { settings } = useStore();

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/90 hover:border-zinc-700/80 rounded-2xl p-3.5 flex gap-3.5 transition group relative overflow-hidden">
      {/* Item Image */}
      <div
        onClick={onSelect}
        className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={resolveMediaUrl(item.imageUrl)}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-1.5 left-1.5">
          <VegBadge type={item.vegType} />
        </div>
        {item.spicyLevel && item.spicyLevel > 0 ? (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-rose-500/30 text-[10px] text-rose-400 flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5" />
            <span>{'🌶️'.repeat(item.spicyLevel)}</span>
          </div>
        ) : null}
      </div>

      {/* Item Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Tag Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {item.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> Bestseller
              </span>
            )}
            {item.isChefSpecial && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                Chef's Special
              </span>
            )}
            {item.isTodaysSpecial && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                Today's Special
              </span>
            )}
          </div>

          <h3
            onClick={onSelect}
            className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition cursor-pointer line-clamp-1"
          >
            {item.name}
          </h3>

          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Add Controls */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white">
              {settings.currencySymbol}{item.price.toFixed(2)}
            </span>
            <span className="text-[11px] text-zinc-500 flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-zinc-600" />
              {item.prepTimeMinutes}m
            </span>
          </div>

          {quantityInCart > 0 ? (
            <div className="flex items-center gap-2 bg-amber-500 text-zinc-950 px-2 py-1 rounded-xl font-bold text-xs shadow-md">
              <button
                onClick={() => onUpdateCart(quantityInCart - 1)}
                className="p-1 hover:bg-amber-600/30 rounded-lg transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-xs">{quantityInCart}</span>
              <button
                onClick={() => onUpdateCart(quantityInCart + 1)}
                className="p-1 hover:bg-amber-600/30 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onUpdateCart(1)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 font-bold text-xs transition border border-zinc-700/80 hover:border-amber-400 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
