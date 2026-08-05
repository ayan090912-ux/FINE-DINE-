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
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { OrderStatus } from '../../types';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
import { fetchRestaurantOrders, updateOrderStatusViaApi } from '../../services/api';

export const OwnerDashboard: React.FC<{
  onNavigateToBusinessDay?: () => void;
  onNavigateToOrders?: () => void;
}> = ({ onNavigateToBusinessDay, onNavigateToOrders }) => {
  const { tables = [], menuItems = [], feedbacks = [], settings, currentDailyOrderSequence, orders = [], serviceRequests = [], employees = [], updateOrderStatus } = useStore();
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const getSessionDurationStr = (emp: any) => {
    let totalMinutes = emp.todayWorkingMinutes || 0;
    if (emp.onlineStatus === 'ONLINE' && emp.currentSessionStart) {
      const elapsedMs = Math.max(0, nowMs - new Date(emp.currentSessionStart).getTime());
      totalMinutes += Math.floor(elapsedMs / 60000);
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
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

      {/* Live Employee Attendance & Session Duration Section */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Real-Time Employee Attendance & Live Session Monitor</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs text-zinc-400">Live active working timers, login times & online/offline status</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            {employees.filter((e: any) => e.onlineStatus === 'ONLINE').length} Staff Online Now
          </span>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs">
            No employees registered yet. Go to Employee Management to create accounts.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {employees.map((emp: any) => {
              const isOnline = emp.onlineStatus === 'ONLINE';
              const duration = getSessionDurationStr(emp);
              const loginTimeStr = emp.lastLoginAt
                ? new Date(emp.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Not logged in';

              return (
                <div
                  key={emp.id}
                  className={`p-3.5 rounded-xl bg-zinc-950 border flex items-center justify-between gap-3 ${
                    isOnline ? 'border-emerald-500/30' : 'border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.fullName} className="w-10 h-10 rounded-xl object-cover border border-zinc-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`w-3 h-3 rounded-full border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">{emp.fullName}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{emp.role} • {emp.position}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isOnline ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
                      {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                    </span>
                    <p className="text-[11px] font-mono font-bold text-amber-400 mt-1">
                      Logged: {loginTimeStr}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-zinc-300">
                      Working: <span className="text-emerald-300">{duration}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Waiter Live Dispatch & Performance Monitor */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Waiter Live Dispatch & Staff Performance Monitor</h3>
              <p className="text-xs text-zinc-400">Real-time floor dispatch metrics, average response times & request metrics</p>
            </div>
          </div>
        </div>

        {/* Live Service Requests Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Live Calls ({serviceRequests.filter((r) => r.status !== 'archived' && r.status !== 'completed').length})</h4>
          {serviceRequests.filter((r) => r.status !== 'archived' && r.status !== 'completed').length === 0 ? (
            <div className="text-center py-6 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-zinc-500 text-xs font-medium">
              No active customer requests pending in dispatch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                    <th className="pb-2">Table</th>
                    <th className="pb-2">Request Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Assigned Waiter</th>
                    <th className="pb-2 text-right">Time Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {serviceRequests
                    .filter((r) => r.status !== 'archived' && r.status !== 'completed')
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 font-bold text-amber-400">{r.tableName}</td>
                        <td className="py-2.5 capitalize font-semibold text-zinc-200">{r.type.replace('_', ' ')}</td>
                        <td className="py-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              r.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                : r.status === 'accepted' || r.status === 'in_progress'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-white">{r.assignedWaiterName || 'Unassigned'}</td>
                        <td className="py-2.5 text-right text-zinc-500 font-mono">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
