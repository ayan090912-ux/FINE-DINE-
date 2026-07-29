import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, BellRing, Clock, Star, MapPin } from 'lucide-react';

interface CustomerHeaderProps {
  tableNumber: string;
  tableName: string;
  cartCount: number;
  activeOrderCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenCallWaiter: () => void;
  onOpenFeedback: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  tableNumber,
  tableName,
  cartCount,
  activeOrderCount,
  onOpenCart,
  onOpenOrders,
  onOpenCallWaiter,
  onOpenFeedback,
}) => {
  const { settings } = useStore();

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-xl px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Table */}
        <div className="flex items-center gap-3">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={settings.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shadow-md"
            />
          )}
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{settings.name}</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                <MapPin className="w-3 h-3" />
                Table {tableNumber}
              </span>
              <span className="hidden sm:inline text-zinc-500">• {tableName}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Feedback */}
          <button
            onClick={onOpenFeedback}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-amber-400 transition"
            title="Leave Feedback"
          >
            <Star className="w-4 h-4" />
          </button>

          {/* Call Waiter */}
          <button
            onClick={onOpenCallWaiter}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-amber-400 transition flex items-center gap-1.5"
            title="Call Waiter"
          >
            <BellRing className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Service</span>
          </button>

          {/* Active Orders Tracker */}
          <button
            onClick={onOpenOrders}
            className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition"
            title="Track Orders"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            {activeOrderCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                {activeOrderCount}
              </span>
            )}
          </button>

          {/* Cart Drawer */}
          <button
            onClick={onOpenCart}
            className="relative px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">Cart</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 text-amber-400 text-[10px] font-extrabold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
