import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { OrderStatusBadge, VegBadge } from '../../components/common/StatusBadge';
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  LogOut,
  CheckCircle,
  Play,
  CheckCheck,
  UtensilsCrossed,
  XCircle,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const KitchenApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { orders, updateOrderStatus, updateOrderEta, settings } = useStore();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'ready' | 'completed'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ETA Modal state for active order
  const [etaModalOrder, setEtaModalOrder] = useState<Order | null>(null);
  const [customEta, setCustomEta] = useState<number>(15);

  const filteredOrders = orders.filter((o) => {
    if (selectedStatusFilter === 'active') {
      return o.status === 'received' || o.status === 'accepted' || o.status === 'preparing';
    }
    if (selectedStatusFilter === 'ready') {
      return o.status === 'ready';
    }
    if (selectedStatusFilter === 'completed') {
      return o.status === 'completed' || o.status === 'delivered';
    }
    return true;
  });

  const handleAcceptOrder = (order: Order) => {
    setEtaModalOrder(order);
    setCustomEta(order.items.reduce((acc, i) => Math.max(acc, 12), 15));
  };

  const handleConfirmEta = () => {
    if (etaModalOrder) {
      updateOrderEta(etaModalOrder.id, customEta);
      setEtaModalOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
            </h1>
            <p className="text-xs text-zinc-400">{settings.name} • Live Cooking Queue</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Sound Notification Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
            title="Toggle Sound Alerts"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition flex items-center gap-2 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main KDS Grid Area */}
      <main className="p-6 flex-1 flex flex-col space-y-6 max-w-7xl mx-auto w-full">
        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                selectedStatusFilter === 'active'
                  ? 'bg-orange-500 text-zinc-950 border-orange-400 shadow-lg shadow-orange-500/10'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Active Queue ({orders.filter((o) => ['received', 'accepted', 'preparing'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('ready')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                selectedStatusFilter === 'ready'
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Ready to Serve ({orders.filter((o) => o.status === 'ready').length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                selectedStatusFilter === 'completed'
                  ? 'bg-zinc-700 text-white border-zinc-600'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              Completed ({orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length})
            </button>
          </div>

          <div className="text-xs text-zinc-400 font-medium hidden sm:block">
            Auto-refreshing live stream
          </div>
        </div>

        {/* Ticket Cards Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 space-y-3">
            <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-base font-bold text-zinc-300">No Kitchen Tickets in this view</p>
            <p className="text-xs text-zinc-500">Incoming orders from table QRs will automatically appear here with sound chimes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

              return (
                <div
                  key={order.id}
                  className={`bg-zinc-900/90 border rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition relative ${
                    order.status === 'received'
                      ? 'border-orange-500/80 bg-orange-950/20 ring-1 ring-orange-500/40'
                      : order.status === 'preparing'
                      ? 'border-amber-500/50'
                      : order.status === 'ready'
                      ? 'border-emerald-500/60 bg-emerald-950/10'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-orange-400">{order.orderNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-white">
                          {order.tableName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Placed {minutesAgo}m ago</span>
                        {order.etaMinutes && (
                          <span className="text-amber-400 font-semibold">• ETA: {order.etaMinutes} mins</span>
                        )}
                      </div>
                    </div>

                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Items List */}
                  <div className="space-y-2.5 flex-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-2.5"
                      >
                        <VegBadge type={item.vegType} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-100">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                          {item.specialNotes && (
                            <p className="text-[11px] text-amber-300 font-medium mt-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              🔥 Request: {item.specialNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Controls */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                    {order.status === 'received' && (
                      <button
                        onClick={() => handleAcceptOrder(order)}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
                      >
                        <Play className="w-4 h-4" />
                        <span>Accept & Set ETA</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={() => setEtaModalOrder(order)}
                          className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition"
                        >
                          Update ETA
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark Ready</span>
                        </button>
                      </div>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Handover to Waiter</span>
                      </button>
                    )}

                    {['delivered', 'completed'].includes(order.status) && (
                      <span className="text-xs text-zinc-500 font-semibold mx-auto">
                        Order Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ETA Setting Modal */}
      <AnimatePresence>
        {etaModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Set Kitchen Prep ETA</h3>
                  <p className="text-xs text-zinc-400">Order {etaModalOrder.orderNumber} • {etaModalOrder.tableName}</p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Select Minutes
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setCustomEta(mins)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                        customEta === mins
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Number Input */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Or Custom Duration
                </label>
                <input
                  type="number"
                  value={customEta}
                  onChange={(e) => setCustomEta(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setEtaModalOrder(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEta}
                  className="w-1/2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-orange-500/20"
                >
                  Confirm & Send Live ETA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
