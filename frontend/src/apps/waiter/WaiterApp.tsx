import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  BellRing,
  GlassWater,
  Utensils,
  ScrollText,
  Receipt,
  CheckCircle2,
  LogOut,
  UtensilsCrossed,
  CheckCheck,
  MapPin,
  Clock,
} from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { fetchRestaurantOrders, fetchRestaurantRequests, updateOrderStatusViaApi, updateServiceRequestStatusViaApi } from '../../services/api';

export const WaiterApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { settings } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'ready_orders' | 'history'>('requests');

  useEffect(() => {
    const loadData = async () => {
      try {
        const restaurantId = settings.id || 'dineflow';
        const [orderData, requestData] = await Promise.all([
          fetchRestaurantOrders(restaurantId),
          fetchRestaurantRequests(restaurantId),
        ]);
        setOrders(orderData);
        setServiceRequests(requestData);
      } catch (error) {
        console.error('Unable to load waiter dashboard data', error);
      }
    };

    loadData();
    const intervalId = window.setInterval(loadData, 10000);
    return () => window.clearInterval(intervalId);
  }, [settings.id]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusViaApi(orderId, status);
      const next = await fetchRestaurantOrders(settings.id || 'dineflow');
      setOrders(next);
    } catch (error) {
      console.error('Unable to update order status', error);
    }
  };

  const handleFulfillRequest = async (requestId: string) => {
    try {
      await updateServiceRequestStatusViaApi(requestId);
      const requestData = await fetchRestaurantRequests(settings.id || 'dineflow');
      setServiceRequests(requestData);
    } catch (error) {
      console.error('Unable to fulfill request', error);
    }
  };

  // Filter requests
  const pendingRequests = serviceRequests.filter((r) => r.status !== 'fulfilled');
  const fulfilledRequests = serviceRequests.filter((r) => r.status === 'fulfilled');

  // Filter ready orders needing delivery
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const activeOrders = orders.filter((o) => ['received', 'accepted', 'preparing', 'delivered'].includes(o.status));

  const requestIcons = {
    water: { icon: GlassWater, label: 'Water Request', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    spoon: { icon: Utensils, label: 'Cutlery Request', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    tissue: { icon: ScrollText, label: 'Napkins / Tissue', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    bill: { icon: Receipt, label: 'Final Bill Request', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    waiter_call: { icon: BellRing, label: 'Assistance Call', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-16">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Waiter Terminal</h1>
            <p className="text-xs text-zinc-400">{settings.name} • Floor Dispatch</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Navigation Bar */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Table Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 text-amber-400 text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ready_orders')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ready_orders'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Ready Orders</span>
            {readyOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 text-emerald-400 text-[10px]">
                {readyOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Floor Activity</span>
          </button>
        </div>

        {/* Tab 1: Service Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Table Assistance Alerts ({pendingRequests.length})</span>
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">All Table Requests Fulfilled</p>
                <p className="text-xs text-zinc-500">New customer water/bill requests will ring here instantly.</p>
              </div>
            ) : (
              pendingRequests.map((req) => {
                const config = requestIcons[req.type] || requestIcons.waiter_call;
                const Icon = config.icon;
                const minsAgo = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 60000);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${config.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            {req.tableName}
                          </span>
                          <span className="text-[10px] text-zinc-500">• {minsAgo}m ago</span>
                        </div>
                        <p className="text-xs font-semibold text-amber-400 mt-0.5">{config.label}</p>
                        {req.note && (
                          <p className="text-xs text-zinc-400 italic mt-0.5">"{req.note}"</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleFulfillRequest(req.id)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Fulfill Request</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Ready Orders */}
        {activeTab === 'ready_orders' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ready for Table Delivery ({readyOrders.length})</span>
            </h2>

            {readyOrders.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500 space-y-2">
                <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No Orders Currently Pending Pickup</p>
                <p className="text-xs text-zinc-500">When Kitchen completes an order, it will show up here for delivery!</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 bg-emerald-950/10 flex items-center justify-between gap-3 shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-emerald-400">{order.orderNumber}</span>
                      <span className="text-xs font-bold text-white bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                        {order.tableName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 font-medium">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStatusChange(order.id, 'delivered')}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-500/20"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark Delivered</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Floor Activity History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Floor Orders & Activity Log
            </h2>

            <div className="space-y-2.5">
              {activeOrders.map((order) => (
                <div key={order.id} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{order.orderNumber}</span>
                    <span className="text-zinc-400 ml-2">• {order.tableName}</span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">{order.items.length} items</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Fulfilled Service Requests</h3>
              <div className="space-y-1.5">
                {fulfilledRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>{r.tableName} — {r.type.toUpperCase()}</span>
                    <span className="text-emerald-400 font-semibold">Fulfilled</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
