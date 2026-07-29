import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { OrderStatusBadge, VegBadge } from '../../components/common/StatusBadge';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  CheckCheck,
  Flame,
  Volume2,
  VolumeX,
  X,
  Eye,
  Trash2,
  DollarSign,
  Plus,
  Utensils,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OrderStreamManager: React.FC = () => {
  const {
    orders,
    tables,
    menuItems,
    settings,
    updateOrderStatus,
    updateOrderEta,
    cancelOrder,
    deleteOrder,
    createOrder,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selected Order for Detail Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // ETA Modal State
  const [etaModalOrder, setEtaModalOrder] = useState<Order | null>(null);
  const [customEta, setCustomEta] = useState<number>(15);

  // Manual Quick Order Modal
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [cartItems, setCartItems] = useState<{ menuItemId: string; quantity: number; specialNotes?: string }[]>([]);

  // Filter Logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['received', 'accepted', 'preparing', 'ready'].includes(o.status);
    if (statusFilter === 'completed') return ['completed', 'delivered'].includes(o.status);
    if (statusFilter === 'cancelled') return o.status === 'cancelled';
    return o.status === statusFilter;
  });

  // Action Handlers
  const handleAcceptOrder = (order: Order) => {
    setEtaModalOrder(order);
    setCustomEta(15);
  };

  const handleConfirmEta = () => {
    if (etaModalOrder) {
      updateOrderEta(etaModalOrder.id, customEta);
      setEtaModalOrder(null);
    }
  };

  const handleAddItemToManualCart = (menuItemId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing) {
        return prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { menuItemId, quantity: 1 }];
    });
  };

  const handleRemoveFromManualCart = (menuItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const handleCreateManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      alert('Please select a table for this order.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one item to the order.');
      return;
    }

    createOrder(selectedTableId, cartItems);
    setIsManualOrderOpen(false);
    setSelectedTableId('');
    setCartItems([]);
  };

  const statusCounts = {
    all: orders.length,
    active: orders.filter((o) => ['received', 'accepted', 'preparing', 'ready'].includes(o.status)).length,
    received: orders.filter((o) => o.status === 'received').length,
    preparing: orders.filter((o) => o.status === 'preparing' || o.status === 'accepted').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Stream Controls & Header Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live All Orders Stream</h3>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME SYNC ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monitor and process live table QR orders, update kitchen ETAs, and manage dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => setIsManualOrderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New POS Order</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: `All (${statusCounts.all})` },
              { id: 'active', label: `Active (${statusCounts.active})`, badge: 'text-amber-400' },
              { id: 'received', label: `New (${statusCounts.received})`, badge: 'text-rose-400' },
              { id: 'preparing', label: `Kitchen (${statusCounts.preparing})` },
              { id: 'ready', label: `Ready (${statusCounts.ready})` },
              { id: 'completed', label: `Completed (${statusCounts.completed})` },
              { id: 'cancelled', label: `Cancelled (${statusCounts.cancelled})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, table, item..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid Display */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">No Orders Found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching '${searchQuery}' under '${statusFilter}' filter.`
              : 'There are currently no orders in this stream view. New table QR orders will appear automatically!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const minutesAgo = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

            return (
              <div
                key={order.id}
                className={`bg-zinc-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition relative ${
                  order.status === 'received'
                    ? 'border-rose-500/80 bg-rose-950/10 ring-1 ring-rose-500/40'
                    : order.status === 'preparing'
                    ? 'border-amber-500/60 bg-amber-950/10'
                    : order.status === 'ready'
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : order.status === 'cancelled'
                    ? 'border-zinc-800 opacity-60'
                    : 'border-zinc-800'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-amber-400">{order.orderNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {order.tableName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`}</span>
                      {order.etaMinutes && (
                        <span className="text-amber-400 font-semibold">• ETA {order.etaMinutes} mins</span>
                      )}
                    </div>
                  </div>

                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Items List */}
                <div className="space-y-2 flex-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <VegBadge type={item.vegType} />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200 truncate">
                            {item.quantity}x {item.name}
                          </p>
                          {item.specialNotes && (
                            <p className="text-[10px] text-amber-300 font-medium mt-0.5 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              Note: {item.specialNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-zinc-400 shrink-0 font-medium">
                        {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Amount Summary */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    {order.appliedPromotionName && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block mb-0.5">
                        Promo: {order.appliedPromotionName}
                      </span>
                    )}
                    <span className="text-zinc-400 text-[11px]">Total Items ({order.items.length})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-white font-mono">
                      {settings.currencySymbol}{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Strip */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderDetails(order)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer border border-zinc-700"
                    title="View Full Order Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Contextual Status Action Buttons */}
                  {order.status === 'received' && (
                    <>
                      <button
                        onClick={() => handleAcceptOrder(order)}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Accept & Set ETA</span>
                      </button>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                        title="Cancel Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {order.status === 'preparing' && (
                    <>
                      <button
                        onClick={() => setEtaModalOrder(order)}
                        className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                      >
                        ETA
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </button>
                    </>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Deliver to Table</span>
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Close Order</span>
                    </button>
                  )}

                  {(order.status === 'completed' || order.status === 'cancelled') && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="w-full py-2 rounded-xl bg-zinc-950 text-rose-400 hover:bg-rose-500/10 border border-zinc-800 text-xs font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Record</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Full Order Details Drawer */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-amber-400">{selectedOrderDetails.orderNumber}</span>
                    <OrderStatusBadge status={selectedOrderDetails.status} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Table: <strong className="text-white">{selectedOrderDetails.tableName}</strong> • Placed:{' '}
                    {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Itemization Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ordered Items</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedOrderDetails.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <VegBadge type={item.vegType} />
                        <div>
                          <p className="font-bold text-white">{item.quantity}x {item.name}</p>
                          {item.specialNotes && (
                            <p className="text-[10px] text-amber-400 italic">"{item.specialNotes}"</p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-200">
                        {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{settings.currencySymbol}{selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({selectedOrderDetails.appliedPromotionName || 'Promo'})</span>
                    <span className="font-mono">-{settings.currencySymbol}{selectedOrderDetails.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-2 border-t border-zinc-800 text-sm">
                  <span>Total Amount Paid</span>
                  <span className="font-mono text-amber-400">
                    {settings.currencySymbol}{selectedOrderDetails.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs hover:bg-zinc-700 transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ETA Setting Modal */}
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
                  <h3 className="text-base font-bold text-white">Set Kitchen Preparation ETA</h3>
                  <p className="text-xs text-zinc-400">Order {etaModalOrder.orderNumber} • {etaModalOrder.tableName}</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Select Preset Minutes
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCustomEta(mins)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
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

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Or Custom Minutes
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
                  type="button"
                  onClick={() => setEtaModalOrder(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEta}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Confirm & Update Live ETA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: POS Manual Quick Order Modal */}
      <AnimatePresence>
        {isManualOrderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Create Manual POS Counter Order</h3>
                    <p className="text-xs text-zinc-400">Record a phone, walk-in or staff order directly into live queue</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsManualOrderOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualOrderSubmit} className="space-y-4">
                {/* Select Table */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Select Dining Table *
                  </label>
                  <select
                    required
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.tableNumber}) — {t.section} ({t.isOccupied ? 'Occupied' : 'Vacant'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pick Menu Items Grid */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Add Items from Menu
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                    {menuItems.map((item) => {
                      const inCart = cartItems.find((ci) => ci.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddItemToManualCart(item.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between space-y-1 ${
                            inCart
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate">{item.name}</span>
                            {inCart && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px]">
                                {inCart.quantity}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {settings.currencySymbol}{item.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cart Selected Summary */}
                {cartItems.length > 0 && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase text-zinc-400">Selected Order Items:</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {cartItems.map((ci) => {
                        const m = menuItems.find((item) => item.id === ci.menuItemId);
                        if (!m) return null;
                        return (
                          <div key={ci.menuItemId} className="flex items-center justify-between text-xs text-zinc-200">
                            <span>{ci.quantity}x {m.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-400">
                                {settings.currencySymbol}{(m.price * ci.quantity).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromManualCart(ci.menuItemId)}
                                className="text-rose-400 hover:text-rose-300 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsManualOrderOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    Dispatch Live POS Order
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
