export type SystemType = 'محلات' | 'شركات' | 'صالات جيم' | 'برامج' | 'أخرى';

export type CategoryType = string;

export const SYSTEM_CATEGORIES_MAP: Record<SystemType, string[]> = {
  'محلات': ['سوبر ماركت', 'ملابس', 'صيدلية', 'مطعم', 'أخرى'],
  'شركات': ['عقارات', 'مقاولات', 'سياحة', 'استثمار', 'أدوية', 'أخرى'],
  'صالات جيم': ['صالة صغيرة', 'عادية', 'فوق المتوسط', 'كبيرة', 'أخرى'],
  'برامج': ['تطبيق إداري', 'تطبيق استثماري', 'برنامج إداري', 'برنامج استثماري', 'نظام شخصي', 'أخرى'],
  'أخرى': ['ورش', 'عيادات', 'مصانع', 'خدمات', 'أخرى'],
};

export const getCategoriesForSystem = (system: SystemType): string[] => {
  return SYSTEM_CATEGORIES_MAP[system] || ['عام', 'أخرى'];
};

export interface Client {
  id: string;
  name: string;
  shopName: string;
  phone: string;
  address: string;
  system: SystemType;
  category: CategoryType;
  createdAt: string;
}

export interface PackageFeature {
  name: string;
  enabled: boolean;
}

export interface Package {
  id: string;
  name: string;
  system: SystemType;
  category: CategoryType;
  features: PackageFeature[];
  price: number;
  discount: number;
  finalPrice: number;
}

export type OfferDurationUnit = 'أيام' | 'أشهر' | 'سنوات';

export interface Offer {
  id: string;
  name: string;
  system: SystemType;
  category: CategoryType;
  durationValue: number;
  durationUnit: OfferDurationUnit;
  features: PackageFeature[];
  price: number;
  discount: number;
  finalPrice: number;
  badgeText?: string;
  isActive?: boolean;
}

export interface DeviceItem {
  name: string;
  price: number;
  enabled: boolean;
}

export interface VisitItem {
  type: string;
  price: number;
  enabled: boolean;
}

export type ItemType = 'package' | 'offer';

export type SaleStatus = 'mowakad' | 'morsal_qabl_dafa';

export interface Sale {
  id: string;
  clientId?: string;
  clientName: string;
  shopName: string;
  phone: string;
  system: SystemType;
  category: CategoryType;
  date: string;
  deliveryDate: string;
  itemType?: ItemType; // 'package' or 'offer'
  packageId?: string;
  packageName?: string;
  packagePrice: number;
  offerId?: string;
  offerDuration?: string;
  devices: DeviceItem[];
  visits: VisitItem[];
  devicesTotal: number;
  visitsTotal: number;
  subtotal: number;
  discount: number;
  finalInvoice: number;
  paidAmount: number; // For debt calculation (finalInvoice - paidAmount)
  status: SaleStatus; // 'mowakad' (مؤكد) or 'morsal_qabl_dafa' (مرسل قبل الدفع)
  projectUrl?: string; // Optional project link
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  system?: SystemType;
  notes?: string;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  system: SystemType;
  category: CategoryType;
  url: string;
  description?: string;
  clientName?: string;
  createdAt?: string;
}

export type ScreenView =
  | 'home'
  | 'pos'
  | 'add-client'
  | 'clients'
  | 'packages'
  | 'sector'
  | 'sales'
  | 'expenses'
  | 'reports';
