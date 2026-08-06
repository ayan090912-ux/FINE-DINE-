import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  Employee,
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
import {
  fetchPublicMenu,
  fetchRestaurantOrders,
  fetchRestaurantRequests,
  fetchRestaurantTables,
  createCategoryViaApi,
  updateCategoryViaApi,
  deleteCategoryViaApi,
  createMenuItemViaApi,
  updateMenuItemViaApi,
  deleteMenuItemViaApi,
  createOrderViaApi,
  updateOrderStatusViaApi,
  createServiceRequestViaApi,
  updateServiceRequestStatusViaApi,
  createTableViaApi,
  updateTableViaApi,
  deleteTableViaApi,
  closeTableSessionViaApi,
  reserveTableViaApi,
  unreserveTableViaApi,
  acceptServiceRequestViaApi,
  inProgressServiceRequestViaApi,
  completeServiceRequestViaApi,
  fetchEmployeesViaApi,
  createEmployeeViaApi,
  updateEmployeeViaApi,
  resetEmployeePasswordViaApi,
  uploadEmployeePhotoViaApi,
  setEmployeeOnlineStatusViaApi,
  logoutEmployeeViaApi,
  deleteEmployeeViaApi,
  fetchRestaurantSettingsViaApi,
  updateRestaurantSettingsViaApi,
} from '../services/api';

import { realtimeWs } from '../services/websocket';

interface StoreContextType {
  // Data
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  serviceRequests: ServiceRequest[];
  employees: Employee[];
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

  // Actions - Employees (EMS)
  addEmployee: (data: any) => Promise<Employee>;
  updateEmployee: (id: string, updates: any) => Promise<Employee>;
  resetEmployeePassword: (id: string, newPass: string) => Promise<Employee>;
  uploadEmployeePhoto: (id: string, file: File) => Promise<string>;
  setEmployeeOnlineStatus: (id: string, status: string) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  refreshEmployees: () => Promise<void>;

  // Actions - Business Day
  closeBusinessDay: (ownerPassword?: string) => { success: boolean; error?: string };
  deleteBusinessDayRecord: (recordId: string) => void;

  // Actions - Menu
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Actions - Tables
  addTable: (table: Omit<Table, 'id' | 'isOccupied'>) => Promise<void>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  mergeTables: (primaryTableId: string, secondaryTableId: string) => Promise<void>;
  vacateTable: (tableId: string) => Promise<void>;
  reserveTable: (tableId: string) => Promise<void>;
  unreserveTable: (tableId: string) => Promise<void>;

  // Actions - Orders
  createOrder: (tableId: string, items: { menuItemId: string; quantity: number; specialNotes?: string }[], promoName?: string, discountAmount?: number) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderEta: (orderId: string, etaMinutes: number) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => void;

  // Actions - Service Requests (Waiter Dispatch)
  createServiceRequest: (tableId: string, type: ServiceRequestType, note?: string) => Promise<void>;
  acceptServiceRequest: (requestId: string, waiterName: string, waiterId?: string) => Promise<void>;
  inProgressServiceRequest: (requestId: string, waiterId?: string) => Promise<void>;
  completeServiceRequest: (requestId: string, waiterId?: string) => Promise<void>;
  fulfillServiceRequest: (requestId: string) => Promise<void>;

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
  login: (role: UserRole, username: string, password?: string, empProfile?: Partial<Employee>) => { success: boolean; error?: string };
  logout: (role: UserRole) => void;

