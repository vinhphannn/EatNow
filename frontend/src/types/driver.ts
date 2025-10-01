// Driver-facing types for EatNow

export type DriverStatus = 'inactive' | 'active' | 'suspended' | 'offline';

export interface DriverProfile {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  status: DriverStatus;
  vehicle?: {
    type?: 'motorbike' | 'bicycle' | 'car' | 'other';
    brand?: string;
    model?: string;
    plateNumber?: string;
    color?: string;
    year?: number;
  };
  kyc?: {
    isVerified: boolean;
    idNumber?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    driverLicenseNumber?: string;
    driverLicenseUrl?: string;
    verifiedAt?: string;
  };
  ratings?: {
    average: number;
    count: number;
    fiveStar?: number;
    fourStar?: number;
    threeStar?: number;
    twoStar?: number;
    oneStar?: number;
  };
  performance?: {
    ordersCompleted: number;
    ordersRejected: number;
    onTimeRate?: number; // percentage 0-100
    cancellationRate?: number; // percentage 0-100
  };
  location?: {
    longitude: number;
    latitude: number;
    lastLocationAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverDashboardStats {
  todayOrders: number;
  todayEarnings: number;
  completedOrders: number;
  rating: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  onTimeRate?: number;
  completionRate?: number;
}

export type DriverOrderStatus =
  | 'waiting'
  | 'assigned'
  | 'accepted'
  | 'picking'
  | 'delivering'
  | 'completed'
  | 'rejected';

export interface DriverOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface DriverOrderSummary {
  id: string;
  code: string;
  status: DriverOrderStatus;
  restaurant: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    location?: { latitude: number; longitude: number };
  };
  customer: {
    id?: string;
    name: string;
    phone?: string;
    address?: string;
    location?: { latitude: number; longitude: number };
  };
  items?: DriverOrderItem[];
  totals?: {
    subtotal: number;
    deliveryFee: number;
    discount?: number;
    tax?: number;
    total: number;
    cod?: number; // cash on delivery amount
  };
  createdAt: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
}

export interface DriverEarningsSummary {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
  availableBalance: number;
  pendingPayout: number;
}

export interface EarningEntry {
  id: string;
  date: string;
  orderCode: string;
  amount: number;
  type: 'delivery_fee' | 'bonus' | 'adjustment';
  note?: string;
}

export interface PayoutRequest {
  amount: number;
  method: 'bank_transfer' | 'e_wallet';
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
}

export interface UpdateDriverLocationRequest {
  lat: number;
  lng: number;
}

export interface UpdateDriverOrderStatusRequest {
  status: DriverOrderStatus;
  note?: string;
}


