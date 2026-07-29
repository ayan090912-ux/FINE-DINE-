import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, ThumbsUp, Trash2, Search, Filter, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Feedback } from '../../types';

export const FeedbackViewer: React.FC = () => {
  const { feedbacks, deleteFeedback } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [reviewToDelete, setReviewToDelete] = useState<Feedback | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const totalReviews = feedbacks.length;
  const avgRatingNumber = totalReviews > 0
    ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalReviews
    : 5.0;
  const avgRating = avgRatingNumber.toFixed(1);

  const positiveCount = feedbacks.filter((f) => f.rating >= 4).length;
  const positivePercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 100;

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesRating = ratingFilter === 'all' || f.rating === ratingFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      f.comment.toLowerCase().includes(q) ||
      (f.customerName && f.customerName.toLowerCase().includes(q)) ||
      (f.tableName && f.tableName.toLowerCase().includes(q)) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesRating && matchesQuery;
  });

  const handleDeleteConfirm = () => {
    if (!reviewToDelete) return;
    deleteFeedback(reviewToDelete.id);
    setToastMessage(`Deleted review from ${reviewToDelete.customerName || 'Guest'}`);
    setReviewToDelete(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Average Rating</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-400">{avgRating}</span>
              <span className="text-xs text-zinc-500">out of 5.0</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Total Customer Reviews</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{totalReviews}</span>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700/50">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Positive Satisfaction</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-400">{positivePercentage}%</span>
              <span className="text-xs text-zinc-500">4★ & 5★ Reviews</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by guest name, table, comment, tag..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setRatingFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              ratingFilter === 'all'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                ratingFilter === r
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{r}</span>
              <Star className={`w-3 h-3 ${ratingFilter === r ? 'fill-zinc-950 text-zinc-950' : 'fill-amber-400 text-amber-400'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500 space-y-2">
            <ThumbsUp className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">No guest reviews match your filter criteria</p>
            <p className="text-xs text-zinc-600">Try clearing the search query or rating filter.</p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => (
            <motion.div
              key={fb.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 transition space-y-3 shadow-lg relative group"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {fb.customerName ? fb.customerName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{fb.customerName || 'Valued Guest'}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">({fb.tableName})</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : 'Recent Guest'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1">{fb.rating}.0</span>
                  </div>

                  {/* Owner Delete Button */}
                  <button
                    onClick={() => setReviewToDelete(fb)}
                    title="Delete Review"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
                "{fb.comment}"
              </p>

              {fb.tags && fb.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fb.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {reviewToDelete && (
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
                    <h3 className="text-lg font-bold text-zinc-100">Delete Guest Review?</h3>
                    <p className="text-xs text-zinc-400">Permanently remove this review from the store</p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewToDelete(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 my-4 space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Guest:</span>
                  <span className="font-bold text-zinc-100">{reviewToDelete.customerName || 'Valued Guest'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Rating:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    {reviewToDelete.rating}.0 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800/80">
                  <p className="italic text-zinc-400 text-[11px]">"{reviewToDelete.comment}"</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setReviewToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