  // Data Reload
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restaurantId = 'dineflow';

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('df_promotions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialPromotions;
  });

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('df_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.id || parsed.id === 'rest-dineflow') {
          parsed.id = 'dineflow';
        }
        return parsed;
      } catch (e) {}
    }
    return initialRestaurantSettings;
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    const saved = localStorage.getItem('df_feedbacks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialFeedbacks;
  });

  const [authUsers, setAuthUsers] = useState<Record<UserRole, AuthUser | null>>(() => {
    const saved = localStorage.getItem('df_auth_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // Clean legacy default tokens for employee accounts
          if (parsed.kitchen?.token?.includes('default')) parsed.kitchen = null;
          if (parsed.waiter?.token?.includes('default')) parsed.waiter = null;
          return parsed;
        }
      } catch (e) {}
    }
    return {
      owner: { role: 'owner', username: 'owner', token: 'token-owner-default' },
      kitchen: null,
      waiter: null,
      customer: null,
    };
  });


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
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [archivedOrders, setArchivedOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('df_archived_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [currentDailyOrderSequence, setCurrentDailyOrderSequence] = useState<number>(() => {
    const saved = localStorage.getItem('df_order_sequence');
    return saved ? parseInt(saved, 10) : 102;
  });

  // LocalStorage persist for settings & auth
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

  // Load Settings Data from Backend API
  const loadSettings = useCallback(async () => {
    try {
      const fetchedSettings = await fetchRestaurantSettingsViaApi(restaurantId);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
    } catch (err) {
      console.warn('[DineFlow Store] Backend settings fetch failed.', err);
    }
  }, [restaurantId]);

  // Load Menu Data from Backend API
  const loadMenu = useCallback(async () => {
    try {
      const data = await fetchPublicMenu(restaurantId);
      if (data.categories) setCategories(data.categories);
      if (data.menuItems) setMenuItems(data.menuItems);
      if (data.currency) {
        setSettings((prev) => ({ ...prev, currencySymbol: data.currency }));
      }
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.warn('[DineFlow Store] Backend menu fetch failed.', err);
    }
  }, [restaurantId]);

  // Load Orders Data from Backend API
  const loadOrders = useCallback(async () => {
    try {
      const fetchedOrders = await fetchRestaurantOrders(restaurantId);
      setOrders(fetchedOrders);
    } catch (err) {
      console.warn('[DineFlow Store] Backend orders fetch failed.', err);
    }
  }, [restaurantId]);

  // Load Service Requests Data from Backend API
  const loadRequests = useCallback(async () => {
    try {
      const fetchedRequests = await fetchRestaurantRequests(restaurantId);
      setServiceRequests(fetchedRequests);
    } catch (err) {
      console.warn('[DineFlow Store] Backend requests fetch failed.', err);
    }
  }, [restaurantId]);

  // Load Tables Data from Backend API
  const loadTables = useCallback(async () => {
    try {
      const fetchedTables = await fetchRestaurantTables(restaurantId);
      if (fetchedTables && fetchedTables.length > 0) setTables(fetchedTables);
    } catch (err) {
      console.warn('[DineFlow Store] Backend tables fetch failed.', err);
    }
  }, [restaurantId]);

  // Load Employees Data from Backend API
  const loadEmployees = useCallback(async () => {
    try {
      const fetchedEmployees = await fetchEmployeesViaApi(restaurantId);
      setEmployees(fetchedEmployees);
    } catch (err) {
      console.warn('[DineFlow Store] Backend employees fetch failed.', err);
    }
  }, [restaurantId]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadMenu(), loadSettings(), loadOrders(), loadRequests(), loadTables(), loadEmployees()]);
  }, [loadMenu, loadSettings, loadOrders, loadRequests, loadTables, loadEmployees]);

  // Initial Load & Realtime WebSocket connection setup
  useEffect(() => {
    refreshData();

    // Connect WebSocket
    realtimeWs.connect(restaurantId);

    // Subscribe to incoming WebSocket events
    const unsubscribe = realtimeWs.subscribe((event) => {
      const type = event.event_type;
      if (type === 'NEW_ORDER') {
        soundManager.playOrderChime();
        loadOrders();
      } else if (type === 'ORDER_STATUS_CHANGED') {
        loadOrders();
      } else if (type === 'CUSTOMER_REQUEST' || type === 'REQUEST_ACCEPTED' || type === 'REQUEST_IN_PROGRESS' || type === 'REQUEST_COMPLETED' || type === 'REQUEST_STATUS_CHANGED') {
        if (type === 'CUSTOMER_REQUEST') soundManager.playWaiterCallChime();
        loadRequests();
      } else if (type === 'MENU_UPDATED' || type === 'RESTAURANT_SETTINGS_UPDATED') {
        loadMenu();
        loadSettings();
      } else if (type === 'TABLE_UPDATED' || type === 'SESSION_STARTED' || type === 'SESSION_UPDATED' || type === 'SESSION_CLOSED') {
        loadTables();
        loadOrders();
      } else if (type === 'EMPLOYEE_ONLINE' || type === 'EMPLOYEE_OFFLINE' || type === 'EMPLOYEE_STATUS_CHANGED' || type === 'EMPLOYEE_UPDATED') {
        loadEmployees();
      }
    });

    // Fallback polling interval (every 6s) to ensure synchronization
    const pollInterval = window.setInterval(() => {
      loadMenu();
      loadSettings();
      loadOrders();
      loadRequests();
      loadEmployees();
    }, 6000);

    return () => {
      unsubscribe();
      window.clearInterval(pollInterval);
    };
  }, [restaurantId, refreshData, loadOrders, loadRequests, loadMenu, loadSettings, loadTables, loadEmployees]);

  // Employee Actions
  const addEmployee = async (data: any) => {
    const created = await createEmployeeViaApi({ ...data, restaurant_id: restaurantId });
    setEmployees((prev) => [created, ...prev]);
    return created;
  };

  const updateEmployee = async (id: string, updates: any) => {
    const updated = await updateEmployeeViaApi(id, updates);
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const resetEmployeePassword = async (id: string, newPass: string) => {
    const updated = await resetEmployeePasswordViaApi(id, newPass);
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const uploadEmployeePhoto = async (id: string, file: File) => {
    const photoUrl = await uploadEmployeePhotoViaApi(id, file);
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, photoUrl } : e)));
    return photoUrl;
  };

  const setEmployeeOnlineStatus = async (id: string, status: string) => {
    const updated = await setEmployeeOnlineStatusViaApi(id, status);
    setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const deleteEmployee = async (id: string) => {
    await deleteEmployeeViaApi(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  // Category Actions
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const created = await createCategoryViaApi(restaurantId, category);
      setCategories((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create category on backend', err);
      // Fallback local update
      const newCat: Category = { ...category, id: `cat-${Date.now()}` };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const updated = await updateCategoryViaApi(id, updates);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Failed to update category on backend', err);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryViaApi(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete category on backend', err);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // MenuItem Actions
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const created = await createMenuItemViaApi(restaurantId, item);
      setMenuItems((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create menu item on backend', err);
      const newItem: MenuItem = { ...item, id: `item-${Date.now()}` };
      setMenuItems((prev) => [...prev, newItem]);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const updated = await updateMenuItemViaApi(id, updates);
      setMenuItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      console.error('Failed to update menu item on backend', err);
      setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await deleteMenuItemViaApi(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete menu item on backend', err);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Table Actions
  const addTable = async (table: Omit<Table, 'id' | 'isOccupied'>) => {
    try {
      const created = await createTableViaApi(restaurantId, table);
      setTables((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create table on backend', err);
      const newTable: Table = { ...table, id: `t-${Date.now()}`, isOccupied: false };
      setTables((prev) => [...prev, newTable]);
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      const updated = await updateTableViaApi(id, updates);
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update table on backend', err);
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteTableViaApi(id);
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete table on backend', err);
      setTables((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const mergeTables = async (primaryTableId: string, secondaryTableId: string) => {
    await updateTable(secondaryTableId, { mergedWithTableId: primaryTableId, isActive: false });
  };

  const vacateTable = async (tableId: string) => {
    try {
      await closeTableSessionViaApi(tableId, restaurantId);
      await Promise.all([loadTables(), loadOrders()]);
    } catch (err) {
      console.error('Failed to vacate table on backend', err);
    }
  };

  const reserveTable = async (tableId: string) => {
    try {
      const updated = await reserveTableViaApi(tableId, restaurantId);
      setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
    } catch (err) {
      console.error('Failed to reserve table on backend', err);
    }
  };

  const unreserveTable = async (tableId: string) => {
    try {
      const updated = await unreserveTableViaApi(tableId, restaurantId);
      setTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
    } catch (err) {
      console.error('Failed to unreserve table on backend', err);
    }
  };

  // Order System Actions
  const createOrder = async (
    tableId: string,
    items: { menuItemId: string; quantity: number; specialNotes?: string }[],
    promoName?: string,
    discountAmount: number = 0
  ): Promise<Order> => {
    try {
      const newOrder = await createOrderViaApi(restaurantId, tableId, items, promoName, discountAmount);
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      soundManager.playOrderChime();
      return newOrder;
    } catch (err) {
      console.error('Failed to create order on backend', err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await updateOrderStatusViaApi(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      console.error('Failed to update order status on backend', err);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  };

  const updateOrderEta = async (orderId: string, etaMinutes: number) => {
    try {
      const updated = await updateOrderStatusViaApi(orderId, 'preparing', etaMinutes);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      console.error('Failed to update order ETA on backend', err);
    }
  };

  const cancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'cancelled');
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Service Request Actions
  const createServiceRequest = async (tableId: string, type: ServiceRequestType, note?: string) => {
    try {
      const created = await createServiceRequestViaApi(restaurantId, tableId, type, note);
      setServiceRequests((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      soundManager.playWaiterCallChime();
    } catch (err) {
      console.error('Failed to create service request on backend', err);
    }
  };

  const acceptServiceRequest = async (requestId: string, waiterName: string, waiterId?: string) => {
    try {
      const updated = await acceptServiceRequestViaApi(requestId, waiterName, waiterId);
      setServiceRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Failed to accept service request on backend', err);
      await loadRequests();
    }
  };

  const inProgressServiceRequest = async (requestId: string, waiterId?: string) => {
    try {
      const updated = await inProgressServiceRequestViaApi(requestId, waiterId);
      setServiceRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Failed to mark service request in progress', err);
      await loadRequests();
    }
  };

  const completeServiceRequest = async (requestId: string, waiterId?: string) => {
    try {
      const updated = await completeServiceRequestViaApi(requestId, waiterId);
      setServiceRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Failed to complete service request on backend', err);
      await loadRequests();
    }
  };

  const fulfillServiceRequest = async (requestId: string) => {
    try {
      const updated = await updateServiceRequestStatusViaApi(requestId);
      setServiceRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (err) {
      console.error('Failed to fulfill service request on backend', err);
      setServiceRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'completed', completedAt: new Date().toISOString() } : r))
      );
    }
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
  const updateSettings = async (updates: Partial<RestaurantSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates, id: 'dineflow' }));
    try {
      const updated = await updateRestaurantSettingsViaApi(restaurantId, updates);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update restaurant settings on backend', err);
    }
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

  // Security Credentials
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
    setCurrentDailyOrderSequence(1);
    setServiceRequests([]);

    return { success: true };
  };

  const deleteBusinessDayRecord = (recordId: string) => {
    setBusinessDayHistory((prev) => prev.filter((item) => item.id !== recordId));
  };

  // Authentication
  const login = (
    role: UserRole,
    username: string,
    password?: string,
    empProfile?: Partial<Employee>
  ): { success: boolean; error?: string } => {
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
    } else if (role === 'waiter' || role === 'kitchen') {
      // Find employee by username in local state if empProfile not provided
      const targetEmp = empProfile || employees.find((e) => e.username.toLowerCase() === cleanUser.toLowerCase());
      if (targetEmp && targetEmp.employmentStatus === 'DISABLED') {
        return { success: false, error: 'Account is disabled. Please contact the restaurant owner.' };
      }
    }

    const matchedEmp = empProfile || employees.find((e) => e.username.toLowerCase() === cleanUser.toLowerCase());
    const empId = matchedEmp?.id;
    const nowIso = new Date().toISOString();

    const token = `token-${role}-${Date.now()}`;
    const user: AuthUser = {
      role,
      username: cleanUser,
      token,
      id: empId,
      fullName: matchedEmp?.fullName || empProfile?.fullName,
      employeeId: matchedEmp?.employeeId || empProfile?.employeeId,
      position: matchedEmp?.position || empProfile?.position,
      photoUrl: matchedEmp?.photoUrl || empProfile?.photoUrl,
    };

    setAuthUsers((prev) => {
      const updated = { ...prev, [role]: user };
      try {
        localStorage.setItem('df_auth_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (empId) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === empId
            ? {
                ...e,
                onlineStatus: 'ONLINE',
                lastLoginAt: nowIso,
                currentSessionStart: nowIso,
              }
            : e
        )
      );
      setEmployeeOnlineStatusViaApi(empId, 'ONLINE').catch(() => {});
    }

    return { success: true };
  };

  const logout = (role: UserRole) => {
    const currentAuth = authUsers[role];
    if (currentAuth?.id) {
      const empId = currentAuth.id;
      const nowIso = new Date().toISOString();
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === empId) {
            const startMs = e.currentSessionStart ? new Date(e.currentSessionStart).getTime() : Date.now();
            const sessionMin = Math.max(1, Math.round((Date.now() - startMs) / 60000));
            return {
              ...e,
              onlineStatus: 'OFFLINE',
              lastLogoutAt: nowIso,
              todayWorkingMinutes: (e.todayWorkingMinutes || 0) + sessionMin,
              currentSessionStart: undefined,
            };
          }
          return e;
        })
      );
      logoutEmployeeViaApi(empId)
        .then((updatedEmp) => {
          setEmployees((prev) => prev.map((e) => (e.id === empId ? updatedEmp : e)));
        })
        .catch((err) => console.warn('[DineFlow Auth] Failed to sync offline status on backend:', err));
    }

    setAuthUsers((prev) => {
      const updated = { ...prev, [role]: null };
      try {
        localStorage.setItem('df_auth_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <StoreContext.Provider
      value={{
        categories,
        menuItems,
        tables,
        orders,
        serviceRequests,
        employees,
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
        addEmployee,
        updateEmployee,
        resetEmployeePassword,
        uploadEmployeePhoto,
        setEmployeeOnlineStatus,
        deleteEmployee,
        refreshEmployees: loadEmployees,
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
        vacateTable,
        reserveTable,
        unreserveTable,
        createOrder,
        updateOrderStatus,
        updateOrderEta,
        cancelOrder,
        deleteOrder,
        createServiceRequest,
        acceptServiceRequest,
        inProgressServiceRequest,
        completeServiceRequest,
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
        refreshData,
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
