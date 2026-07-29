export type VegType = 'veg' | 'non-veg' | 'egg';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTimeMinutes: number;
  vegType: VegType;
  available: boolean;
  isBestSeller?: boolean;
  isChefSpecial?: boolean;
  isTodaysSpecial?: boolean;
  imageUrl: string;
  spicyLevel?: number; // 0 to 3
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
  displayOrder: number;
}

export type TableSection = 'Indoor' | 'Outdoor' | 'VIP' | 'Rooftop';

export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  section: TableSection;
  isActive: boolean;
  isOccupied: boolean;
  mergedWithTableId?: string; // If merged with another table
}

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialNotes?: string;
  vegType: VegType;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #101
  restaurantId: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  appliedPromotionName?: string;
  totalAmount: number;
  createdAt: string; // ISO string
  acceptedAt?: string;
  etaMinutes?: number;
  estimatedCompletionTime?: string; // ISO string or time string
  completedAt?: string;
  kitchenNotes?: string;
}

export type ServiceRequestType = 'water' | 'spoon' | 'tissue' | 'bill' | 'waiter_call';

export interface ServiceRequest {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  type: ServiceRequestType;
  note?: string;
  status: 'pending' | 'acknowledged' | 'fulfilled';
  createdAt: string;
  fulfilledAt?: string;
}

export type DiscountType = 'percentage' | 'flat' | 'bogo' | 'free_item';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // e.g. 20 for 20% or $10 for flat $10
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  promoCode?: string;
  offerTag: 'Festival Offer' | 'Happy Hour' | 'Weekend Offer' | 'Student Discount' | 'BOGO' | 'Flash Sale' | 'Free Drink' | 'Free Dessert';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Feedback {
  id: string;
  tableId: string;
  tableName: string;
  rating: number; // 1 to 5
  customerName?: string;
  comment: string;
  createdAt: string;
  tags?: string[];
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  coverUrl: string;
  bannerUrl: string;
  faviconUrl: string;
  galleryUrls: string[];
  address: string;
  phone: string;
  currencySymbol: string;
  taxPercentage: number;
}

export interface BusinessDayRecord {
  id: string;
  date: string; // e.g. "15 July 2026"
  closedAt: string; // ISO timestamp
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  archivedOrders: Order[];
  topBestseller?: string;
  notes?: string;
}

export type UserRole = 'owner' | 'kitchen' | 'waiter' | 'customer';

export interface AuthUser {
  role: UserRole;
  username: string;
  token: string;
}
