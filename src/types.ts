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

export interface EmployeeCommissionItem {
  employeeId: string;
  employeeName: string;
  position?: string;
  commissionPercent: number; // e.g., 10 for 10%
  commissionAmount: number; // e.g., (finalInvoice * commissionPercent) / 100
}

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
  nextVisitDate?: string; // Optional next visit reminder date
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  employeeCommissionRate?: number;
  employeeCommissions?: EmployeeCommissionItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName?: string;
  saleId?: string;
  amount: number;
  date: string;
  note?: string;
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

export type TeamMemberPosition = 'owner' | 'engineer' | 'media_buyer' | 'sales' | 'developer' | 'custom';

export const POSITION_LABELS: Record<TeamMemberPosition, string> = {
  owner: 'صاحب المشروع ومطور (مدير عام)',
  engineer: 'مهندس برمجيات',
  media_buyer: 'ميديا مان / تسويق وإعلانات',
  sales: 'مسؤول مبيعات (سيلز)',
  developer: 'مطور تطبيقات ونظم',
  custom: 'وظيفة مخصصة',
};

export interface Lead {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  system: SystemType;
  category: CategoryType;
  assignedEmployeeIds: string[];
  status: 'محتمل' | 'مؤكد';
  createdAt: string;
}

export interface TeamMemberPermissions {
  canManageProjects: boolean;
  canManageSales: boolean;
  canManagePackages: boolean;
  canViewExpenses: boolean;
  canManageTeam: boolean;
  canViewReports: boolean;
  canManageClients?: boolean;
  canConfirmLeads?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappPhone?: string;
  username?: string;
  password?: string;
  authUid?: string; // Firebase Authentication UID once migrated to real per-employee login
  position: TeamMemberPosition;
  customPositionTitle?: string;
  defaultCommissionRate: number; // Percentage % (default 10)
  defaultCommissionPercent?: number; // Alias for defaultCommissionRate
  permissions: TeamMemberPermissions;
  allowedScreens?: ScreenView[];
  assignedClientIds?: string[];
  pinCode?: string;
  pinSalt?: string;
  passwordSalt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  lastFailedAttempt?: string;
  isActive: boolean;
  createdAt?: string;
  // App-reopen lock: a short PIN required every time the app is opened on
  // this device, separate from the login password. Optional per member.
  appLockEnabled?: boolean;
  appLockPinHash?: string;
  appLockPinSalt?: string;
  // Known device fingerprints this member has successfully logged in from
  // before, used to detect and alert the owner about logins from new devices.
  knownDeviceIds?: string[];
}

export interface LoginAlert {
  id: string;
  memberId: string;
  memberName: string;
  deviceLabel: string;
  createdAt: string;
}

export type PricingModel = 'full_sale' | 'monthly_subscription' | 'yearly_subscription';

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  full_sale: 'بيع كامل (دفعة الشراء المباشر)',
  monthly_subscription: 'اشتراك شهري',
  yearly_subscription: 'اشتراك سنوي',
};

export type PaymentStatus = 'unpaid' | 'partial' | 'full';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  partial: 'دفع جزئي (مقدم/عربون)',
  full: 'دفع كامل',
};

export type ProjectWorkStatus = 'under_construction' | 'completed' | 'paused';

export const WORK_STATUS_LABELS: Record<ProjectWorkStatus, string> = {
  under_construction: 'تحت الإنشاء وجاري العمل',
  completed: 'مكتمل وتم التسليم',
  paused: 'متوقف مؤقتاً',
};

export interface ProjectItem {
  id: string;
  title: string;
  system: SystemType;
  category: CategoryType;
  url: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  hasRegisteredEmail?: boolean;
  isDemo?: boolean;
  // Payment and Milestone details
  pricingModel?: PricingModel;
  totalPrice?: number;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
  projectStatus?: ProjectWorkStatus;
  // Team assignment and commission rates
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  engineerCommissionRate?: number;
  assignedMediaBuyerId?: string;
  assignedMediaBuyerName?: string;
  mediaBuyerCommissionRate?: number;
  ownerCommissionRate?: number;
  ownerIsEngineer?: boolean;
  createdAt?: string;
}

export type ScreenView =
  | 'home'
  | 'pos'
  | 'add-client'
  | 'clients'
  | 'leads'
  | 'packages'
  | 'sector'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'team';

export const ALL_SCREENS_CONFIG: { id: ScreenView; label: string; iconName: string }[] = [
  { id: 'home', label: 'الرئيسية والمشاريع', iconName: 'Home' },
  { id: 'pos', label: 'نقطة البيع (الكاشير)', iconName: 'Monitor' },
  { id: 'sales', label: 'المبيعات والمعاينات', iconName: 'Receipt' },
  { id: 'clients', label: 'العملاء والديون', iconName: 'Users' },
  { id: 'leads', label: 'العملاء المحتملون (Leads)', iconName: 'Target' },
  { id: 'packages', label: 'الباقات والعروض', iconName: 'Settings' },
  { id: 'sector', label: 'القطاعات والأنشطة', iconName: 'LayoutGrid' },
  { id: 'expenses', label: 'المصروفات والخزينة', iconName: 'ShoppingBag' },
  { id: 'reports', label: 'التقارير المالي والأرباح', iconName: 'BarChart3' },
  { id: 'team', label: 'إدارة الفريق والصلاحيات', iconName: 'UserCheck' },
  { id: 'add-client', label: 'إضافة عميل جديد', iconName: 'UserPlus' },
];
