import { Category, MenuItem, Order, OrderStatus, ServiceRequest, ServiceRequestType } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://the-fine-flow.onrender.com').replace(/\/$/, '');

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

const mapBackendRequestStatus = (status?: string): ServiceRequest['status'] => {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'ACKNOWLEDGED':
      return 'acknowledged';
    case 'RESOLVED':
      return 'fulfilled';
    case 'CANCELLED':
      return 'fulfilled';
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
    orderNumber: raw.order_number || `#${raw.id}`,
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
    appliedPromotionName: raw.applied_promotion_name || raw.appliedPromotionName,
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
  type: mapBackendRequestType(raw.request_type || raw.type),
  note: raw.notes || raw.note,
  status: mapBackendRequestStatus(raw.status),
  createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  fulfilledAt: raw.fulfilled_at || raw.fulfilledAt,
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

export const fetchPublicMenu = async (restaurantId: string) => {
  const payload = await apiRequest<any>(`/api/v1/public/menu/${restaurantId}`);
  const categories = (payload?.data?.categories || payload?.categories || []).map(normalizeCategory);
  const menuItems = (payload?.data?.categories || payload?.categories || []).flatMap((category: any) => (category.items || []).map(normalizeMenuItem));
  return { categories, menuItems };
};

export const fetchRestaurantOrders = async (restaurantId: string) => {
  const payload = await apiRequest<any>(`/api/v1/orders?restaurant_id=${encodeURIComponent(restaurantId)}`);
  const data = payload?.data ?? payload;
  return (data || []).map(normalizeOrder);
};

export const createOrderViaApi = async (restaurantId: string, tableId: string, items: Array<{ menuItemId: string; quantity: number; specialNotes?: string }>, promoName?: string, discountAmount = 0) => {
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

export const updateOrderStatusViaApi = async (orderId: string, status: OrderStatus) => {
  const backendStatus = {
    received: 'PENDING',
    accepted: 'CONFIRMED',
    preparing: 'PREPARING',
    ready: 'READY',
    delivered: 'SERVED',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
  }[status] || 'PENDING';

  const result = await apiRequest<any>(`/api/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: backendStatus }),
  });

  return normalizeOrder(result);
};

export const fetchRestaurantRequests = async (restaurantId: string) => {
  const payload = await apiRequest<any>(`/api/v1/requests?restaurant_id=${encodeURIComponent(restaurantId)}`);
  const data = payload?.data ?? payload;
  return (data || []).map(normalizeServiceRequest);
};

export const createServiceRequestViaApi = async (restaurantId: string, tableId: string, type: ServiceRequestType, note?: string) => {
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
