import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { Client, Package, Offer, Sale, Expense, Payment, ProjectItem, TeamMember, SystemType, CategoryType, Lead } from '../types';
import { hashText } from './authCrypto';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Enable Firestore offline data persistence across tabs
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence not supported in this browser');
    }
  });
}

// Seed Data helper
export async function seedInitialDataIfEmpty() {
  try {
    const pkgsSnap = await getDocs(collection(db, 'packages'));
    if (pkgsSnap.empty) {
      const defaultPackages: Omit<Package, 'id'>[] = [
        {
          name: 'الباقة الأساسية',
          system: 'محلات',
          category: 'سوبر ماركت',
          features: [
            { name: 'نقطة البيع', enabled: true },
            { name: 'المشتريات', enabled: true },
            { name: 'المخزن وأصناف', enabled: true },
            { name: 'داشبورد', enabled: true },
            { name: 'العملاء', enabled: false },
            { name: 'الموردين', enabled: false },
            { name: 'صلاحيات', enabled: false },
            { name: 'كشف حساب', enabled: false },
            { name: 'الموظفين', enabled: false },
          ],
          price: 2500,
          discount: 0,
          finalPrice: 2500,
        },
        {
          name: 'الباقة الاحترافية',
          system: 'محلات',
          category: 'ملابس',
          features: [
            { name: 'نقطة البيع', enabled: true },
            { name: 'المشتريات', enabled: true },
            { name: 'المخزن وأصناف', enabled: true },
            { name: 'داشبورد', enabled: true },
            { name: 'العملاء', enabled: true },
            { name: 'الموردين', enabled: true },
            { name: 'صلاحيات', enabled: true },
            { name: 'كشف حساب', enabled: false },
            { name: 'الموظفين', enabled: false },
          ],
          price: 4500,
          discount: 500,
          finalPrice: 4000,
        },
        {
          name: 'الباقة المتكاملة V.I.P',
          system: 'شركات',
          category: 'أخرى',
          features: [
            { name: 'نقطة البيع', enabled: true },
            { name: 'المشتريات', enabled: true },
            { name: 'المخزن وأصناف', enabled: true },
            { name: 'داشبورد', enabled: true },
            { name: 'العملاء', enabled: true },
            { name: 'الموردين', enabled: true },
            { name: 'صلاحيات', enabled: true },
            { name: 'كشف حساب', enabled: true },
            { name: 'الموظفين', enabled: true },
          ],
          price: 8000,
          discount: 1000,
          finalPrice: 7000,
        }
      ];

      for (const pkg of defaultPackages) {
        await addDoc(collection(db, 'packages'), pkg);
      }
    }

    const offersSnap = await getDocs(collection(db, 'offers'));
    if (offersSnap.empty) {
      const defaultOffers: Omit<Offer, 'id'>[] = [
        {
          name: 'عرض انطلاقة السوبر ماركت (3 أشهر)',
          system: 'محلات',
          category: 'سوبر ماركت',
          durationValue: 3,
          durationUnit: 'أشهر',
          features: [
            { name: 'نقطة البيع', enabled: true },
            { name: 'المشتريات', enabled: true },
            { name: 'المخزن وأصناف', enabled: true },
            { name: 'دعم فني مجاني', enabled: true },
          ],
          price: 3500,
          discount: 1000,
          finalPrice: 2500,
          badgeText: 'عرض محدود 3 أشهر',
          isActive: true,
        },
        {
          name: 'عرض الصيدليات والشركات السنوي (1 سنة)',
          system: 'شركات',
          category: 'صيدلية',
          durationValue: 1,
          durationUnit: 'سنوات',
          features: [
            { name: 'نقطة البيع والتصنيع', enabled: true },
            { name: 'المخزن المتعدد', enabled: true },
            { name: 'العملاء والموردين', enabled: true },
            { name: 'كشف حساب وبند أرباح', enabled: true },
            { name: 'تطبيق موبايل للمتابعة', enabled: true },
          ],
          price: 9000,
          discount: 2000,
          finalPrice: 7000,
          badgeText: 'خصم سنوي خاص',
          isActive: true,
        },
      ];

      for (const off of defaultOffers) {
        await addDoc(collection(db, 'offers'), off);
      }
    }

    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty) {
      const defaultClients: Omit<Client, 'id'>[] = [
        {
          name: 'محمود أحمد',
          shopName: 'سوبر ماركت البركة',
          phone: '01012345678',
          address: 'القاهرة - مدينة نصر',
          system: 'محلات',
          category: 'سوبر ماركت',
          createdAt: new Date().toISOString(),
        },
        {
          name: 'سامح حسن',
          shopName: 'بوتيك شيك ملابس',
          phone: '01298765432',
          address: 'الجيزة - الدقي',
          system: 'محلات',
          category: 'ملابس',
          createdAt: new Date().toISOString(),
        },
        {
          name: 'د. خالد مصطفى',
          shopName: 'صيدلية الحياة',
          phone: '01155443322',
          address: 'الإسكندرية - سموحة',
          system: 'محلات',
          category: 'صيدلية',
          createdAt: new Date().toISOString(),
        }
      ];

      for (const c of defaultClients) {
        await addDoc(collection(db, 'clients'), c);
      }
    }

    const salesSnap = await getDocs(collection(db, 'sales'));
    if (salesSnap.empty) {
      const defaultSales: Omit<Sale, 'id'>[] = [
        {
          clientName: 'محمود أحمد',
          shopName: 'سوبر ماركت البركة',
          phone: '01012345678',
          system: 'محلات',
          category: 'سوبر ماركت',
          date: new Date().toISOString().split('T')[0],
          deliveryDate: new Date().toISOString().split('T')[0],
          packageName: 'الباقة الأساسية',
          packagePrice: 2500,
          devices: [
            { name: 'جهاز كاشير لمس', price: 8500, enabled: true },
            { name: 'طابعة فواتير حرارية', price: 1800, enabled: true },
            { name: 'درج نقدية', price: 950, enabled: true },
          ],
          visits: [
            { type: 'تركيب وتدريب', price: 500, enabled: true },
          ],
          devicesTotal: 11250,
          visitsTotal: 500,
          subtotal: 14250,
          discount: 250,
          finalInvoice: 14000,
          paidAmount: 14000,
          status: 'mowakad',
          createdAt: new Date().toISOString(),
        },
        {
          clientName: 'سامح حسن',
          shopName: 'بوتيك شيك ملابس',
          phone: '01298765432',
          system: 'محلات',
          category: 'ملابس',
          date: new Date().toISOString().split('T')[0],
          deliveryDate: new Date().toISOString().split('T')[0],
          packageName: 'الباقة الاحترافية',
          packagePrice: 4000,
          devices: [
            { name: 'قارئ باركود', price: 1200, enabled: true },
            { name: 'طابعة باركود ملصقات', price: 2800, enabled: true }
          ],
          visits: [
            { type: 'متابعة وتدريب', price: 300, enabled: true }
          ],
          devicesTotal: 4000,
          visitsTotal: 300,
          subtotal: 8300,
          discount: 300,
          finalInvoice: 8000,
          paidAmount: 5000, // 3000 EGP debt
          status: 'mowakad',
          createdAt: new Date().toISOString(),
        }
      ];

      for (const s of defaultSales) {
        await addDoc(collection(db, 'sales'), s);
      }
    }

    const expensesSnap = await getDocs(collection(db, 'expenses'));
    if (expensesSnap.empty) {
      const defaultExpenses: Omit<Expense, 'id'>[] = [
        {
          title: 'شراء طابعات فواتير حرارية',
          amount: 3200,
          date: new Date().toISOString().split('T')[0],
          category: 'أجهزة ومستلزمات',
          system: 'محلات',
          notes: '3 طابعات للعملاء الجدد',
          createdAt: new Date().toISOString(),
        },
        {
          title: 'انتقالات وبنزين زيارات العميل',
          amount: 450,
          date: new Date().toISOString().split('T')[0],
          category: 'انتقالات وزيارات',
          system: 'محلات',
          notes: 'زيارة تركيب ومتابعة',
          createdAt: new Date().toISOString(),
        }
      ];

      for (const e of defaultExpenses) {
        await addDoc(collection(db, 'expenses'), e);
      }
    }

    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (projectsSnap.empty) {
      const defaultProjects: Omit<ProjectItem, 'id'>[] = [
        {
          title: 'نظام كاشير وإدارة سوبر ماركت البركة',
          system: 'محلات',
          category: 'سوبر ماركت',
          url: 'https://albaraka-pos.example.com',
          description: 'نظام كاشير متكامل يحتوي على قارئ باركود، طباعة فواتير، وإدارة مخازن مع جرس العجز الزائد.',
          clientName: 'محمود أحمد',
          createdAt: new Date().toISOString(),
        },
        {
          title: 'منظومة إدارة بوتيك الشيك للملابس',
          system: 'محلات',
          category: 'ملابس',
          url: 'https://sheik-boutique.example.com',
          description: 'نظام مقاسات وألوان وطباعة باركود للملابس ومتابعة حركات المبيعات والديون.',
          clientName: 'سامح حسن',
          createdAt: new Date().toISOString(),
        },
        {
          title: 'سيستم صيدلية الحياة والأدوات الطبية',
          system: 'محلات',
          category: 'صيدلية',
          url: 'https://alhayat-pharmacy.example.com',
          description: 'إدارة تواريخ الصلاحية، أسعار الدواء، الموردين والشركات، وطباعة الفواتير بوضوح.',
          clientName: 'د. خالد مصطفى',
          createdAt: new Date().toISOString(),
        },
        {
          title: 'ديمو تجريبي - سيستم كاشير ومبيعات متكامل',
          system: 'محلات',
          category: 'سوبر ماركت',
          url: 'https://demo-pos.example.com',
          description: 'نسخة تجريبية معروضة للجمهور الافتراضي للاختبار والمعاينة المباشرة.',
          clientName: 'الجمهور افتراضي',
          isDemo: true,
          createdAt: new Date().toISOString(),
        }
      ];

      for (const proj of defaultProjects) {
        await addDoc(collection(db, 'projects'), proj);
      }
    } else {
      // Check if any existing project is a demo item
      const hasDemo = projectsSnap.docs.some((doc) => doc.data().isDemo === true);
      if (!hasDemo) {
        await addDoc(collection(db, 'projects'), {
          title: 'ديمو تجريبي - سيستم كاشير ومبيعات متكامل',
          system: 'محلات',
          category: 'سوبر ماركت',
          url: 'https://demo-pos.example.com',
          clientEmail: 'demo@example.com',
          hasRegisteredEmail: true,
          description: 'نسخة ديمو تجريبية معروضة للجمهور الافتراضي للاختبار والمعاينة المباشرة.',
          clientName: 'الجمهور افتراضي',
          isDemo: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Seed default team members if empty
    const teamSnap = await getDocs(collection(db, 'team_members'));
    if (teamSnap.empty) {
      const { hash: hashedOwnerPin, salt: ownerPinSalt } = await hashText('297062');
      const defaultTeam: Omit<TeamMember, 'id'>[] = [
        {
          name: 'البارودي (صاحب المشروع)',
          email: 'baroudi@example.com',
          phone: '01000000001',
          whatsappPhone: '01000000001',
          position: 'owner',
          defaultCommissionRate: 100,
          pinCode: hashedOwnerPin,
          pinSalt: ownerPinSalt,
          failedLoginAttempts: 0,
          lockedUntil: '',
          isActive: true,
          allowedScreens: ['home', 'pos', 'sales', 'clients', 'packages', 'sector', 'expenses', 'reports', 'team', 'add-client'],
          permissions: {
            canManageProjects: true,
            canManageSales: true,
            canManagePackages: true,
            canViewExpenses: true,
            canManageTeam: true,
            canViewReports: true,
          },
          createdAt: new Date().toISOString(),
        },
      ];

      for (const tm of defaultTeam) {
        await addDoc(collection(db, 'team_members'), tm);
      }
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

// Helper function to remove undefined values before writing to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as T;
}

// Lead CRUD
export async function getLeads(): Promise<Lead[]> {
  const querySnap = await getDocs(collection(db, 'leads'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lead[];
}

export async function addLead(lead: Omit<Lead, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'leads'), sanitizeForFirestore(lead));
  return docRef.id;
}

export async function updateLead(id: string, lead: Partial<Lead>): Promise<void> {
  await updateDoc(doc(db, 'leads', id), sanitizeForFirestore(lead));
}

export async function deleteLead(id: string): Promise<void> {
  await deleteDoc(doc(db, 'leads', id));
}

export function subscribeLeads(callback: (leads: Lead[]) => void): () => void {
  return onSnapshot(collection(db, 'leads'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
    callback(list);
  }, (err) => console.error('Error listening to leads:', err));
}

// Client CRUD
export async function getClients(): Promise<Client[]> {
  const querySnap = await getDocs(collection(db, 'clients'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Client[];
}

export async function addClient(client: Omit<Client, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'clients'), sanitizeForFirestore(client));
  return docRef.id;
}

export async function updateClient(id: string, client: Partial<Client>): Promise<void> {
  await updateDoc(doc(db, 'clients', id), sanitizeForFirestore(client));
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, 'clients', id));
}

// Package CRUD
export async function getPackages(): Promise<Package[]> {
  const querySnap = await getDocs(collection(db, 'packages'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Package[];
}

export async function addPackage(pkg: Omit<Package, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'packages'), sanitizeForFirestore(pkg));
  return docRef.id;
}

export async function updatePackage(id: string, pkg: Partial<Package>): Promise<void> {
  await updateDoc(doc(db, 'packages', id), sanitizeForFirestore(pkg));
}

export async function deletePackage(id: string): Promise<void> {
  await deleteDoc(doc(db, 'packages', id));
}

// Offer CRUD
export async function getOffers(): Promise<Offer[]> {
  const querySnap = await getDocs(collection(db, 'offers'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Offer[];
}

export async function addOffer(offer: Omit<Offer, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'offers'), sanitizeForFirestore(offer));
  return docRef.id;
}

export async function updateOffer(id: string, offer: Partial<Offer>): Promise<void> {
  await updateDoc(doc(db, 'offers', id), sanitizeForFirestore(offer));
}

export async function deleteOffer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'offers', id));
}

