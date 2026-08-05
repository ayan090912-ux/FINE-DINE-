import { Category, MenuItem, Order, OrderStatus, ServiceRequest, ServiceRequestType, ServiceRequestStatus, Table, TableSection, TableStatus, Employee } from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || 'Request failed';
    throw new Error(detail);
  }

  return payload?.data ?? payload;
}

const mapBackendStatus = (status?: string): OrderStatus => {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'PENDING':
      return 'received';
    case 'CONFIRMED':
      return 'accepted';
    case 'PREPARING':
      return 'preparing';
    case 'READY':
      return 'ready';
    case 'SERVED':
      return 'delivered';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'received';
  }
};

const mapBackendRequestStatus = (status?: string): ServiceRequestStatus => {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'ACCEPTED':
    case 'ACKNOWLEDGED':
      return 'accepted';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'COMPLETED':
    case 'RESOLVED':
    case 'FULFILLED':
      return 'completed';
    case 'ARCHIVED':
    case 'CANCELLED':
      return 'archived';
    default:
      return 'pending';
  }
};

const mapBackendRequestType = (type?: string): ServiceRequestType => {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'WATER':
      return 'water';
    case 'SPOON':
      return 'spoon';
    case 'TISSUE':
      return 'tissue';
    case 'BILL':
      return 'bill';
    case 'WAITER':
      return 'waiter_call';
    default:
      return 'waiter_call';
  }
};

export const normalizeOrder = (raw: any): Order => {
  const createdAt = raw.created_at || raw.createdAt || new Date().toISOString();
  const etaMinutes = raw.estimated_time_minutes || raw.etaMinutes;
  const estimatedCompletionTime = etaMinutes ? new Date(new Date(createdAt).getTime() + etaMinutes * 60000).toISOString() : undefined;

  return {
    id: raw.id,
    orderNumber: raw.order_number || raw.orderNumber || `#${raw.id}`,
    restaurantId: raw.restaurant_id || raw.restaurantId || 'dineflow',
    tableId: raw.table_id || raw.tableId || '',
    tableName: raw.table_name || raw.tableName || `Table ${raw.table_id || raw.tableId || 'Unknown'}`,
    items: (raw.items || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menu_item_id || item.menuItemId,
      name: item.item_name || item.name || 'Item',
      price: Number(item.unit_price || item.price || 0),
      quantity: Number(item.quantity || 1),
      specialNotes: item.notes || item.specialNotes,
      vegType: 'veg',
    })),
    status: mapBackendStatus(raw.status),
    subtotal: Number(raw.subtotal || 0),
    discountAmount: Number(raw.discount_amount || raw.discountAmount || 0),
    appliedPromotionName: raw.applied_promotion_name || raw.appliedPromotionName || (raw.special_notes?.startsWith('Promo: ') ? raw.special_notes.replace('Promo: ', '') : undefined),
    totalAmount: Number(raw.total_amount || raw.totalAmount || 0),
    createdAt,
    acceptedAt: raw.accepted_at || raw.acceptedAt,
    etaMinutes: etaMinutes ? Number(etaMinutes) : undefined,
    estimatedCompletionTime,
    completedAt: raw.completed_at || raw.completedAt,
  };
};

export const normalizeServiceRequest = (raw: any): ServiceRequest => ({
  id: raw.id,
  restaurantId: raw.restaurant_id || raw.restaurantId || 'dineflow',
  tableId: raw.table_id || raw.tableId || '',
  tableName: raw.table_name || raw.tableName || `Table ${raw.table_id || raw.tableId || 'Unknown'}`,
  sessionId: raw.session_id || raw.sessionId,
  type: mapBackendRequestType(raw.request_type || raw.type),
  note: raw.notes || raw.note,
  status: mapBackendRequestStatus(raw.status),
  assignedWaiterId: raw.assigned_waiter_id || raw.assignedWaiterId,
  assignedWaiterName: raw.assigned_waiter_name || raw.assignedWaiterName,
  acceptedAt: raw.accepted_at || raw.acceptedAt,
  inProgressAt: raw.in_progress_at || raw.inProgressAt,
  completedAt: raw.completed_at || raw.completedAt,
  createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  fulfilledAt: raw.completed_at || raw.completedAt || raw.fulfilled_at || raw.fulfilledAt,
});

export const normalizeCategory = (raw: any): Category => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  iconName: raw.icon_name || raw.iconName,
  displayOrder: Number(raw.display_order || raw.displayOrder || 0),
});

