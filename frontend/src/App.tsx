import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { CustomerApp } from './apps/customer/CustomerApp';
import { OwnerApp } from './apps/owner/OwnerApp';
import { KitchenApp } from './apps/kitchen/KitchenApp';
import { WaiterApp } from './apps/waiter/WaiterApp';
import { LoginView } from './apps/auth/LoginView';
import { QrCode, ShieldCheck, ChefHat, BellRing, Smartphone, ExternalLink } from 'lucide-react';

function AppContent() {
  const { authUsers, logout, settings, tables } = useStore();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  // Listen to browser location changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // 1. Customer Application Route Check (/qr/:restaurantId/:tableId or default customer mode)
  if (currentPath.startsWith('/qr/')) {
    const parts = currentPath.split('/');
    const restaurantId = parts[2] || 'dineflow';
    const tableId = parts[3] || 't-4';

    return <CustomerApp restaurantId={restaurantId} tableId={tableId} />;
  }

  // 2. Owner Application Route Check (/admin or /admin/login or /admin/dashboard)
  if (currentPath.startsWith('/admin')) {
    if (!authUsers.owner) {
      return (
        <LoginView
          role="owner"
          onSuccess={() => navigateTo('/admin/dashboard')}
        />
      );
    }
    return <OwnerApp onLogout={() => { logout('owner'); navigateTo('/admin/login'); }} />;
  }

  // 3. Kitchen Application Route Check (/kitchen or /kitchen/login or /kitchen/dashboard)
  if (currentPath.startsWith('/kitchen')) {
    if (!authUsers.kitchen) {
      return (
        <LoginView
          role="kitchen"
          onSuccess={() => navigateTo('/kitchen/dashboard')}
        />
      );
    }
    return <KitchenApp onLogout={() => { logout('kitchen'); navigateTo('/kitchen/login'); }} />;
  }

  // 4. Waiter Application Route Check (/waiter or /waiter/login or /waiter/dashboard)
  if (currentPath.startsWith('/waiter')) {
    if (!authUsers.waiter) {
      return (
        <LoginView
          role="waiter"
          onSuccess={() => navigateTo('/waiter/dashboard')}
        />
      );
    }
    return <WaiterApp onLogout={() => { logout('waiter'); navigateTo('/waiter/login'); }} />;
  }

  // 5. Default Landing / Simulation Router Screen at root '/'
  // Allows testing all 4 applications in isolation while keeping Customer UI strictly separated!
  const defaultTable = tables[0] || { id: 't-4', tableNumber: '04' };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-8 relative z-10 text-center">
        {/* Header Branding */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
            <QrCode className="w-4 h-4" />
            <span>Restaurant Operating System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{settings.name}</h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Four completely independent applications operating on the same live backend context.
            Select a terminal below to enter that system.
          </p>
        </div>

        {/* 4 Application Terminals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Customer App Card */}
          <div
            onClick={() => navigateTo(`/qr/${settings.id}/${defaultTable.id}`)}
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                1. Customer App (QR Mode)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Scanned via Table QR code. Menu browsing, multi-orders, live ETA countdown, call waiter, and reviews.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-amber-400/80">
              URL: /qr/dineflow/{defaultTable.id}
            </div>
          </div>

          {/* Owner App Card */}
          <div
            onClick={() => navigateTo('/admin/login')}
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                2. Owner Portal
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Revenue analytics, table management, QR generator with card printing, drag & drop menu, and offer engine.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-amber-400/80">
              URL: /admin/dashboard
            </div>
          </div>

          {/* Kitchen App Card */}
          <div
            onClick={() => navigateTo('/kitchen/login')}
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <ChefHat className="w-6 h-6" />
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                3. Kitchen Display System (KDS)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                POS-style queue board, audio order chimes, stage transitions, and live ETA setting.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-orange-400/80">
              URL: /kitchen/dashboard
            </div>
          </div>

          {/* Waiter App Card */}
          <div
            onClick={() => navigateTo('/waiter/login')}
            className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BellRing className="w-6 h-6" />
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                4. Waiter Terminal
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Floor dispatch for ready orders, water/bill/cutlery table requests, and delivery confirmation.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-emerald-400/80">
              URL: /waiter/dashboard
            </div>
          </div>
        </div>

        {/* Quick Launch Direct Button */}
        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={() => navigateTo(`/qr/dineflow/${defaultTable.id}`)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition"
          >
            Launch Customer QR Application Demo (Table 04)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