// Sale CRUD
export async function getSales(): Promise<Sale[]> {
  const querySnap = await getDocs(collection(db, 'sales'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sale[];
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'sales'), sanitizeForFirestore(sale));
  return docRef.id;
}

export async function updateSale(id: string, sale: Partial<Sale>): Promise<void> {
  await updateDoc(doc(db, 'sales', id), sanitizeForFirestore(sale));
}

export async function deleteSale(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sales', id));
}

// Expense CRUD
export async function getExpenses(): Promise<Expense[]> {
  const querySnap = await getDocs(collection(db, 'expenses'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Expense[];
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'expenses'), sanitizeForFirestore(expense));
  return docRef.id;
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', id));
}

// Payment CRUD
export async function getPayments(): Promise<Payment[]> {
  const querySnap = await getDocs(collection(db, 'payments'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Payment[];
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'payments'), sanitizeForFirestore(payment));
  return docRef.id;
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'payments', id));
}

// Project CRUD
export async function getProjects(): Promise<ProjectItem[]> {
  const querySnap = await getDocs(collection(db, 'projects'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectItem[];
}

export async function addProject(project: Omit<ProjectItem, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'projects'), sanitizeForFirestore(project));
  return docRef.id;
}

export async function updateProject(id: string, project: Partial<ProjectItem>): Promise<void> {
  await updateDoc(doc(db, 'projects', id), sanitizeForFirestore(project));
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

// REAL-TIME AUTO-SYNC SUBSCRIPTIONS (onSnapshot)
export function subscribeClients(callback: (clients: Client[]) => void): () => void {
  return onSnapshot(collection(db, 'clients'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Client[];
    callback(list);
  }, (err) => console.error('Error listening to clients:', err));
}

export function subscribePackages(callback: (pkgs: Package[]) => void): () => void {
  return onSnapshot(collection(db, 'packages'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Package[];
    callback(list);
  }, (err) => console.error('Error listening to packages:', err));
}

export function subscribeOffers(callback: (offers: Offer[]) => void): () => void {
  return onSnapshot(collection(db, 'offers'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Offer[];
    callback(list);
  }, (err) => console.error('Error listening to offers:', err));
}

export function subscribeSales(callback: (sales: Sale[]) => void): () => void {
  return onSnapshot(collection(db, 'sales'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Sale[];
    callback(list);
  }, (err) => console.error('Error listening to sales:', err));
}

export function subscribeExpenses(callback: (expenses: Expense[]) => void): () => void {
  return onSnapshot(collection(db, 'expenses'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    callback(list);
  }, (err) => console.error('Error listening to expenses:', err));
}

export function subscribePayments(callback: (payments: Payment[]) => void): () => void {
  return onSnapshot(collection(db, 'payments'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];
    callback(list);
  }, (err) => console.error('Error listening to payments:', err));
}

