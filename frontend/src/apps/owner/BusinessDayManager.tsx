import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Lock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  History,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BusinessDayRecord, Order } from '../../types';

export const BusinessDayManager: React.FC = () => {
  const {
    orders,
    archivedOrders,
    businessDayHistory,
    currentDailyOrderSequence,
    closeBusinessDay,
    deleteBusinessDayRecord,
    settings,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BusinessDayRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<BusinessDayRecord | null>(null);

  // Today's Live Calculations
  const todayRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const todayOrdersCount = orders.length;
  const uniqueTablesCount = new Set(orders.map((o) => o.tableId)).size;
  const todayCustomers = Math.max(todayOrdersCount * 2, uniqueTablesCount * 3);
  const todayAvgOrder = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

  // Lifetime Calculations for reference
  const allOrders = [...orders, ...archivedOrders];
  const lifetimeRevenue = allOrders.reduce((acc, o) => acc + o.totalAmount, 0) +
    businessDayHistory.reduce((acc, b) => acc + b.totalRevenue, 0);
  const lifetimeOrdersCount = allOrders.length +
    businessDayHistory.reduce((acc, b) => acc + b.totalOrders, 0);

  const handleConfirmClose = () => {
    setErrorMessage('');
    const result = closeBusinessDay(passwordInput);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to close business day.');
      return;
    }

    setIsModalOpen(false);
    setPasswordInput('');
    setSuccessToast('Business day closed successfully! Analytics archived & daily dashboard reset.');
    setTimeout(() => setSuccessToast(''), 6000);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    deleteBusinessDayRecord(recordToDelete.id);
    if (selectedRecord && selectedRecord.id === recordToDelete.id) {
      setSelectedRecord(null);
    }
    setRecordToDelete(null);
    setSuccessToast(`Deleted business day record for ${recordToDelete.date}.`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{successToast}</span>
            <button
              onClick={() => setSuccessToast('')}
              className="ml-auto text-emerald-400/60 hover:text-emerald-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span>Analytics</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-amber-400">Business Day Management</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-amber-500" />
            Business Day Management
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Control daily session archiving, order sequence resets, and review historical business day analytics.
          </p>
        </div>

        {/* Live Day Status Badge */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-amber-500/30 px-4 py-2.5 rounded-xl shadow-lg">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Status</div>
            <div className="text-xs font-semibold text-emerald-400">Active Day in Progress</div>
          </div>
          <div className="border-l border-zinc-800 pl-3 ml-1 text-right">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Next Order</div>
            <div className="text-xs font-bold text-amber-400">#{currentDailyOrderSequence}</div>
          </div>
        </div>
      </div>

      {/* Active Business Day Summary & Close Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Metrics Live Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                Today's Active Session
              </span>
              <h2 className="text-lg font-bold text-zinc-100 mt-2">Current Business Day Summary</h2>
            </div>
            <div className="text-xs text-zinc-400 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/50 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Started Today</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Today's Revenue</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {settings.currencySymbol}{todayRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Resets on close</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Today's Orders</span>
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {todayOrdersCount}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Resets on close</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Estimated Guests</span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {todayCustomers}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Resets on close</div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Avg Order Value</span>
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {settings.currencySymbol}{todayAvgOrder.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Resets on close</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lifetime Revenue ({settings.currencySymbol}{lifetimeRevenue.toFixed(2)}) & Lifetime Orders ({lifetimeOrdersCount}) are <strong>never</strong> reset.</span>
            </div>
            <div className="text-zinc-500 font-mono">
              Display Sequence: #{currentDailyOrderSequence} &rarr; #1 on reset
            </div>
          </div>
        </div>

        {/* Right 1 Col: Close Business Day Action Card */}
        <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
              <Lock className="w-4 h-4" />
              Daily Session Control
            </div>
            <h3 className="text-xl font-extrabold text-zinc-100 mb-2">
              Close Business Day
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-6">
              Ready to wrap up today's service? Closing the business day creates an archived snapshot of today's sales, resets the daily order counter back to <strong>Order #1</strong>, and prepares the live dashboard for tomorrow.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setErrorMessage('');
                setPasswordInput('');
                setIsModalOpen(true);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer text-sm"
            >
              <RotateCcw className="w-4 h-4 text-zinc-950 group-hover:rotate-180 transition-transform duration-500" />
              Close Business Day
            </button>
            <p className="text-[10px] text-center text-zinc-400">
              Requires owner confirmation. Safe and reversible archived history.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-red-500" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Close Business Day?</h3>
                    <p className="text-xs text-zinc-400">Please confirm to archive today's session</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exact Bullet Points Requested */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 my-4 space-y-2.5 text-xs text-zinc-300">
                <div className="font-semibold text-amber-400 mb-1">This will:</div>
                <ul className="space-y-1.5 text-zinc-300 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Archive today's analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Save today's revenue ({settings.currencySymbol}{todayRevenue.toFixed(2)})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Save today's orders ({todayOrdersCount} orders)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Save today's customer count ({todayCustomers} guests)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Save today's reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Reset today's dashboard for the next business day (Order #1)</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lifetime analytics will NOT be deleted.</span>
                </div>
              </div>

              {/* Security Password Field */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Owner Password (Optional / Security Verification)</span>
                  <span className="text-[10px] text-zinc-500">Default: owner123</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter owner password (e.g. owner123)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-2.5 pointer-events-none" />
                </div>
                {errorMessage && (
                  <p className="text-xs text-rose-400 font-medium mt-1">{errorMessage}</p>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Close Business Day
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Business Day History Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Business Day History
            </h2>
            <p className="text-xs text-zinc-400">
              Archived records and full reports from previous closed business days.
            </p>
          </div>
          <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg self-start sm:self-auto">
            Total Archived Days: {businessDayHistory.length}
          </span>
        </div>

        {businessDayHistory.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center text-zinc-400 text-xs">
            No closed business day records yet. Close your first day above to generate historical reports.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessDayHistory.map((record) => (
              <motion.div
                key={record.id}
                whileHover={{ y: -2 }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-zinc-100">{record.date}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      Closed {new Date(record.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 block">Revenue</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {settings.currencySymbol}{record.totalRevenue.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 block">Orders</span>
                      <span className="font-bold text-amber-400 text-sm">
                        {record.totalOrders}
                      </span>
                    </div>

                    <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 block">Customers</span>
                      <span className="font-bold text-blue-400 text-sm">
                        {record.totalCustomers}
                      </span>
                    </div>

                    <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 block">Avg Order</span>
                      <span className="font-bold text-purple-400 text-sm">
                        {settings.currencySymbol}{record.averageOrderValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {record.topBestseller && (
                    <div className="text-[11px] text-zinc-400 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5 mb-4 flex items-center justify-between">
                      <span>Top Seller:</span>
                      <span className="font-semibold text-amber-300 truncate max-w-[140px]">{record.topBestseller}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    View Report
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                  <button
                    onClick={() => setRecordToDelete(record)}
                    title="Delete Business Day Record"
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Report Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">
                      Business Day Report — {selectedRecord.date}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Closed on {new Date(selectedRecord.closedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {settings.currencySymbol}{selectedRecord.totalRevenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Total Orders</div>
                    <div className="text-lg font-bold text-amber-400">
                      {selectedRecord.totalOrders}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Total Guests</div>
                    <div className="text-lg font-bold text-blue-400">
                      {selectedRecord.totalCustomers}
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Avg Order Value</div>
                    <div className="text-lg font-bold text-purple-400">
                      {settings.currencySymbol}{selectedRecord.averageOrderValue.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Notes or details */}
                {selectedRecord.notes && (
                  <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-xl text-xs text-zinc-300">
                    <span className="font-semibold text-amber-400 block mb-1">Session Summary Note:</span>
                    {selectedRecord.notes}
                  </div>
                )}

                {/* Archived Orders Table/List */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                    Archived Orders ({selectedRecord.archivedOrders?.length || 0})
                  </h4>

                  {(!selectedRecord.archivedOrders || selectedRecord.archivedOrders.length === 0) ? (
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 text-center text-xs text-zinc-500">
                      No archived individual order receipts saved for this summary record.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {selectedRecord.archivedOrders.map((ord: Order) => (
                        <div
                          key={ord.id}
                          className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{ord.orderNumber}</span>
                              <span className="text-zinc-400">({ord.tableName})</span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {ord.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                          </div>
                          <div className="font-bold text-zinc-100 text-sm">
                            {settings.currencySymbol}{ord.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <button
                  onClick={() => {
                    setRecordToDelete(selectedRecord);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete This Record
                </button>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Record Confirmation Modal */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Delete Business Day Record?</h3>
                    <p className="text-xs text-zinc-400">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setRecordToDelete(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 my-4 space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Date:</span>
                  <span className="font-bold text-zinc-100">{recordToDelete.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Revenue:</span>
                  <span className="font-bold text-emerald-400">
                    {settings.currencySymbol}{recordToDelete.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Orders:</span>
                  <span className="font-bold text-amber-400">{recordToDelete.totalOrders}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-6">
                Are you sure you want to permanently delete the archived record for <strong>{recordToDelete.date}</strong> from your business day history?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setRecordToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