export const normalizeMenuItem = (raw: any): MenuItem => ({
  id: raw.id,
  name: raw.name,
  description: raw.description || '',
  price: Number(raw.price || 0),
  category: raw.category_id || raw.category || '',
  prepTimeMinutes: Number(raw.preparation_time_minutes || raw.prepTimeMinutes || 15),
  vegType: raw.is_veg ? 'veg' : 'non-veg',
  available: raw.is_available ?? raw.available ?? true,
  imageUrl: raw.image_url || raw.imageUrl || '',
  spicyLevel: raw.is_spicy ? 2 : 0,
});

export const normalizeTable = (raw: any): Table => ({
  id: raw.id,
  tableNumber: raw.table_number || raw.tableNumber || raw.id,
  name: raw.name || `Table ${raw.table_number || raw.id}`,
  capacity: Number(raw.capacity || 4),
  section: (raw.section as TableSection) || 'Indoor',
  status: (raw.status as TableStatus) || (raw.is_occupied || raw.isOccupied ? 'OCCUPIED' : 'VACANT'),
  activeSessionId: raw.active_session_id || raw.activeSessionId,
  isOccupied: Boolean(raw.is_occupied ?? raw.isOccupied ?? (raw.status === 'OCCUPIED')),
  isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
});

// Menu APIs
export const fetchPublicMenu = async (restaurantId: string = 'dineflow') => {
  const payload = await apiRequest<any>(`/api/v1/public/menu/${restaurantId}`);
  const categories = (payload?.data?.categories || payload?.categories || []).map(normalizeCategory);
  const menuItems = (payload?.data?.categories || payload?.categories || []).flatMap((category: any) => (category.items || []).map(normalizeMenuItem));
  return { categories, menuItems };
};

export const createCategoryViaApi = async (restaurantId: string, category: Omit<Category, 'id'>) => {
  const result = await apiRequest<any>(`/api/v1/menu/categories?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: category.name,
      description: category.description,
      display_order: category.displayOrder || 0,
    }),
  });
  return normalizeCategory(result);
};

export const updateCategoryViaApi = async (categoryId: string, updates: Partial<Category>) => {
  const result = await apiRequest<any>(`/api/v1/menu/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: updates.name,
      description: updates.description,
      display_order: updates.displayOrder,
    }),
  });
  return normalizeCategory(result);
};

export const deleteCategoryViaApi = async (categoryId: string) => {
  return await apiRequest<boolean>(`/api/v1/menu/categories/${categoryId}`, {
    method: 'DELETE',
  });
};

export const createMenuItemViaApi = async (restaurantId: string, item: Omit<MenuItem, 'id'>) => {
  const result = await apiRequest<any>(`/api/v1/menu/items?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      category_id: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.imageUrl,
      is_available: item.available ?? true,
      preparation_time_minutes: item.prepTimeMinutes || 15,
      is_veg: item.vegType === 'veg',
      is_spicy: (item.spicyLevel || 0) > 0,
    }),
  });
  return normalizeMenuItem(result);
};

export const updateMenuItemViaApi = async (itemId: string, updates: Partial<MenuItem>) => {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.category !== undefined) payload.category_id = updates.category;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.available !== undefined) payload.is_available = updates.available;
  if (updates.prepTimeMinutes !== undefined) payload.preparation_time_minutes = updates.prepTimeMinutes;
  if (updates.vegType !== undefined) payload.is_veg = updates.vegType === 'veg';
  if (updates.spicyLevel !== undefined) payload.is_spicy = updates.spicyLevel > 0;

  const result = await apiRequest<any>(`/api/v1/menu/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeMenuItem(result);
};

export const deleteMenuItemViaApi = async (itemId: string) => {
  return await apiRequest<boolean>(`/api/v1/menu/items/${itemId}`, {
    method: 'DELETE',
  });
};

// Order APIs
export const fetchRestaurantOrders = async (restaurantId: string = 'dineflow') => {
  const payload = await apiRequest<any>(`/api/v1/orders?restaurant_id=${encodeURIComponent(restaurantId)}`);
  const data = payload?.data ?? payload;
  return (data || []).map(normalizeOrder);
};

export const createOrderViaApi = async (
  restaurantId: string = 'dineflow',
  tableId: string,
  items: Array<{ menuItemId: string; quantity: number; specialNotes?: string }>,
  promoName?: string,
  discountAmount = 0
) => {
  const payload = {
    restaurant_id: restaurantId,
    table_id: tableId,
    order_type: 'DINE_IN',
    customer_name: 'Guest Customer',
    customer_phone: null,
    special_notes: promoName ? `Promo: ${promoName}` : undefined,
    items: items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      notes: item.specialNotes || undefined,
    })),
  };

  const result = await apiRequest<any>('/api/v1/public/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeOrder(result);
};

