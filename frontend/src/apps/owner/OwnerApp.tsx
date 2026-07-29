import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { OwnerDashboard } from './OwnerDashboard';
import { BusinessDayManager } from './BusinessDayManager';
import { OrderStreamManager } from './OrderStreamManager';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { QRManager } from './QRManager';
import { PromotionsManager } from './PromotionsManager';
import { SettingsManager } from './SettingsManager';
import { FeedbackViewer } from './FeedbackViewer';
import {
  LayoutDashboard,
  Utensils,
  MapPin,
  QrCode,
  Tag,
  Settings,
  MessageSquare,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Calendar,
  Key,
  User,
} from 'lucide-react';
import { OrderStatusBadge } from '../../components/common/StatusBadge';

interface NavItem {
  id: 'dashboard' | 'business_day' | 'orders' | 'menu' | 'tables' | 'qr' | 'promotions' | 'settings' | 'feedback';
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const OwnerApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { settings, orders, ownerUsername, ownerSecurityCode } = useStore();
  const [currentSection, setCurrentSection] = useState<
    'dashboard' | 'business_day' | 'orders' | 'menu' | 'tables' | 'qr' | 'promotions' | 'settings' | 'feedback'
  >('dashboard');

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'business_day', label: 'Business Day Management', icon: Calendar },
    { id: 'orders', label: 'All Orders Stream', icon: ShoppingBag, badge: orders.length },
    { id: 'menu', label: 'Menu & Dishes', icon: Utensils },
    { id: 'tables', label: 'Table Floor Plan', icon: MapPin },
    { id: 'qr', label: 'Table QR Station', icon: QrCode },
    { id: 'promotions', label: 'Promotions & Offers', icon: Tag },
    { id: 'settings', label: 'Brand & Password Security', icon: Settings },
    { id: 'feedback', label: 'Guest Feedback', icon: MessageSquare },
  ];

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 shrink-0 flex flex-col justify-between hidden md:flex h-screen overflow-y-auto">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-zinc-800" />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase truncate">{settings.name}</h1>
              <p className="text-[10px] text-amber-400 font-bold tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> OWNER PORTAL
              </p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/10'
                      : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-zinc-950 text-amber-400 font-extrabold' : 'bg-zinc-800 text-zinc-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Info & Logout Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-2.5 shrink-0 bg-zinc-900">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Logged In ID</span>
                <span className="text-xs font-bold text-white truncate block">{ownerUsername}</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentSection('settings')}
              className="p-1.5 rounded-lg bg-zinc-900 text-amber-400 hover:bg-zinc-800 border border-zinc-700 transition cursor-pointer"
              title="Change Password & Security Settings"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700/50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Owner Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Mobile/Desktop Header Bar */}
        <header className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              {settings.logoUrl && <img src={settings.logoUrl} className="w-7 h-7 rounded-lg" />}
              <span className="text-xs font-bold uppercase">{settings.name}</span>
            </div>
            <h2 className="text-sm font-bold text-white hidden md:block uppercase tracking-wider">
              {navItems.find((n) => n.id === currentSection)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentSection('settings')}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password & Security</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 md:px-3 md:py-1.5 rounded-xl bg-zinc-800 text-rose-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-700 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto p-2 bg-zinc-900 border-b border-zinc-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                currentSection === item.id ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Body View Container */}
        <main className="p-6 flex-1">
          {currentSection === 'dashboard' && (
            <OwnerDashboard
              onNavigateToBusinessDay={() => setCurrentSection('business_day')}
              onNavigateToOrders={() => setCurrentSection('orders')}
            />
          )}
          {currentSection === 'business_day' && <BusinessDayManager />}
          {currentSection === 'orders' && <OrderStreamManager />}
          {currentSection === 'menu' && <MenuManager />}
          {currentSection === 'tables' && <TableManager />}
          {currentSection === 'qr' && <QRManager />}
          {currentSection === 'promotions' && <PromotionsManager />}
          {currentSection === 'settings' && <SettingsManager />}
          {currentSection === 'feedback' && <FeedbackViewer />}
        </main>
      </div>
    </div>
  );
};
