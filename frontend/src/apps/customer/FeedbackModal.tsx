import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Star, Heart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableNumber?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  tableId,
  tableNumber,
}) => {
  const { submitFeedback } = useStore();
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isDone, setIsDone] = useState(false);

  const displayNum = tableNumber || (tableId.includes('-') && tableId.length > 10 ? '04' : tableId.replace(/^t-/, ''));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    submitFeedback({
      tableId,
      tableName: `Table ${displayNum}`,
      rating,
      customerName: name.trim() || 'Valued Guest',
      comment: comment.trim(),
      tags: rating >= 4 ? ['Excellent Quality', 'Great Service'] : ['Requires Attention'],
    });

    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      setName('');
      setComment('');
      onClose();
    }, 1500);
  };

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
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Rate Your Experience</h2>
                <p className="text-xs text-zinc-400">Table {tableId} Dining Feedback</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isDone ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Thank You for Your Feedback!</p>
              <p className="text-xs text-zinc-400">Your review helps us maintain artisanal dining excellence.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div className="text-center space-y-2 py-2 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">How was your meal & service?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Sterling"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition"
                />
              </div>

              {/* Comments */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Comments & Suggestions *
                </label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the dishes, ambiance, or service..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20 transition"
              >
                <Heart className="w-4 h-4" />
                <span>Submit Dining Review</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
