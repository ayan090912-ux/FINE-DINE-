import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category, MenuItem, Order } from '../../types';
import { CustomerHeader } from './CustomerHeader';
import { FoodCard } from './FoodCard';
import { FoodDetailModal } from './FoodDetailModal';
import { CartDrawer, CartItem } from './CartDrawer';
import { OrderTrackerModal } from './OrderTrackerModal';
import { CallWaiterModal } from './CallWaiterModal';
import { FeedbackModal } from './FeedbackModal';
import { Search, Utensils, Filter } from 'lucide-react';
import { fetchPublicMenu, fetchRestaurantOrders } from '../../services/api';

interface CustomerAppProps {
  restaurantId: string;
  tableId: string;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  restaurantId,
  tableId,
}) => {
  const { tables, settings } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Modals & Drawers state
  const [selectedFoodItem, setSelectedFoodItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Cart State (stored locally for customer session)
  const [cart, setCart] = useState<CartItem[]>([]);

  const activeTable = tables.find((t) => t.id === tableId || t.tableNumber === tableId) || {
    id: tableId,
    tableNumber: tableId,
    name: `Table ${tableId}`,
  };

  // Active orders placed by this table
  const activeOrders = orders.filter(
    (o) => (o.tableId === tableId || o.tableNumber === tableId) && o.status !== 'completed' && o.status !== 'cancelled'
  );

  // Cart operations
  const handleUpdateCartQuantity = (menuItemId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) return prev.filter((i) => i.menuItemId !== menuItemId);
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing) {
        return prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: newQty } : i));
      } else {
        return [...prev, { menuItemId, quantity: newQty }];
      }
    });
  };

  const handleAddToCartWithNotes = (item: MenuItem, qty: number, notes: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + qty, specialNotes: notes || i.specialNotes } : i
        );
      }
      return [...prev, { menuItemId: item.id, quantity: qty, specialNotes: notes }];
    });
  };

  const cartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [menuData, orderData] = await Promise.all([
          fetchPublicMenu(restaurantId),
          fetchRestaurantOrders(restaurantId),
        ]);

        if (!isMounted) return;
        setCategories(menuData.categories);
        setMenuItems(menuData.menuItems);
        setOrders(orderData);
      } catch (error) {
        console.error('Unable to load customer menu or orders', error);
      }
    };

    loadData();
    const intervalId = window.setInterval(loadData, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [restaurantId]);

  // Menu filtering
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.available) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (dietaryFilter === 'veg' && item.vegType !== 'veg') return false;
    if (dietaryFilter === 'non-veg' && item.vegType !== 'non-veg') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-24">
      {/* Customer Application Header */}
      <CustomerHeader
        tableNumber={activeTable.tableNumber}
        tableName={activeTable.name}
        cartCount={cartCount}
        activeOrderCount={activeOrders.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenCallWaiter={() => setIsCallWaiterOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <main className="max-w-4xl mx-auto w-full px-4 pt-4 flex-1 space-y-5">
        {/* Active Order Banner if orders exist */}
        {activeOrders.length > 0 && (
          <div
            onClick={() => setIsOrdersOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                {activeOrders.length}
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Active Order(s) In Progress</p>
                <p className="text-[11px] text-zinc-400">Tap to view live status & Kitchen ETA timeline</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 underline">Track Order →</span>
          </div>
        )}

        {/* Search Bar & Dietary Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, or ingredients..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                dietaryFilter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === 'veg' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                dietaryFilter === 'non-veg' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {selectedCategory === 'all'
                  ? 'Artisanal Selection'
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            </h2>
            <span className="text-[11px] text-zinc-500">{filteredMenuItems.length} items available</span>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-zinc-500 space-y-2">
              <Filter className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No dishes matched your filter or search query</p>
              <p className="text-xs text-zinc-600">Try clearing your search or switching categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMenuItems.map((item) => {
                const cartEntry = cart.find((c) => c.menuItemId === item.id);
                return (
                  <FoodCard
                    key={item.id}
                    item={item}
                    quantityInCart={cartEntry ? cartEntry.quantity : 0}
                    onUpdateCart={(qty) => handleUpdateCartQuantity(item.id, qty)}
                    onSelect={() => setSelectedFoodItem(item)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar if cart not empty */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold p-3.5 rounded-2xl shadow-2xl flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl bg-zinc-950 text-amber-400 text-xs font-extrabold">
                {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
              </span>
              <span className="text-xs font-bold text-zinc-900">Basket Ready</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold">
              <span>View Cart →</span>
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <FoodDetailModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        onAddToCart={handleAddToCartWithNotes}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        restaurantId={restaurantId}
        tableId={activeTable.id}
        menuItems={menuItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={() => setCart([])}
        onOrderPlaced={() => {
          setIsOrdersOpen(true);
          fetchRestaurantOrders(restaurantId).then(setOrders).catch(console.error);
        }}
      />

      <OrderTrackerModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        tableId={activeTable.id}
        orders={orders}
        currencySymbol={settings.currencySymbol}
      />

      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        restaurantId={restaurantId}
        tableId={activeTable.id}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        tableId={activeTable.id}
      />
    </div>
  );
};
