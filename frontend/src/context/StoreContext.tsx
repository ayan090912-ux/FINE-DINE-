import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MenuItem,
  Category,
  Table,
  Order,
  OrderStatus,
  ServiceRequest,
  ServiceRequestType,
  Promotion,
  RestaurantSettings,
  Feedback,
  AuthUser,
  UserRole,
  BusinessDayRecord,
} from '../types';
import {
  initialCategories,
  initialMenuItems,
  initialTables,
  initialPromotions,
  initialRestaurantSettings,
  initialFeedbacks,
} from '../data/mockData';
import { soundManager } from '../utils/audio';

interface StoreContextType {
  // Data
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  serviceRequests: ServiceRequest[];
  promotions: Promotion[];
  settings: RestaurantSettings;
  feedbacks: Feedback[];
  authUsers: Record<UserRole, AuthUser | null>;
  businessDayHistory: BusinessDayRecord[];
  archivedOrders: Order[];
  currentDailyOrderSequence: number;

  // Credentials & Security
  ownerUsername: string;
  ownerPassword: string;
  ownerSecurityCode: string;

  // Actions - Business Day
  closeBusinessDay: (ownerPassword?: string) => { success: boolean; error?: string };
  deleteBusinessDayRecord: (recordId: string) => void;

  // Actions - Menu
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Actions - Tables
  addTable: (table: Omit<Table, 'id' | 'isOccupied'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  mergeTables: (primaryTableId: string, secondaryTableId: string) => void;

  // Actions - Orders
  createOrder: (tableId: string, items: { menuItemId: string; quantity: number; specialNotes?: string }[], promoName?: string, discountAmount?: number) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderEta: (orderId: string, etaMinutes: number) => void;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;

  // Actions - Service Requests (Waiter)
  createServiceRequest: (tableId: string, type: ServiceRequestType, note?: string) => void;
  fulfillServiceRequest: (requestId: string) => void;

  // Actions - Promotions
  createPromotion: (promo: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotion: (id: string) => void;

  // Actions - Settings & Feedback
  updateSettings: (updates: Partial<RestaurantSettings>) => void;
  submitFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  deleteFeedback: (id: string) => void;

  // Security & Credential Actions
  changeOwnerPassword: (currentPass: string, newPass: string) => { success: boolean; error?: string };
  resetOwnerPasswordWithCode: (uniqueCode: string, newPass: string) => { success: boolean; error?: string };
  updateOwnerSecurityCode: (currentPass: string, newCode: string) => { success: boolean; error?: string };
  updateOwnerUsername: (currentPass: string, newUsername: string) => { success: boolean; error?: string };

  // Auth
  login: (role: UserRole, username: string, password?: string) => { success: boolean; error?: string };
  logout: (role: UserRole) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const SYNC_CHANNEL = 'dineflow_channel_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or mock data
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('df_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('df_menu_items');
    return saved ? JSON.parse(saved) : initialMenuItems;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('df_tables');
    return saved ? JSON.parse(saved) : initialTables;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('df_orders');
    if (saved) return JSON.parse(saved);
    // Seed an initial active order for table 4 so demonstration looks active
    return [
      {
        id: 'ord-101',
        orderNumber: '#101',
        restaurantId: 'dineflow',
        tableId: 't-4',
        tableName: 'Garden Terrace 1',
        items: [
          { id: 'oi-1', menuItemId: 'item-1', name: 'Truffle Mushroom Arancini', price: 14.50, quantity: 2, vegType: 'veg' },
          { id: 'oi-2', menuItemId: 'item-5', name: 'Truffle & Burrata Margherita', price: 22.00, quantity: 1, vegType: 'veg' }
        ],
        status: 'preparing',
        subtotal: 51.00,
        discountAmount: 10.20,
        appliedPromotionName: 'Happy Hour 20% Off',
        totalAmount: 40.80,
        createdAt: new Date(Date.now() - 600000).toISOString(),
        acceptedAt: new Date(Date.now() - 300000).toISOString(),
        etaMinutes: 15,
        estimatedCompletionTime: new Date(Date.now() + 600000).toISOString(),
      }
    ];
  });

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    const saved = localStorage.getItem('df_service_requests');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'sr-1',
        restaurantId: 'dineflow',
        tableId: 't-4',
        tableName: 'Garden Terrace 1',
        type: 'water',
        status: 'pending',
        createdAt: new Date(Date.now() - 120000).toISOString(),
      }
    ];
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('df_promotions');
    return saved ? JSON.parse(saved) : initialPromotions;
  });

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('df_settings');
    return saved ? JSON.parse(saved) : initialRestaurantSettings;
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('df_feedbacks');
    return saved ? JSON.parse(saved) : initialFeedbacks;
  });

  const [authUsers, setAuthUsers] = useState<Record<UserRole, AuthUser | null>>(() => {
    const saved = localStorage.getItem('df_auth_users');
    return saved ? JSON.parse(saved) : { owner: null, kitchen: null, waiter: null, customer: null };
  });

  // Owner Credentials & Security Code
  const [ownerUsername, setOwnerUsername] = useState<string>(() => {
    return localStorage.getItem('df_owner_username') || 'owner';
  });
  const [ownerPassword, setOwnerPassword] = useState<string>(() => {
    return localStorage.getItem('df_owner_password') || 'owner123';
  });
  const [ownerSecurityCode, setOwnerSecurityCode] = useState<string>(() => {
    return localStorage.getItem('df_owner_security_code') || 'DF-8942';
  });

  const [businessDayHistory, setBusinessDayHistory] = useState<BusinessDayRecord[]>(() => {
    const saved = localStorage.getItem('df_business_day_history');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [archivedOrders, setArchivedOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('df_archived_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentDailyOrderSequence, setCurrentDailyOrderSequence] = useState<number>(() => {
    const saved = localStorage.getItem('df_order_sequence');
    return saved ? parseInt(saved, 10) : 102;
  });

  // Save changes to localStorage
  useEffect(() => { localStorage.setItem('df_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('df_menu_items', JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem('df_tables', JSON.stringify(tables)); }, [tables]);
  useEffect(() => { localStorage.setItem('df_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('df_service_requests', JSON.stringify(serviceRequests)); }, [serviceRequests]);
  useEffect(() => { localStorage.setItem('df_promotions', JSON.stringify(promotions)); }, [promotions]);
  useEffect(() => { localStorage.setItem('df_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('df_feedbacks', JSON.stringify(feedbacks)); }, [feedbacks]);
  useEffect(() => { localStorage.setItem('df_auth_users', JSON.stringify(authUsers)); }, [authUsers]);
  useEffect(() => { localStorage.setItem('df_owner_username', ownerUsername); }, [ownerUsername]);
  useEffect(() => { localStorage.setItem('df_owner_password', ownerPassword); }, [ownerPassword]);
  useEffect(() => { localStorage.setItem('df_owner_security_code', ownerSecurityCode); }, [ownerSecurityCode]);
  useEffect(() => { localStorage.setItem('df_business_day_history', JSON.stringify(businessDayHistory)); }, [businessDayHistory]);
  useEffect(() => { localStorage.setItem('df_archived_orders', JSON.stringify(archivedOrders)); }, [archivedOrders]);
  useEffect(() => { localStorage.setItem('df_order_sequence', currentDailyOrderSequence.toString()); }, [currentDailyOrderSequence]);

  // Sync across tabs via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel(SYNC_CHANNEL);

    bc.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'SYNC_ORDERS') {
        setOrders(data);
      } else if (type === 'SYNC_REQUESTS') {
        setServiceRequests(data);
      } else if (type === 'NEW_ORDER_ALERT') {
        soundManager.playOrderChime();
      } else if (type === 'NEW_SERVICE_ALERT') {
        soundManager.playWaiterCallChime();
      }
    };

    return () => bc.close();
  }, []);

  const broadcast = (type: string, data?: unknown) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(SYNC_CHANNEL);
        bc.postMessage({ type, data });
        bc.close();
      } catch {
        // Ignore broadcast errors
      }
    }
  };

  // Category Actions
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCat: Category = { ...category, id: `cat-${Date.now()}` };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // MenuItem Actions
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: `item-${Date.now()}` };
    setMenuItems((prev) => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Table Actions
  const addTable = (table: Omit<Table, 'id' | 'isOccupied'>) => {
    const newTable: Table = {
      ...table,
      id: `t-${Date.now()}`,
      isOccupied: false,
    };
    setTables((prev) => [...prev, newTable]);
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const mergeTables = (primaryTableId: string, secondaryTableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === secondaryTableId) {
          return { ...t, mergedWithTableId: primaryTableId, isActive: false };
        }
        return t;
      })
    );
  };

  // Order System
  const createOrder = (
    tableId: string,
    items: { menuItemId: string; quantity: number; specialNotes?: string }[],
    promoName?: string,
    discountAmount: number = 0
  ) => {
    const table = tables.find((t) => t.id === tableId || t.tableNumber === tableId);
    const tableName = table ? `${table.name} (${table.tableNumber})` : `Table ${tableId}`;

    const orderNumStr = `#${currentDailyOrderSequence}`;
    setCurrentDailyOrderSequence((prev) => prev + 1);

    const orderItems = items.map((i) => {
      const menu = menuItems.find((m) => m.id === i.menuItemId);
      return {
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItemId: i.menuItemId,
        name: menu ? menu.name : 'Custom Item',
        price: menu ? menu.price : 0,
        quantity: i.quantity,
        specialNotes: i.specialNotes,
        vegType: menu ? menu.vegType : ('veg' as const),
      };
    });

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNumStr,
      restaurantId: 'dineflow',
      tableId: table ? table.id : tableId,
      tableName,
      items: orderItems,
      status: 'received',
      subtotal,
      discountAmount,
      appliedPromotionName: promoName,
      totalAmount: finalTotal,
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => {
      const next = [newOrder, ...prev];
      broadcast('SYNC_ORDERS', next);
      broadcast('NEW_ORDER_ALERT');
      return next;
    });

    // Mark table as occupied
    if (table) {
      updateTable(table.id, { isOccupied: true });
    }

    soundManager.playOrderChime();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          const updates: Partial<Order> = { status };
          if (status === 'accepted') updates.acceptedAt = new Date().toISOString();
          if (status === 'completed' || status === 'delivered') updates.completedAt = new Date().toISOString();
          return { ...o, ...updates };
        }
        return o;
      });
      broadcast('SYNC_ORDERS', next);
      return next;
    });
  };

  const updateOrderEta = (orderId: string, etaMinutes: number) => {
    const estimatedCompletionTime = new Date(Date.now() + etaMinutes * 60000).toISOString();
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'preparing',
            etaMinutes,
            estimatedCompletionTime,
            acceptedAt: o.acceptedAt || new Date().toISOString(),
          };
        }
        return o;
      });
      broadcast('SYNC_ORDERS', next);
      return next;
    });
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      broadcast('SYNC_ORDERS', next);
      return next;
    });
  };

  // Service Requests (Waiter calls)
  const createServiceRequest = (tableId: string, type: ServiceRequestType, note?: string) => {
    const table = tables.find((t) => t.id === tableId || t.tableNumber === tableId);
    const tableName = table ? `${table.name} (${table.tableNumber})` : `Table ${tableId}`;

    const newReq: ServiceRequest = {
      id: `sr-${Date.now()}`,
      restaurantId: 'dineflow',
      tableId: table ? table.id : tableId,
      tableName,
      type,
      note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setServiceRequests((prev) => {
      const next = [newReq, ...prev];
      broadcast('SYNC_REQUESTS', next);
      broadcast('NEW_SERVICE_ALERT');
      return next;
    });

    soundManager.playWaiterCallChime();
  };

  const fulfillServiceRequest = (requestId: string) => {
    setServiceRequests((prev) => {
      const next = prev.map((r) =>
        r.id === requestId ? { ...r, status: 'fulfilled' as const, fulfilledAt: new Date().toISOString() } : r
      );
      broadcast('SYNC_REQUESTS', next);
      return next;
    });
  };

  // Promotion Actions
  const createPromotion = (promo: Omit<Promotion, 'id'>) => {
    const newPromo: Promotion = { ...promo, id: `promo-${Date.now()}` };
    setPromotions((prev) => [...prev, newPromo]);
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePromotion = (id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  // Settings & Feedback
  const updateSettings = (updates: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const submitFeedback = (feedback: Omit<Feedback, 'id' | 'createdAt'>) => {
    const newFb: Feedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFb, ...prev]);
  };

  const deleteFeedback = (id: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
  };

  // Security & Credentials
  const changeOwnerPassword = (currentPass: string, newPass: string): { success: boolean; error?: string } => {
    if (currentPass !== ownerPassword) {
      return { success: false, error: 'Current password does not match.' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    setOwnerPassword(newPass.trim());
    return { success: true };
  };

  const resetOwnerPasswordWithCode = (uniqueCode: string, newPass: string): { success: boolean; error?: string } => {
    if (!uniqueCode || uniqueCode.trim().toUpperCase() !== ownerSecurityCode.trim().toUpperCase()) {
      return { success: false, error: 'Invalid Unique Security Code. Please check your reset key.' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }
    setOwnerPassword(newPass.trim());
    return { success: true };
  };

  const updateOwnerSecurityCode = (currentPass: string, newCode: string): { success: boolean; error?: string } => {
    if (currentPass !== ownerPassword) {
      return { success: false, error: 'Incorrect current password.' };
    }
    if (!newCode || newCode.trim().length < 4) {
      return { success: false, error: 'Security code must be at least 4 characters long.' };
    }
    setOwnerSecurityCode(newCode.trim().toUpperCase());
    return { success: true };
  };

  const updateOwnerUsername = (currentPass: string, newUsername: string): { success: boolean; error?: string } => {
    if (currentPass !== ownerPassword) {
      return { success: false, error: 'Incorrect current password.' };
    }
    if (!newUsername || newUsername.trim().length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    setOwnerUsername(newUsername.trim());
    return { success: true };
  };

  // Business Day Management
  const closeBusinessDay = (inputPassword?: string) => {
    if (inputPassword && inputPassword.trim() !== '') {
      if (inputPassword.trim() !== ownerPassword) {
        return { success: false, error: 'Invalid owner password. Please try again.' };
      }
    }

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const todayRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const todayOrdersCount = orders.length;
    const uniqueTablesCount = new Set(orders.map((o) => o.tableId)).size;
    const todayCustomers = Math.max(todayOrdersCount * 2, uniqueTablesCount * 3);
    const avgOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

    const itemCounts: { [name: string]: number } = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      })
    );
    const topBestseller =
      Object.keys(itemCounts).sort((a, b) => itemCounts[b] - itemCounts[a])[0] || 'Truffle & Burrata Margherita';

    const newRecord: BusinessDayRecord = {
      id: `bd-${Date.now()}`,
      date: dateStr,
      closedAt: new Date().toISOString(),
      totalRevenue: todayRevenue,
      totalOrders: todayOrdersCount,
      totalCustomers: todayCustomers,
      averageOrderValue: avgOrderValue,
      archivedOrders: [...orders],
      topBestseller,
      notes: `Closed successfully by ${authUsers.owner?.username || 'Owner'}.`,
    };

    setArchivedOrders((prev) => [...orders, ...prev]);
    setBusinessDayHistory((prev) => [newRecord, ...prev]);
    setOrders([]);
    broadcast('SYNC_ORDERS', []);
    setCurrentDailyOrderSequence(1);
    setServiceRequests([]);
    broadcast('SYNC_REQUESTS', []);
    setTables((prev) => prev.map((t) => ({ ...t, isOccupied: false })));

    return { success: true };
  };

  const deleteBusinessDayRecord = (recordId: string) => {
    setBusinessDayHistory((prev) => prev.filter((item) => item.id !== recordId));
  };

  // Authentication
  const login = (role: UserRole, username: string, password?: string): { success: boolean; error?: string } => {
    const cleanUser = username.trim();
    const cleanPass = password ? password.trim() : '';

    if (role === 'owner') {
      if (cleanUser.toLowerCase() !== ownerUsername.toLowerCase()) {
        return { success: false, error: `Invalid username. Owner login ID is '${ownerUsername}'` };
      }
      if (!cleanPass) {
        return { success: false, error: 'Password is required to access the Owner Portal.' };
      }
      if (cleanPass !== ownerPassword) {
        return { success: false, error: 'Incorrect password. Click "Reset Password with Unique Code" if forgotten.' };
      }
    } else if (role === 'kitchen') {
      if (cleanPass && cleanPass !== 'chef123' && cleanPass !== ownerPassword) {
        return { success: false, error: 'Incorrect passcode for Kitchen terminal.' };
      }
    } else if (role === 'waiter') {
      if (cleanPass && cleanPass !== 'waiter123' && cleanPass !== ownerPassword) {
        return { success: false, error: 'Incorrect passcode for Waiter terminal.' };
      }
    }

    const token = `token-${role}-${Date.now()}`;
    const user: AuthUser = { role, username: cleanUser, token };
    setAuthUsers((prev) => ({ ...prev, [role]: user }));
    return { success: true };
  };

  const logout = (role: UserRole) => {
    setAuthUsers((prev) => ({ ...prev, [role]: null }));
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        menuItems,
        tables,
        orders,
        serviceRequests,
        promotions,
        settings,
        feedbacks,
        authUsers,
        businessDayHistory,
        archivedOrders,
        currentDailyOrderSequence,
        ownerUsername,
        ownerPassword,
        ownerSecurityCode,
        closeBusinessDay,
        deleteBusinessDayRecord,
        addCategory,
        updateCategory,
        deleteCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addTable,
        updateTable,
        deleteTable,
        mergeTables,
        createOrder,
        updateOrderStatus,
        updateOrderEta,
        cancelOrder,
        deleteOrder,
        createServiceRequest,
        fulfillServiceRequest,
        createPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotion,
        updateSettings,
        submitFeedback,
        deleteFeedback,
        changeOwnerPassword,
        resetOwnerPasswordWithCode,
        updateOwnerSecurityCode,
        updateOwnerUsername,
        login,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
