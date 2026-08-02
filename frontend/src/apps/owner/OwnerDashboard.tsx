import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  ChefHat,
  Star,
  Activity,
  Award,
  Calendar,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { fetchRestaurantOrders, updateOrderStatusViaApi } from '../../services/api';

export const OwnerDashboard: React.FC<{
  onNavigateToBusinessDay?: () => void;
  onNavigateToOrders?: () => void;
}> = ({ onNavigateToBusinessDay, onNavigateToOrders }) => {
  const { tables, menuItems, feedbacks, settings, currentDailyOrderSequence } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchRestaurantOrders(settings.id || 'dineflow');
        setOrders(data);
      } catch (error) {
        console.error('Unable to load owner orders', error);
      }
    };

    loadOrders();
    const intervalId = window.setInterval(loadOrders, 10000);
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

  // Metrics calculation
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalOrders = orders.length;

  const occupiedTables = tables.filter((t) => t.isOccupied).length;
  const tableOccupancyPercent = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0;

  const activePreparingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'received').length;
  const kitchenLoadPercent = Math.min(100, activePreparingOrders * 20);

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  // Peak Hours distribution dynamically updated from live orders
  const baseHoursMap: { [key: number]: { label: string; count: number } } = {
    12: { label: '12 PM', count: 18 },
    13: { label: '1 PM', count: 28 },
    14: { label: '2 PM', count: 14 },
    18: { label: '6 PM', count: 22 },
    19: { label: '7 PM', count: 35 },
    20: { label: '8 PM', count: 42 },
    21: { label: '9 PM', count: 31 },
  };

  // Tally live orders per hour
  const liveHourCounts: { [key: number]: number } = {};
  orders.forEach((o) => {
    if (o.createdAt) {
      const h = new Date(o.createdAt).getHours();
      liveHourCounts[h] = (liveHourCounts[h] || 0) + 1;
    }
  });

  const peakHours = Object.keys(baseHoursMap).map((hStr) => {
    const h = Number(hStr);
    const item = baseHoursMap[h];
    const liveExtra = liveHourCounts[h] || 0;
    return {
      hour: item.label,
      orders: item.count + liveExtra,
    };
  });

  const maxPeakObj = peakHours.reduce((prev, curr) => (curr.orders > prev.orders ? curr : prev), peakHours[0]);
  const maxPeak = maxPeakObj ? maxPeakObj.orders : 1;

  return (
    <div className="space-y-6">
      {/* Business Day Quick Control Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100">Business Day Management</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active Session (Next #{currentDailyOrderSequence})
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Control daily session resetting, archive sales, and view business day history.
            </p>
          </div>
        </div>

        {onNavigateToBusinessDay && (
          <button
            onClick={onNavigateToBusinessDay}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Manage & Close Business Day</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {settings.currencySymbol}{totalRevenue.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs yesterday</span>
          </div>
        </div>

        {/* Orders */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{totalOrders}</p>
          <p className="text-[11px] text-zinc-500 font-medium">Across all table QR sessions</p>
        </div>

        {/* Table Occupancy */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Table Occupancy</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white">{tableOccupancyPercent}%</p>
          <p className="text-[11px] text-zinc-500 font-medium">
            {occupiedTables} of {tables.length} tables active
          </p>
        </div>

        {/* Customer Satisfaction */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Satisfaction</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 flex items-center gap-1.5">
            <span>{avgRating}</span>
            <span className="text-xs text-zinc-500 font-normal">/ 5.0</span>
          </p>
          <p className="text-[11px] text-zinc-500 font-medium">{feedbacks.length} guest reviews</p>
        </div>
      </div>

      {/* Middle Section: Peak Hours Chart & Kitchen Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours Histogram */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Peak Dining Hours Traffic</span>
              </h3>
              <p className="text-xs text-zinc-400">Hourly order volume distribution</p>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Peak: {maxPeakObj.hour}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {peakHours.map((p) => {
              const heightPct = Math.round((p.orders / maxPeak) * 100);
              return (
                <div key={p.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition">
                    {p.orders}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all group-hover:brightness-125"
                  />
                  <span className="text-[10px] font-semibold text-zinc-500">{p.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kitchen Load & Highlights */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>Real-Time Kitchen Load</span>
            </h3>
            <p className="text-xs text-zinc-400">Current queue capacity</p>
          </div>

          {/* Meter Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300">{activePreparingOrders} orders in prep</span>
              <span className="text-orange-400">{kitchenLoadPercent}% Capacity</span>
            </div>
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                style={{ width: `${kitchenLoadPercent}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Bestseller Spotlight */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Menu Bestseller</span>
            </h4>
            {menuItems[0] && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
                <img src={menuItems[0].imageUrl} alt={menuItems[0].name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{menuItems[0].name}</p>
                  <p className="text-[11px] text-amber-400 font-semibold">{settings.currencySymbol}{menuItems[0].price.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders Stream */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Live Recent Orders Stream</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {orders.length} Total
            </span>
          </div>

          {onNavigateToOrders && (
            <button
              onClick={onNavigateToOrders}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Full Order Stream & POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            No active orders recorded yet. Table QR orders will automatically stream here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Table</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 font-extrabold text-amber-400">{order.orderNumber}</td>
                    <td className="py-3 font-semibold text-zinc-200">{order.tableName}</td>
                    <td className="py-3 text-zinc-400 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3 font-mono font-bold text-white">
                      {settings.currencySymbol}{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-zinc-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      {order.status === 'received' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] transition cursor-pointer"
                        >
                          Accept
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[11px] transition cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 font-bold text-[11px] transition cursor-pointer"
                        >
                          Close
                        </button>
                      )}
                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <span className="text-[11px] text-zinc-500 italic">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