export const updateOrderStatusViaApi = async (orderId: string, status: OrderStatus, etaMinutes?: number) => {
  const backendStatus = {
    received: 'PENDING',
    accepted: 'CONFIRMED',
    preparing: 'PREPARING',
    ready: 'READY',
    delivered: 'SERVED',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
  }[status] || 'PENDING';

  const bodyPayload: any = { status: backendStatus };
  if (etaMinutes !== undefined) {
    bodyPayload.estimated_time_minutes = etaMinutes;
  }

  const result = await apiRequest<any>(`/api/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(bodyPayload),
  });

  return normalizeOrder(result);
};

// Service Request APIs
export const fetchRestaurantRequests = async (restaurantId: string = 'dineflow') => {
  const payload = await apiRequest<any>(`/api/v1/requests?restaurant_id=${encodeURIComponent(restaurantId)}`);
  const data = payload?.data ?? payload;
  return (data || []).map(normalizeServiceRequest);
};

export const createServiceRequestViaApi = async (restaurantId: string = 'dineflow', tableId: string, type: ServiceRequestType, note?: string) => {
  const payload = {
    restaurant_id: restaurantId,
    table_id: tableId,
    request_type: {
      water: 'WATER',
      spoon: 'SPOON',
      tissue: 'TISSUE',
      bill: 'BILL',
      waiter_call: 'WAITER',
    }[type] || 'WAITER',
    notes: note,
  };

  const result = await apiRequest<any>('/api/v1/public/request-service', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return normalizeServiceRequest(result);
};

export const updateServiceRequestStatusViaApi = async (requestId: string) => {
  const result = await apiRequest<any>(`/api/v1/requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'RESOLVED' }),
  });

  return normalizeServiceRequest(result);
};

// Table APIs
export const fetchRestaurantTables = async (restaurantId: string = 'dineflow') => {
  const payload = await apiRequest<any>(`/api/v1/tables?restaurant_id=${encodeURIComponent(restaurantId)}`);
  const data = payload?.data ?? payload;
  return (data || []).map(normalizeTable);
};

