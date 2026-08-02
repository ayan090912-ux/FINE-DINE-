import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { useStore } from '../../context/StoreContext';
import { X, Clock, CheckCircle2, ChefHat, Utensils, CheckCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderStatusBadge, VegBadge } from '../../components/common/StatusBadge';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  orders: Order[];
  currencySymbol: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  tableId,
  orders,
  currencySymbol,
}) => {
  const [, setTick] = useState(0);

  // Force tick every second to keep countdown timers live!
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter orders for this table
  const tableOrders = orders.filter((o) => o.tableId === tableId || o.tableNumber === tableId);

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const steps = [
    { label: 'Received', icon: Clock },
    { label: 'Accepted', icon: CheckCircle2 },
    { label: 'Preparing', icon: ChefHat },
    { label: 'Ready', icon: Utensils },
    { label: 'Delivered', icon: CheckCheck },
  ];

  const calculateRemainingSeconds = (order: Order) => {
    if (order.status !== 'preparing' || !order.estimatedCompletionTime) return null;
    const target = new Date(order.estimatedCompletionTime).getTime();
    const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
    return diff;
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Live Table Orders Tracking</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time status & Kitchen ETA updates for Table {tableId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {tableOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-3">
                <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No active orders placed for this table yet</p>
                <p className="text-xs text-zinc-500">Items placed from your basket will show up here live!</p>
              </div>
            ) : (
              tableOrders.map((order) => {
                const stepIdx = getStepIndex(order.status);
                const remainingSecs = calculateRemainingSeconds(order);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-lg space-y-4 relative overflow-hidden"
                  >
                    {/* Order Meta Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-amber-400">{order.orderNumber}</span>
                          <span className="text-xs text-zinc-500">
                            • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • Total {currencySymbol}{order.totalAmount.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <OrderStatusBadge status={order.status} />

                        {/* Live Countdown Timer if Preparing */}
                        {remainingSecs !== null && (
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            {remainingSecs > 0 ? `${formatCountdown(remainingSecs)} remaining` : 'Almost Ready!'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Timeline */}
                    <div className="grid grid-cols-5 gap-1 pt-2">
                      {steps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isDone = idx <= stepIdx;
                        const isCurrent = idx === stepIdx;

                        return (
                          <div key={step.label} className="flex flex-col items-center text-center gap-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                                isDone
                                  ? 'bg-amber-500 text-zinc-950 font-bold'
                                  : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                              } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950' : ''}`}
                            >
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-semibold ${isDone ? 'text-amber-400' : 'text-zinc-600'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Items Breakdown */}
                    <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <VegBadge type={item.vegType} />
                            <span className="font-semibold text-zinc-200">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span className="text-zinc-400 font-mono">
                            {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
