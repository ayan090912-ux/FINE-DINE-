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
export type TableStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED';

export interface DiningSession {
  id: string;
  restaurantId: string;
  tableId: string;
  sessionCode: string;
  status: 'ACTIVE' | 'BILL_REQUESTED' | 'COMPLETED' | 'CANCELLED';
  guestCount: number;
  openedAt: string;
  closedAt?: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  section: TableSection;
  status: TableStatus;
  activeSessionId?: string;
  isActive: boolean;
  isOccupied: boolean;
  mergedWithTableId?: string;
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
  orderNumber: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  sessionId?: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  appliedPromotionName?: string;
  totalAmount: number;
  createdAt: string;
  acceptedAt?: string;
  etaMinutes?: number;
  estimatedCompletionTime?: string;
  completedAt?: string;
  kitchenNotes?: string;
}

export type ServiceRequestType = 'water' | 'spoon' | 'tissue' | 'bill' | 'waiter_call';
export type ServiceRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'archived';

export interface ServiceRequest {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  sessionId?: string;
  type: ServiceRequestType;
  note?: string;
  status: ServiceRequestStatus;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  acceptedAt?: string;
  inProgressAt?: string;
  completedAt?: string;
  createdAt: string;
  fulfilledAt?: string;
}

export type EmploymentStatus = 'ACTIVE' | 'DISABLED' | 'ON_LEAVE';
export type EmployeeShift = 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_TIME';
export type EmployeeOnlineStatus = 'ONLINE' | 'OFFLINE' | 'ON_BREAK' | 'BUSY';

export interface Employee {
  id: string;
  restaurantId: string;
  employeeId: string;
  fullName: string;
  photoUrl?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  joiningDate: string;
  role: 'WAITER' | 'KITCHEN' | 'MANAGER' | 'OWNER';
  position: string;
  username: string;
  employmentStatus: EmploymentStatus;
  shift: EmployeeShift;
  onlineStatus: EmployeeOnlineStatus;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  requiresPasswordChange: boolean;
  notes?: string;
  todayWorkingMinutes?: number;
  weeklyHours?: number;
  monthlyHours?: number;
  attendancePercentage?: number;
  currentSessionStart?: string;
  // Performance stats for Waiters
  ordersDelivered?: number;
  billsClosed?: number;
  waterRequests?: number;
  waiterCalls?: number;
  avgResponseTimeSeconds?: number;
  tablesServed?: number;
  // Performance stats for Kitchen
  ordersAccepted?: number;
  ordersCompleted?: number;
  avgPrepTimeMinutes?: number;
  delayedOrders?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WaiterPerformanceStats {
  waiterId: string;
  waiterName: string;
  requestsAccepted: number;
  requestsCompleted: number;
  avgResponseTimeSeconds: number;
  avgCompletionTimeSeconds: number;
  waterRequests: number;
  spoonRequests: number;
  tissueRequests: number;
  billRequests: number;
  waiterCalls: number;
}

export interface WaitersPerformanceResponse {
  totalPendingRequests: number;
  totalAcceptedRequests: number;
  totalCompletedRequests: number;
  overallAvgResponseTimeSeconds: number;
  waiters: WaiterPerformanceStats[];
}

export type DiscountType = 'percentage' | 'flat' | 'bogo' | 'free_item';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
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
  rating: number;
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
  date: string;
  closedAt: string;
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
  id?: string;
  fullName?: string;
  employeeId?: string;
  position?: string;
  photoUrl?: string;
}
