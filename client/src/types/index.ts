export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  type: 'VAN' | 'CAR';
  basePriceDay: number;
  quantity: number;
  colorOptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteInput {
  vehicleId: string;
  startDate: string;
  endDate: string;
  packageType: 'STANDARD_24H' | 'VAN_4H' | 'VAN_10H' | 'WEEKLY' | 'MONTHLY';
  kmPlan: 'KM_100' | 'KM_200' | 'UNLIMITED';
  coverage: 'BASE' | 'PARTIAL';
  extraDriver: boolean;
  extraDriverUnder25: boolean;
  homeDelivery: boolean;
  homePickup: boolean;
}

export interface QuoteResult {
  total: number;
  breakdown: {
    baseWithDiscount: number;
    km: number;
    extra: number;
    delivery: number;
  };
  discountEuroShown: number;
  discountPctShown: number;
  daysCount: number;
}

export interface BookingData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  packageType: 'STANDARD_24H' | 'VAN_4H' | 'VAN_10H' | 'WEEKLY' | 'MONTHLY';
  kmPlan: 'KM_100' | 'KM_200' | 'UNLIMITED';
  coverage: 'BASE' | 'PARTIAL';
  extraDriver: boolean;
  extraDriverUnder25: boolean;
  homeDelivery: boolean;
  homePickup: boolean;
  customerFirstName: string;
  customerLastName: string;
  customerBirthDate: string;
  customerPhone: string;
  customerEmail: string;
  driverLicenseNo: string;
  addFirstName?: string;
  addLastName?: string;
  addBirthDate?: string;
  addDriverLicenseNo?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  packageType: string;
  kmPlan: string;
  coverage: string;
  extraDriver: boolean;
  extraDriverUnder25: boolean;
  homeDelivery: boolean;
  homePickup: boolean;
  totalPrice: number;
  discountEuroShown: number;
  discountPctShown: number;
  customerFirstName: string;
  customerLastName: string;
  customerBirthDate: string;
  customerPhone: string;
  customerEmail: string;
  driverLicenseNo: string;
  addFirstName?: string;
  addLastName?: string;
  addBirthDate?: string;
  addDriverLicenseNo?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  vehicle: Vehicle;
}

export interface Employee {
  id: string;
  username: string;
  role: 'STAFF' | 'ADMIN';
}

export interface Availability {
  availableQuantity: number;
  blackoutDates: string[];
}