export const createTableViaApi = async (restaurantId: string = 'dineflow', table: Omit<Table, 'id' | 'isOccupied'>) => {
  const result = await apiRequest<any>(`/api/v1/tables?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
    body: JSON.stringify({
      table_number: table.tableNumber,
      name: table.name,
      capacity: table.capacity,
      section: table.section,
    }),
  });
  return normalizeTable(result);
};

export const updateTableViaApi = async (tableId: string, updates: Partial<Table>) => {
  const payload: any = {};
  if (updates.tableNumber !== undefined) payload.table_number = updates.tableNumber;
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.capacity !== undefined) payload.capacity = updates.capacity;
  if (updates.section !== undefined) payload.section = updates.section;
  if (updates.isOccupied !== undefined) payload.is_occupied = updates.isOccupied;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const result = await apiRequest<any>(`/api/v1/tables/${tableId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return normalizeTable(result);
};

export const deleteTableViaApi = async (tableId: string) => {
  return await apiRequest<boolean>(`/api/v1/tables/${tableId}`, {
    method: 'DELETE',
  });
};

export const closeTableSessionViaApi = async (tableId: string, restaurantId: string = 'dineflow') => {
  return await apiRequest<boolean>(`/api/v1/tables/${tableId}/close-session?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
  });
};

export const reserveTableViaApi = async (tableId: string, restaurantId: string = 'dineflow') => {
  const result = await apiRequest<any>(`/api/v1/tables/${tableId}/reserve?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
  });
  return normalizeTable(result);
};

export const unreserveTableViaApi = async (tableId: string, restaurantId: string = 'dineflow') => {
  const result = await apiRequest<any>(`/api/v1/tables/${tableId}/unreserve?restaurant_id=${encodeURIComponent(restaurantId)}`, {
    method: 'POST',
  });
  return normalizeTable(result);
};

export const acceptServiceRequestViaApi = async (requestId: string, waiterName: string, waiterId?: string) => {
  const result = await apiRequest<any>(`/api/v1/requests/${requestId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ waiter_id: waiterId, waiter_name: waiterName }),
  });
  return normalizeServiceRequest(result);
};

export const inProgressServiceRequestViaApi = async (requestId: string, waiterId?: string) => {
  const result = await apiRequest<any>(`/api/v1/requests/${requestId}/in-progress${waiterId ? `?waiter_id=${encodeURIComponent(waiterId)}` : ''}`, {
    method: 'POST',
  });
  return normalizeServiceRequest(result);
};

export const completeServiceRequestViaApi = async (requestId: string, waiterId?: string) => {
  const result = await apiRequest<any>(`/api/v1/requests/${requestId}/complete${waiterId ? `?waiter_id=${encodeURIComponent(waiterId)}` : ''}`, {
    method: 'POST',
  });
  return normalizeServiceRequest(result);
};

export const fetchWaiterPerformanceViaApi = async (restaurantId: string = 'dineflow') => {
  const payload = await apiRequest<any>(`/api/v1/requests/performance?restaurant_id=${encodeURIComponent(restaurantId)}`);
  return payload?.data ?? payload;
};

// Employee Management System APIs
export const normalizeEmployee = (raw: any): Employee => {
  const perf = raw.performance || {};
  return {
    id: raw.id,
    restaurantId: raw.restaurant_id,
    employeeId: raw.employee_id,
    fullName: raw.full_name,
    photoUrl: raw.photo_url,
    phoneNumber: raw.phone_number,
    email: raw.email,
    address: raw.address,
    dateOfBirth: raw.date_of_birth,
    joiningDate: raw.joining_date,
    role: raw.role,
    position: raw.position,
    username: raw.username,
    employmentStatus: raw.employment_status,
    shift: raw.shift,
    onlineStatus: raw.online_status,
    lastLoginAt: raw.last_login_at,
    lastLogoutAt: raw.last_logout_at,
    requiresPasswordChange: raw.requires_password_change ?? false,
    notes: raw.notes,
    currentSessionStart: raw.current_session_start,
    todayWorkingMinutes: raw.today_working_minutes,
    weeklyHours: raw.weekly_hours,
    monthlyHours: raw.monthly_hours,
    attendancePercentage: raw.attendance_percentage,
    ordersDelivered: perf.orders_delivered ?? raw.orders_delivered,
    billsClosed: perf.bills_closed ?? raw.bills_closed,
    waterRequests: perf.water_requests ?? raw.water_requests,
    waiterCalls: perf.waiter_calls ?? raw.waiter_calls,
    avgResponseTimeSeconds: perf.avg_response_time_seconds ?? raw.avg_response_time_seconds,
    tablesServed: perf.tables_served ?? raw.tables_served,
    ordersAccepted: perf.orders_accepted ?? raw.orders_accepted,
    ordersCompleted: perf.orders_completed ?? raw.orders_completed,
    avgPrepTimeMinutes: perf.avg_prep_time_minutes ?? raw.avg_prep_time_minutes,
    delayedOrders: perf.delayed_orders ?? raw.delayed_orders,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

export const fetchEmployeesViaApi = async (restaurantId: string = 'dineflow'): Promise<Employee[]> => {
  const list = await apiRequest<any[]>(`/api/v1/employees?restaurant_id=${encodeURIComponent(restaurantId)}`);
  return (list || []).map(normalizeEmployee);
};

export const createEmployeeViaApi = async (data: any): Promise<Employee> => {
  const res = await apiRequest<any>('/api/v1/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return normalizeEmployee(res);
};

export const updateEmployeeViaApi = async (employeeId: string, updates: any): Promise<Employee> => {
  const res = await apiRequest<any>(`/api/v1/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return normalizeEmployee(res);
};

export const resetEmployeePasswordViaApi = async (employeeId: string, newPassword: string): Promise<Employee> => {
  const res = await apiRequest<any>(`/api/v1/employees/${employeeId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  });
  return normalizeEmployee(res);
};

export const setEmployeeOnlineStatusViaApi = async (employeeId: string, onlineStatus: string): Promise<Employee> => {
  const res = await apiRequest<any>(`/api/v1/employees/${employeeId}/status`, {
    method: 'POST',
    body: JSON.stringify({ online_status: onlineStatus }),
  });
  return normalizeEmployee(res);
};

export const uploadEmployeePhotoViaApi = async (employeeId: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/v1/employees/${employeeId}/photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Photo upload failed');
  const data = await res.json();
  return data.photo_url;
};

export const authenticateEmployeeViaApi = async (data: { username: string; password: string; role?: string }): Promise<Employee> => {
  const res = await apiRequest<any>('/api/v1/employees/auth', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return normalizeEmployee(res);
};

export const logoutEmployeeViaApi = async (employeeId: string): Promise<Employee> => {
  const res = await apiRequest<any>(`/api/v1/employees/${employeeId}/logout`, {
    method: 'POST',
  });
  return normalizeEmployee(res);
};

export const deleteEmployeeViaApi = async (employeeId: string): Promise<boolean> => {
  await apiRequest<any>(`/api/v1/employees/${employeeId}`, {
    method: 'DELETE',
  });
  return true;
};

