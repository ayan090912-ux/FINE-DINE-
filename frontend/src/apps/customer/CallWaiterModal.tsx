import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ServiceRequestType } from '../../types';
import { X, GlassWater, Utensils, ScrollText, Receipt, BellRing, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createServiceRequestViaApi } from '../../services/api';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableId: string;
  tableNumber?: string;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  tableId,
  tableNumber,
}) => {
  const { settings } = useStore();
  const [customNote, setCustomNote] = useState('');
  const [submittedType, setSubmittedType] = useState<string | null>(null);

  const displayNum = tableNumber || (tableId.includes('-') && tableId.length > 10 ? '04' : tableId.replace(/^t-/, ''));

  if (!isOpen) return null;

  const handleRequest = async (type: ServiceRequestType) => {
    try {
      await createServiceRequestViaApi(restaurantId, tableId, type, customNote.trim() ? customNote : undefined);
      setSubmittedType(type);
      setTimeout(() => {
        setSubmittedType(null);
        setCustomNote('');
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Request submission failed', error);
      alert(error instanceof Error ? error.message : 'Unable to send request right now.');
    }
  };

  const requests: { type: ServiceRequestType; label: string; icon: React.ElementType; color: string }[] = [
    { type: 'water', label: 'Request Water', icon: GlassWater, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { type: 'spoon', label: 'Cutlery & Spoons', icon: Utensils, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { type: 'tissue', label: 'Napkins & Tissues', icon: ScrollText, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { type: 'bill', label: 'Request Final Bill', icon: Receipt, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { type: 'waiter_call', label: 'Call Waiter Assistance', icon: BellRing, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Call Waiter Service</h2>
                <p className="text-xs text-zinc-400">Select what you need for Table {displayNum}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {submittedType ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Request Dispatched to Waiter Terminal</p>
              <p className="text-xs text-zinc-400">A waiter will arrive at Table {displayNum} shortly!</p>
            </div>
          ) : (
            <>
              {/* Request Options Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {requests.map((req) => {
                  const Icon = req.icon;
                  return (
                    <button
                      key={req.type}
                      onClick={() => handleRequest(req.type)}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 transition hover:scale-[1.01] ${req.color}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold text-zinc-100">{req.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Note */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Additional Note (Optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Extra ice, warm water, high chair..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition"
                />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