export function subscribeProjects(callback: (projects: ProjectItem[]) => void): () => void {
  return onSnapshot(collection(db, 'projects'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProjectItem[];
    callback(list);
  }, (err) => console.error('Error listening to projects:', err));
}

// Team Member CRUD
export async function getTeamMembers(): Promise<TeamMember[]> {
  const querySnap = await getDocs(collection(db, 'team_members'));
  return querySnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TeamMember[];
}

export async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<string> {
  const payload = { ...member };
  const rawPin = payload.pinCode ? payload.pinCode : '1234';
  const { hash: pinHash, salt: pSalt } = await hashText(rawPin);
  payload.pinCode = pinHash;
  payload.pinSalt = pSalt;

  if (payload.password) {
    const { hash: passHash, salt: passSalt } = await hashText(payload.password);
    payload.password = passHash;
    payload.passwordSalt = passSalt;
  }

  payload.failedLoginAttempts = 0;
  payload.lockedUntil = '';

  const docRef = await addDoc(collection(db, 'team_members'), sanitizeForFirestore(payload));
  return docRef.id;
}

export async function updateTeamMember(id: string, member: Partial<TeamMember>): Promise<void> {
  const payload = { ...member };
  if (payload.pinCode) {
    const { hash: pinHash, salt: pSalt } = await hashText(payload.pinCode);
    payload.pinCode = pinHash;
    payload.pinSalt = pSalt;
  }
  if (payload.password) {
    const { hash: passHash, salt: passSalt } = await hashText(payload.password);
    payload.password = passHash;
    payload.passwordSalt = passSalt;
  }
  await updateDoc(doc(db, 'team_members', id), sanitizeForFirestore(payload));
}

