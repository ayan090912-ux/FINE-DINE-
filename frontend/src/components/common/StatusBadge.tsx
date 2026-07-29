import React from 'react';
import { OrderStatus, VegType } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<OrderStatus, { bg: string; text: string; label: string; dot: string }> = {
    received: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'Order Received', dot: 'bg-blue-400' },
    accepted: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Accepted', dot: 'bg-amber-400' },
    preparing: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', label: 'Preparing', dot: 'bg-orange-400 animate-pulse' },
    ready: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Ready to Serve', dot: 'bg-emerald-400 animate-ping' },
    delivered: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400', label: 'Delivered', dot: 'bg-cyan-400' },
    completed: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', label: 'Completed', dot: 'bg-zinc-500' },
    cancelled: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', label: 'Cancelled', dot: 'bg-rose-400' },
  };

  const style = styles[status] || styles.received;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

export const VegBadge: React.FC<{ type: VegType }> = ({ type }) => {
  if (type === 'veg') {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-emerald-500 bg-emerald-950/40 p-0.5" title="Pure Veg">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </span>
    );
  }
  if (type === 'non-veg') {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-rose-500 bg-rose-950/40 p-0.5" title="Non-Veg">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-amber-500 bg-amber-950/40 p-0.5" title="Contains Egg">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
    </span>
  );
};
