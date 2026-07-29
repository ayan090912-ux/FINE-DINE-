import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Trash2, Plus, Minus, Tag, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VegBadge } from '../../components/common/StatusBadge';

export interface CartItem {
  menuItemId: string;
  quantity: number;
  specialNotes?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  tableId: string;
  onUpdateQuantity: (menuItemId: string, qty: number) => void;
  onClearCart: () => void;
  onOrderPlaced: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  tableId,
  onUpdateQuantity,
  onClearCart,
  onOrderPlaced,
}) => {
  const { menuItems, promotions, settings, createOrder } = useStore();
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate cart subtotal
  const cartDetails = cart.map((c) => {
    const item = menuItems.find((m) => m.id === c.menuItemId);
    return {
      ...c,
      item,
      lineTotal: item ? item.price * c.quantity : 0,
    };
  });

  const subtotal = cartDetails.reduce((acc, curr) => acc + curr.lineTotal, 0);

  // Active promotions evaluation
  const activePromos = promotions.filter((p) => p.isActive && subtotal >= p.minimumOrderAmount);

  let discountAmount = 0;
  let activePromoName = '';

  const activePromo = selectedPromoId
    ? promotions.find((p) => p.id === selectedPromoId)
    : activePromos[0]; // Auto pick best promo

  if (activePromo && subtotal >= activePromo.minimumOrderAmount) {
    activePromoName = activePromo.title;
    if (activePromo.discountType === 'percentage') {
      discountAmount = (subtotal * activePromo.discountValue) / 100;
      if (activePromo.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, activePromo.maxDiscountAmount);
      }
    } else if (activePromo.discountType === 'flat') {
      discountAmount = activePromo.discountValue;
    }
  }

  const taxAmount = (subtotal - discountAmount) * (settings.taxPercentage / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      createOrder(
        tableId,
        cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, specialNotes: c.specialNotes })),
        activePromoName,
        discountAmount
      );
      setIsSubmitting(false);
      onClearCart();
      onOrderPlaced();
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl relative"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Your Order Basket</span>
              </h2>
              <p className="text-xs text-zinc-400">Review items before placing order</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartDetails.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 space-y-3">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                  <Tag className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-zinc-400">Your basket is currently empty</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto">Browse our artisanal menu and add delicious items to get started!</p>
              </div>
            ) : (
              cartDetails.map(({ menuItemId, quantity, specialNotes, item, lineTotal }) => {
                if (!item) return null;
                return (
                  <div key={menuItemId} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 relative">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1">
                        <VegBadge type={item.vegType} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-amber-400 mt-0.5">
                        {settings.currencySymbol}{lineTotal.toFixed(2)}
                      </p>
                      {specialNotes && (
                        <p className="text-[10px] text-zinc-400 italic line-clamp-1 mt-0.5">
                          Note: "{specialNotes}"
                        </p>
                      )}
                    </div>

                    {/* Quantity Adjustment */}
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(menuItemId, quantity - 1)}
                        className="text-zinc-400 hover:text-amber-400 transition"
                      >
                        {quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-400" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(menuItemId, quantity + 1)}
                        className="text-zinc-400 hover:text-amber-400 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Applicable Promotions Banner */}
            {cartDetails.length > 0 && activePromos.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Active Promotions Applied</span>
                </div>
                <div className="space-y-1.5">
                  {activePromos.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPromoId(p.id)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        (selectedPromoId === p.id || (!selectedPromoId && p.id === activePromos[0]?.id))
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{p.title}</p>
                        <p className="text-[10px] text-zinc-400">{p.description}</p>
                      </div>
                      {(selectedPromoId === p.id || (!selectedPromoId && p.id === activePromos[0]?.id)) && (
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary & Confirm */}
          {cartDetails.length > 0 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-200 font-medium">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Discount ({activePromoName})</span>
                    <span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax ({settings.taxPercentage}%)</span>
                  <span className="text-zinc-200 font-medium">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                  <span>Total Payable</span>
                  <span className="text-amber-400">{settings.currencySymbol}{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/20 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending Order to Kitchen...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Send Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
