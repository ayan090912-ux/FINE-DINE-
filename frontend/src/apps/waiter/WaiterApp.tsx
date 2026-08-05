import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';
import { OrderStatusBadge } from '../../components/common/StatusBadge';
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
  Clock,
  LayoutGrid,
  BookmarkCheck,
  CheckCircle,
  User,
  Play,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react';

export const WaiterApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const {
    settings,
    orders,
    serviceRequests,
    tables,
    authUsers,
    updateOrderStatus,
    acceptServiceRequest,
    inProgressServiceRequest,
    completeServiceRequest,
    vacateTable,
    reserveTable,
    unreserveTable,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'ready_orders' | 'tables' | 'history'>('dispatch');
  const waiterName = authUsers.waiter?.fullName || authUsers.waiter?.username || 'Waiter';
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Unable to update order status', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      await acceptServiceRequest(requestId, waiterName);
    } catch (error) {
      console.error('Accept request error', error);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleInProgress = async (requestId: string) => {
    try {
      await inProgressServiceRequest(requestId);
    } catch (error) {
      console.error('In progress request error', error);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      await completeServiceRequest(requestId);
    } catch (error) {
      console.error('Complete request error', error);
    }
  };

  // Dispatch lists
  const pendingRequests = serviceRequests.filter((r) => r.status === 'pending');
  const activeAssignedRequests = serviceRequests.filter((r) => r.status === 'accepted' || r.status === 'in_progress');
  const completedRequests = serviceRequests.filter((r) => r.status === 'completed' || r.status === 'archived');

  // Ready orders for floor delivery
  const readyOrders = orders.filter((o) => o.status === 'ready');

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
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">Waiter Service Terminal</h1>
              {authUsers.waiter?.employeeId && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                  {authUsers.waiter.employeeId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-400">{settings.name}</span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                {authUsers.waiter?.photoUrl ? (
                  <img src={authUsers.waiter.photoUrl} alt={waiterName} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <User className="w-3 h-3 text-amber-400" />
                )}
                <span>{waiterName}</span>
                {authUsers.waiter?.position && (
                  <span className="text-[10px] text-zinc-400 font-normal">({authUsers.waiter.position})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-zinc-700"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Navigation Bar */}
        <div className="grid grid-cols-4 gap-1.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'dispatch'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Live Dispatch</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 text-amber-400 text-[10px] animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ready_orders')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
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
            onClick={() => setActiveTab('tables')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Floor Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>History</span>
          </button>
        </div>

        {/* TAB 1: Live Dispatch Terminal */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* Section A: Pending Requests (Unassigned - Open for any online waiter) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Pending Floor Calls ({pendingRequests.length})</span>
              </h3>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-zinc-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">No unassigned customer calls right now</p>
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const conf = requestIcons[req.type] || requestIcons.waiter_call;
                  const IconComp = conf.icon;

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-between gap-4 shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border ${conf.color} shrink-0`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-amber-400">{req.tableName}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                              {conf.label}
                            </span>
                          </div>
                          {req.note && <p className="text-xs text-zinc-300 italic mt-0.5">"{req.note}"</p>}
                          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>Requested at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={acceptingId === req.id}
                        className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition shrink-0 uppercase tracking-wide"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{acceptingId === req.id ? 'Accepting...' : 'Accept Request'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Section B: Assigned Requests (Accepted / In Progress) */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Assigned Requests In Dispatch ({activeAssignedRequests.length})</span>
              </h3>

              {activeAssignedRequests.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-zinc-500">
                  <p className="text-xs text-zinc-400">No active assigned calls</p>
                </div>
              ) : (
                activeAssignedRequests.map((req) => {
                  const conf = requestIcons[req.type] || requestIcons.waiter_call;
                  const IconComp = conf.icon;
                  const isAssignedToMe = req.assignedWaiterName === waiterName;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl bg-zinc-900 border flex items-center justify-between gap-4 shadow-lg ${
                        isAssignedToMe ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-zinc-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border ${conf.color} shrink-0`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-amber-400">{req.tableName}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {req.status === 'in_progress' ? 'In Progress' : 'Accepted'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1 font-semibold">
                            Assigned to: <span className="text-white font-extrabold">{req.assignedWaiterName || 'Staff'}</span>
                          </p>
                          {req.note && <p className="text-xs text-zinc-400 italic">"{req.note}"</p>}
                        </div>
                      </div>

                      {isAssignedToMe ? (
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'accepted' && (
                            <button
                              onClick={() => handleInProgress(req.id)}
                              className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>In Progress</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleCompleteRequest(req.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>Mark Completed</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 shrink-0">
                          Assigned to {req.assignedWaiterName || 'another waiter'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Ready Orders */}
        {activeTab === 'ready_orders' && (
          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500 space-y-2">
                <UtensilsCrossed className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No orders waiting for floor delivery</p>
                <p className="text-xs text-zinc-500">When Kitchen marks an order READY, it will show up here for delivery.</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-amber-400">{order.tableName}</span>
                      <span className="text-xs font-mono font-bold text-zinc-400">{order.orderNumber}</span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-zinc-300">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold">{settings.currencySymbol}{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400 font-bold">Total: {settings.currencySymbol}{order.totalAmount}</span>
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Delivered to Table</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Floor Tables */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tables.map((t) => {
              const status = t.status || (t.isOccupied ? 'OCCUPIED' : 'VACANT');
              const isOccupied = status === 'OCCUPIED';
              const isReserved = status === 'RESERVED';

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border bg-zinc-900 flex flex-col justify-between space-y-3 ${
                    isOccupied
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : isReserved
                      ? 'border-purple-500/50 bg-purple-950/10'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-amber-400">TABLE {t.tableNumber}</h4>
                      <p className="text-xs text-zinc-300 font-medium">{t.name}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOccupied
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isReserved
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    {isOccupied && (
                      <button
                        onClick={() => vacateTable(t.id)}
                        className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Vacate Table (Close Session)</span>
                      </button>
                    )}

                    {!isOccupied && !isReserved && (
                      <button
                        onClick={() => reserveTable(t.id)}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-purple-500/30 transition"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Mark Reserved</span>
                      </button>
                    )}

                    {isReserved && (
                      <button
                        onClick={() => unreserveTable(t.id)}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Unreserve Table</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: Dispatch History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {completedRequests.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500">
                <p className="text-sm font-semibold text-zinc-300">No completed requests in dispatch history yet</p>
              </div>
            ) : (
              completedRequests.map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between opacity-80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">{req.tableName}</span>
                      <span className="text-xs font-semibold text-zinc-300">• {req.type.toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Handled by: <span className="text-zinc-200 font-bold">{req.assignedWaiterName || 'Staff'}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Completed
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