export async function recordFailedLoginAttempt(
  memberId: string,
  currentAttempts: number = 0
): Promise<{ newCount: number; isLocked: boolean; lockedUntil?: string }> {
  const newCount = currentAttempts + 1;
  const updates: Record<string, any> = {
    failedLoginAttempts: newCount,
    lastFailedAttempt: new Date().toISOString(),
  };

  let isLocked = false;
  let lockedUntil: string | undefined = undefined;

  if (newCount >= 5) {
    // Lock account for 15 minutes (900000 ms)
    const lockDurationMs = 15 * 60 * 1000;
    lockedUntil = new Date(Date.now() + lockDurationMs).toISOString();
    updates.lockedUntil = lockedUntil;
    isLocked = true;
  }

  try {
    await updateDoc(doc(db, 'team_members', memberId), updates);
  } catch (err) {
    console.error('Error updating failed login attempts:', err);
  }

  return { newCount, isLocked, lockedUntil };
}

export async function resetLoginAttempts(memberId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'team_members', memberId), {
      failedLoginAttempts: 0,
      lockedUntil: '',
      lastFailedAttempt: '',
    });
  } catch (err) {
    console.error('Error resetting login attempts:', err);
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  await deleteDoc(doc(db, 'team_members', id));
}

export function subscribeTeamMembers(callback: (members: TeamMember[]) => void): () => void {
  return onSnapshot(
    collection(db, 'team_members'),
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        // Auto-migrate legacy plaintext or un-salted pinCode / password to salted SHA-256 hashes in Firestore
        const pin = data.pinCode;
        const pinSalt = data.pinSalt;
        const pass = data.password;
        const passSalt = data.passwordSalt;

        if ((pin && (!pinSalt || pin.length < 64)) || (pass && (!passSalt || pass.length < 64))) {
          (async () => {
            const updates: Record<string, string> = {};
            if (pin && (!pinSalt || pin.length < 64)) {
              const { hash: pHash, salt: pSalt } = await hashText(pin);
              updates.pinCode = pHash;
              updates.pinSalt = pSalt;
            }
            if (pass && (!passSalt || pass.length < 64)) {
              const { hash: pHash, salt: pSalt } = await hashText(pass);
              updates.password = pHash;
              updates.passwordSalt = pSalt;
            }
            try {
              await updateDoc(doc(db, 'team_members', docSnap.id), updates);
            } catch (err) {
              console.error('Error auto-migrating member hash:', err);
            }
          })();
        }

        return {
          id: docSnap.id,
          ...data,
        } as TeamMember;
      });
      callback(list);
    },
    (err) => console.error('Error listening to team_members:', err)
  );
}

export async function resetTeamToOwnerOnly(): Promise<void> {
  const querySnap = await getDocs(collection(db, 'team_members'));
  for (const memberDoc of querySnap.docs) {
    await deleteDoc(doc(db, 'team_members', memberDoc.id));
  }

  const { hash: hashedOwnerPin, salt: ownerPinSalt } = await hashText('297062');
  const ownerPayload: Omit<TeamMember, 'id'> = {
    name: 'البارودي (صاحب المشروع)',
    email: 'baroudi@example.com',
    phone: '01000000001',
    whatsappPhone: '01000000001',
    position: 'owner',
    defaultCommissionRate: 100,
    pinCode: hashedOwnerPin,
    pinSalt: ownerPinSalt,
    failedLoginAttempts: 0,
    lockedUntil: '',
    isActive: true,
    allowedScreens: ['home', 'pos', 'sales', 'clients', 'packages', 'sector', 'expenses', 'reports', 'team', 'add-client'],
    permissions: {
      canManageProjects: true,
      canManageSales: true,
      canManagePackages: true,
      canViewExpenses: true,
      canManageTeam: true,
      canViewReports: true,
    },
    createdAt: new Date().toISOString(),
  };

  await addDoc(collection(db, 'team_members'), ownerPayload);
}
