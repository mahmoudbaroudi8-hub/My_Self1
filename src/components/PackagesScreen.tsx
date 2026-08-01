import React, { useState, useEffect } from 'react';
import {
  Package as PkgIcon,
  Check,
  Plus,
  Trash2,
  Edit3,
  Save,
  Tag,
  Clock,
  Calendar,
  Copy,
  Share2,
  Download,
  KeyRound,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  Store,
  Layers,
  Search,
  ExternalLink,
  Globe,
  FolderKanban,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  CheckSquare,
  Mail,
  ChevronLeft,
  ChevronRight,
  Users,
  RotateCcw,
  X
} from 'lucide-react';
import { ProtectedDeleteModal } from './ProtectedDeleteModal';
import {
  Package,
  Offer,
  ProjectItem,
  PackageFeature,
  SystemType,
  CategoryType,
  OfferDurationUnit,
  PricingModel,
  PaymentStatus,
  ProjectWorkStatus,
  TeamMember,
  POSITION_LABELS,
  PRICING_MODEL_LABELS,
  PAYMENT_STATUS_LABELS,
  WORK_STATUS_LABELS,
  getCategoriesForSystem
} from '../types';

const HorizontalSwipeContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="w-full relative select-none">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`w-full flex flex-nowrap items-center gap-1.5 overflow-x-auto horizontal-scroll-strip py-1 px-1 cursor-grab active:cursor-grabbing ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

interface PackagesScreenProps {
  packages: Package[];
  offers: Offer[];
  projects: ProjectItem[];
  teamMembers?: TeamMember[];
  onAddPackage: (pkg: Omit<Package, 'id'>) => Promise<string>;
  onUpdatePackage: (id: string, pkg: Partial<Package>) => Promise<void>;
  onDeletePackage: (id: string) => Promise<void>;
  onAddOffer: (offer: Omit<Offer, 'id'>) => Promise<string>;
  onUpdateOffer: (id: string, offer: Partial<Offer>) => Promise<void>;
  onDeleteOffer: (id: string) => Promise<void>;
  onAddProject: (project: Omit<ProjectItem, 'id'>) => Promise<string>;
  onUpdateProject: (id: string, project: Partial<ProjectItem>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onLogout: () => void;
  installPrompt: any;
  onInstallApp: () => void;
  isAppInstalled: boolean;
}

export const PackagesScreen: React.FC<PackagesScreenProps> = ({
  packages,
  offers,
  projects,
  teamMembers = [],
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onLogout,
  installPrompt,
  onInstallApp,
  isAppInstalled,
}) => {
  // Main settings menu tabs
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'manage_packages' | 'manage_offers' | 'manage_projects' | 'account'
  >('catalog');

  // Filter state for catalog
  const [catalogSystemFilter, setCatalogSystemFilter] = useState<string>('الكل');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('الكل');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'all' | 'packages' | 'offers' | 'projects' | 'demos'>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // PACKAGE FORM STATE
  const [selectedPackageId, setSelectedPackageId] = useState<string>('new');
  const [pkgName, setPkgName] = useState('');
  const [pkgSystem, setPkgSystem] = useState<SystemType>('محلات');
  const [pkgCategory, setPkgCategory] = useState<CategoryType>('سوبر ماركت');
  const [pkgPrice, setPkgPrice] = useState<number>(3000);
  const [pkgDiscount, setPkgDiscount] = useState<number>(0);

  // OFFER FORM STATE
  const [selectedOfferId, setSelectedOfferId] = useState<string>('new');
  const [offerName, setOfferName] = useState('');
  const [offerSystem, setOfferSystem] = useState<SystemType>('محلات');
  const [offerCategory, setOfferCategory] = useState<CategoryType>('سوبر ماركت');
  const [offerDurationValue, setOfferDurationValue] = useState<number>(3);
  const [offerDurationUnit, setOfferDurationUnit] = useState<OfferDurationUnit>('أشهر');
  const [offerPrice, setOfferPrice] = useState<number>(3500);
  const [offerDiscount, setOfferDiscount] = useState<number>(1000);
  const [offerBadgeText, setOfferBadgeText] = useState('عرض لفترة محدودة');

  // PROJECT FORM STATE
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSystem, setProjectSystem] = useState<SystemType>('محلات');
  const [projectCategory, setProjectCategory] = useState<CategoryType>('سوبر ماركت');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectClientName, setProjectClientName] = useState('');
  const [projectClientEmail, setProjectClientEmail] = useState('');
  const [projectHasRegisteredEmail, setProjectHasRegisteredEmail] = useState(false);
  const [projectIsDemo, setProjectIsDemo] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');

  // Extended project pricing, payment status & team assignments
  const [projectPricingModel, setProjectPricingModel] = useState<PricingModel>('full_sale');
  const [projectTotalPrice, setProjectTotalPrice] = useState<number>(0);
  const [projectPaidAmount, setProjectPaidAmount] = useState<number>(0);

  const [projectAssignedEngineerId, setProjectAssignedEngineerId] = useState<string>('');
  const [projectAssignedEngineerName, setProjectAssignedEngineerName] = useState<string>('');
  const [projectEngineerCommissionRate, setProjectEngineerCommissionRate] = useState<number>(30);

  const [projectAssignedMediaBuyerId, setProjectAssignedMediaBuyerId] = useState<string>('');
  const [projectAssignedMediaBuyerName, setProjectAssignedMediaBuyerName] = useState<string>('');
  const [projectMediaBuyerCommissionRate, setProjectMediaBuyerCommissionRate] = useState<number>(20);

  const [projectOwnerCommissionRate, setProjectOwnerCommissionRate] = useState<number>(50);
  const [projectOwnerIsEngineer, setProjectOwnerIsEngineer] = useState<boolean>(true);

  // Protected Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemDescription: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    itemDescription: '',
    onConfirm: () => {},
  });

  // Shared feature lists
  const defaultFeaturesList: PackageFeature[] = [
    { name: 'نقطة البيع (POS)', enabled: true },
    { name: 'المشتريات والموردين', enabled: true },
    { name: 'إدارة المخزن والأصناف', enabled: true },
    { name: 'داشبورد التقارير والأرباح', enabled: true },
    { name: 'حسابات العملاء والديون', enabled: true },
    { name: 'طباعة الفواتير والباركود', enabled: true },
    { name: 'إدارة الصلاحيات والمستخدمين', enabled: false },
    { name: 'كشف حساب تفصيلي للعميل', enabled: false },
    { name: 'حسابات وتدفقات الموظفين', enabled: false },
  ];

  const [pkgFeatures, setPkgFeatures] = useState<PackageFeature[]>(defaultFeaturesList);
  const [customPkgFeature, setCustomPkgFeature] = useState('');

  const [offerFeatures, setOfferFeatures] = useState<PackageFeature[]>(defaultFeaturesList);
  const [customOfferFeature, setCustomOfferFeature] = useState('');

  // Account Settings state
  const [username, setUsername] = useState(() => localStorage.getItem('bm_username') || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountSuccessMsg, setAccountSuccessMsg] = useState('');
  const [accountErrorMsg, setAccountErrorMsg] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate Package Form
  useEffect(() => {
    if (selectedPackageId === 'new') {
      setPkgName('');
      setPkgSystem('محلات');
      setPkgCategory('سوبر ماركت');
      setPkgPrice(3000);
      setPkgDiscount(0);
      setPkgFeatures(defaultFeaturesList);
    } else {
      const found = packages.find((p) => p.id === selectedPackageId);
      if (found) {
        setPkgName(found.name || '');
        setPkgSystem(found.system || 'محلات');
        setPkgCategory(found.category || 'سوبر ماركت');
        setPkgPrice(found.price || 0);
        setPkgDiscount(found.discount || 0);
        setPkgFeatures(found.features || defaultFeaturesList);
      }
    }
  }, [selectedPackageId, packages]);

  // Populate Offer Form
  useEffect(() => {
    if (selectedOfferId === 'new') {
      setOfferName('');
      setOfferSystem('محلات');
      setOfferCategory('سوبر ماركت');
      setOfferDurationValue(3);
      setOfferDurationUnit('أشهر');
      setOfferPrice(3500);
      setOfferDiscount(1000);
      setOfferBadgeText('عرض لفترة محدودة');
      setOfferFeatures(defaultFeaturesList);
    } else {
      const found = offers.find((o) => o.id === selectedOfferId);
      if (found) {
        setOfferName(found.name || '');
        setOfferSystem(found.system || 'محلات');
        setOfferCategory(found.category || 'سوبر ماركت');
        setOfferDurationValue(found.durationValue || 1);
        setOfferDurationUnit(found.durationUnit || 'أشهر');
        setOfferPrice(found.price || 0);
        setOfferDiscount(found.discount || 0);
        setOfferBadgeText(found.badgeText || 'عرض لفترة محدودة');
        setOfferFeatures(found.features || defaultFeaturesList);
      }
    }
  }, [selectedOfferId, offers]);

  // Populate Project Form
  useEffect(() => {
    if (selectedProjectId === 'new') {
      setProjectTitle('');
      setProjectSystem('محلات');
      setProjectCategory('سوبر ماركت');
      setProjectUrl('');
      setProjectClientName('');
      setProjectClientEmail('');
      setProjectHasRegisteredEmail(false);
      setProjectIsDemo(false);
      setProjectDescription('');

      setProjectPricingModel('full_sale');
      setProjectTotalPrice(0);
      setProjectPaidAmount(0);

      const defaultEngineer = teamMembers.find((m) => m.position === 'engineer' || m.position === 'owner');
      const defaultMedia = teamMembers.find((m) => m.position === 'media_buyer');

      setProjectAssignedEngineerId(defaultEngineer?.id || '');
      setProjectAssignedEngineerName(defaultEngineer?.name || '');
      setProjectEngineerCommissionRate(defaultEngineer?.defaultCommissionRate || 30);

      setProjectAssignedMediaBuyerId(defaultMedia?.id || '');
      setProjectAssignedMediaBuyerName(defaultMedia?.name || '');
      setProjectMediaBuyerCommissionRate(defaultMedia?.defaultCommissionRate || 20);

      setProjectOwnerCommissionRate(50);
      setProjectOwnerIsEngineer(true);
    } else {
      const found = projects.find((pr) => pr.id === selectedProjectId);
      if (found) {
        setProjectTitle(found.title || '');
        setProjectSystem(found.system || 'محلات');
        setProjectCategory(found.category || 'سوبر ماركت');
        setProjectUrl(found.url || '');
        setProjectClientName(found.clientName || '');
        setProjectClientEmail(found.clientEmail || '');
        setProjectHasRegisteredEmail(!!found.hasRegisteredEmail || !!found.clientEmail);
        setProjectIsDemo(!!found.isDemo);
        setProjectDescription(found.description || '');

        setProjectPricingModel(found.pricingModel || 'full_sale');
        setProjectTotalPrice(found.totalPrice || 0);
        setProjectPaidAmount(found.paidAmount || 0);

        setProjectAssignedEngineerId(found.assignedEngineerId || '');
        setProjectAssignedEngineerName(found.assignedEngineerName || '');
        setProjectEngineerCommissionRate(found.engineerCommissionRate ?? 30);

        setProjectAssignedMediaBuyerId(found.assignedMediaBuyerId || '');
        setProjectAssignedMediaBuyerName(found.assignedMediaBuyerName || '');
        setProjectMediaBuyerCommissionRate(found.mediaBuyerCommissionRate ?? 20);

        setProjectOwnerCommissionRate(found.ownerCommissionRate ?? 50);
        setProjectOwnerIsEngineer(found.ownerIsEngineer !== false);
      }
    }
  }, [selectedProjectId, projects, teamMembers]);

  // Feature Toggles
  const togglePkgFeature = (idx: number) => {
    const updated = [...pkgFeatures];
    updated[idx].enabled = !updated[idx].enabled;
    setPkgFeatures(updated);
  };

  const addCustomPkgFeature = () => {
    if (!customPkgFeature.trim()) return;
    setPkgFeatures([...pkgFeatures, { name: customPkgFeature.trim(), enabled: true }]);
    setCustomPkgFeature('');
  };

  const toggleOfferFeature = (idx: number) => {
    const updated = [...offerFeatures];
    updated[idx].enabled = !updated[idx].enabled;
    setOfferFeatures(updated);
  };

  const addCustomOfferFeature = () => {
    if (!customOfferFeature.trim()) return;
    setOfferFeatures([...offerFeatures, { name: customOfferFeature.trim(), enabled: true }]);
    setCustomOfferFeature('');
  };

  const pkgFinalPrice = Math.max(0, pkgPrice - pkgDiscount);
  const offerFinalPrice = Math.max(0, offerPrice - offerDiscount);

  // SAVE PACKAGE
  const handleSavePackage = async () => {
    if (!pkgName.trim()) {
      alert('رجاءً أدخل اسم الباقة (مثلاً: الباقة الأساسية للمحلات)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPackageId === 'new') {
        await onAddPackage({
          name: pkgName.trim(),
          system: pkgSystem,
          category: pkgCategory,
          features: pkgFeatures,
          price: pkgPrice,
          discount: pkgDiscount,
          finalPrice: pkgFinalPrice,
        });
        alert('تمت إضافة الباقة بنجاح!');
      } else {
        await onUpdatePackage(selectedPackageId, {
          name: pkgName.trim(),
          system: pkgSystem,
          category: pkgCategory,
          features: pkgFeatures,
          price: pkgPrice,
          discount: pkgDiscount,
          finalPrice: pkgFinalPrice,
        });
        alert('تم تحديث بيانات الباقة بنجاح!');
      }
    } catch (err) {
      console.error('Error saving package:', err);
      alert('حدث خطأ أثناء حفظ الباقة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE PACKAGE BY ID
  const handleDeletePackageById = (id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'حذف باقة من النظام',
      itemDescription: `الباقة: "${name}"`,
      onConfirm: async () => {
        await onDeletePackage(id);
        if (selectedPackageId === id) setSelectedPackageId('new');
      },
    });
  };

  // SAVE OFFER
  const handleSaveOffer = async () => {
    if (!offerName.trim()) {
      alert('رجاءً أدخل اسم العرض (مثلاً: عرض انطلاقة المحلات)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedOfferId === 'new') {
        await onAddOffer({
          name: offerName.trim(),
          system: offerSystem,
          category: offerCategory,
          durationValue: Number(offerDurationValue) || 1,
          durationUnit: offerDurationUnit,
          features: offerFeatures,
          price: offerPrice,
          discount: offerDiscount,
          finalPrice: offerFinalPrice,
          badgeText: offerBadgeText.trim() || 'عرض محدود',
          isActive: true,
        });
        alert('تمت إضافة العرض بنجاح!');
      } else {
        await onUpdateOffer(selectedOfferId, {
          name: offerName.trim(),
          system: offerSystem,
          category: offerCategory,
          durationValue: Number(offerDurationValue) || 1,
          durationUnit: offerDurationUnit,
          features: offerFeatures,
          price: offerPrice,
          discount: offerDiscount,
          finalPrice: offerFinalPrice,
          badgeText: offerBadgeText.trim() || 'عرض محدود',
          isActive: true,
        });
        alert('تم تحديث بيانات العرض بنجاح!');
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      alert('حدث خطأ أثناء حفظ العرض.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE OFFER BY ID
  const handleDeleteOfferById = (id: string, name: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'حذف عرض ترويجي',
      itemDescription: `العرض: "${name}"`,
      onConfirm: async () => {
        await onDeleteOffer(id);
        if (selectedOfferId === id) setSelectedOfferId('new');
      },
    });
  };

  // SAVE PROJECT
  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      alert('رجاءً أدخل اسم أو عنوان المشروع');
      return;
    }
    if (!projectUrl.trim()) {
      alert('رجاءً أدخل رابط المشروع المباشر (URL)');
      return;
    }

    let formattedUrl = projectUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const finalClientName = projectClientName.trim() || (projectIsDemo ? 'الجمهور افتراضي' : undefined);

    const total = Number(projectTotalPrice) || 0;
    const paid = Number(projectPaidAmount) || 0;

    // Derive Payment Status
    let computedPaymentStatus: PaymentStatus = 'unpaid';
    if (paid >= total && total > 0) {
      computedPaymentStatus = 'full';
    } else if (paid > 0 && paid < total) {
      computedPaymentStatus = 'partial';
    }

    // Derive Work Status
    let computedWorkStatus: ProjectWorkStatus = 'under_construction';
    if (paid >= total && total > 0) {
      computedWorkStatus = 'completed';
    }

    // Get assigned team member names
    const assignedEng = teamMembers.find((m) => m.id === projectAssignedEngineerId);
    const assignedMedia = teamMembers.find((m) => m.id === projectAssignedMediaBuyerId);

    const projectPayload: Omit<ProjectItem, 'id'> = {
      title: projectTitle.trim(),
      system: projectSystem,
      category: projectCategory,
      url: formattedUrl,
      clientName: finalClientName,
      clientEmail: projectClientEmail.trim() || undefined,
      hasRegisteredEmail: projectHasRegisteredEmail || !!projectClientEmail.trim(),
      isDemo: projectIsDemo,
      description: projectDescription.trim() || undefined,

      pricingModel: projectPricingModel,
      totalPrice: total,
      paidAmount: paid,
      paymentStatus: computedPaymentStatus,
      projectStatus: computedWorkStatus,

      assignedEngineerId: projectAssignedEngineerId || undefined,
      assignedEngineerName: assignedEng?.name || projectAssignedEngineerName.trim() || undefined,
      engineerCommissionRate: Number(projectEngineerCommissionRate) || 0,

      assignedMediaBuyerId: projectAssignedMediaBuyerId || undefined,
      assignedMediaBuyerName: assignedMedia?.name || projectAssignedMediaBuyerName.trim() || undefined,
      mediaBuyerCommissionRate: Number(projectMediaBuyerCommissionRate) || 0,

      ownerCommissionRate: Number(projectOwnerCommissionRate) || 50,
      ownerIsEngineer: projectOwnerIsEngineer,

      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (selectedProjectId === 'new') {
        await onAddProject(projectPayload);
        alert(projectIsDemo ? 'تمت إضافة رابط الديمو (الجمهور افتراضي) بنجاح!' : 'تمت إضافة المشروع وتكوينه بنجاح!');
      } else {
        await onUpdateProject(selectedProjectId, projectPayload);
        alert('تم تحديث بيانات وتشغيل وتكلفة المشروع بنجاح!');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      alert('حدث خطأ أثناء حفظ المشروع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE PROJECT BY ID
  const handleDeleteProjectById = (id: string, title: string) => {
    setDeleteModalState({
      isOpen: true,
      title: 'حذف مشروع من المعرض',
      itemDescription: `المشروع: "${title}"`,
      onConfirm: async () => {
        await onDeleteProject(id);
        if (selectedProjectId === id) setSelectedProjectId('new');
      },
    });
  };

  // SAVE ACCOUNT CREDENTIALS
  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSuccessMsg('');
    setAccountErrorMsg('');

    const storedPass = localStorage.getItem('bm_password') || '123';
    if (currentPassword !== storedPass) {
      setAccountErrorMsg('كلمة المرور الحالية غير صحيحة!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setAccountErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين!');
      return;
    }

    if (username.trim()) {
      localStorage.setItem('bm_username', username.trim());
    }
    if (newPassword) {
      localStorage.setItem('bm_password', newPassword);
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAccountSuccessMsg('تم تحديث اسم المستخدم وكلمة المرور بنجاح!');
  };

  // SHARE TO WHATSAPP & COPY FUNCTIONS
  const generateTextForPackage = (p: Package) => {
    const enabledFeats = p.features.filter((f) => f.enabled).map((f) => `• ${f.name}`).join('\n');
    return `*تفاصيل ${p.name}*\n` +
      `📌 النظام: ${p.system} (${p.category})\n` +
      `💰 السعر المطلوب: ${p.finalPrice.toLocaleString('ar-EG')} ج.م ${p.discount > 0 ? `(بعد خصم ${p.discount} ج.م)` : ''}\n\n` +
      `✨ *الميزات المضمنة:*\n${enabledFeats}\n\n` +
      `للحجز والاستفسار يرجى التواصل معنا!`;
  };

  const generateTextForOffer = (o: Offer) => {
    const enabledFeats = o.features.filter((f) => f.enabled).map((f) => `• ${f.name}`).join('\n');
    return `🔥 *${o.badgeText || 'عرض خاص لفترة محدودة'}*\n` +
      `🌟 *${o.name}*\n` +
      `⏳ فترة العرض: ${o.durationValue} ${o.durationUnit}\n` +
      `📌 النظام: ${o.system} (${o.category})\n` +
      `💵 السعر قبل الخصم: ${o.price.toLocaleString('ar-EG')} ج.م\n` +
      `🎉 السعر بعد الخصم: ${o.finalPrice.toLocaleString('ar-EG')} ج.م (وفرت ${o.discount.toLocaleString('ar-EG')} ج.م!)\n\n` +
      `✨ *خدمات وميزات العرض:*\n${enabledFeats}\n\n` +
      `سارع بالحجز قبل انتهاء العرض!`;
  };

  const generateTextForProject = (prj: ProjectItem) => {
    const isDemo = prj.isDemo;
    const header = isDemo ? '🧪 *ديمو تجريبي (الجمهور افتراضي)*' : '🚀 *مشروع سابق / نموذج حي*';
    const clientText = prj.clientName ? `👤 العميل / المكان: ${prj.clientName}\n` : (isDemo ? `👤 الجمهور: الجمهور افتراضي\n` : '');
    return `${header}\n` +
      `📌 *${prj.title}*\n` +
      `🏢 النظام: ${prj.system} | المجال: ${prj.category}\n` +
      clientText +
      (prj.clientEmail ? `📧 إيميل الحساب/المشروع: ${prj.clientEmail}\n` : '') +
      (prj.hasRegisteredEmail || prj.clientEmail ? `✓ متسجل ببريد إلكتروني\n` : '') +
      (prj.description ? `📝 التفاصيل: ${prj.description}\n` : '') +
      `🔗 *رابط المعاينة والتجربة المباشرة:*\n${prj.url}\n\n` +
      `لطلب تطبيق سيستم مماثل لنشاطك، تواصل معنا فوراً!`;
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Catalog filtered arrays
  const query = catalogSearchQuery.trim().toLowerCase();

  const filteredCatalogPackages = packages.filter((p) => {
    if (catalogSystemFilter !== 'الكل' && p.system !== catalogSystemFilter) return false;
    if (catalogCategoryFilter !== 'الكل' && p.category !== catalogCategoryFilter) return false;
    if (query) {
      const matchName = (p.name || '').toLowerCase().includes(query);
      const matchSys = (p.system || '').toLowerCase().includes(query);
      const matchCat = (p.category || '').toLowerCase().includes(query);
      return matchName || matchSys || matchCat;
    }
    return true;
  });

  const filteredCatalogOffers = offers.filter((o) => {
    if (catalogSystemFilter !== 'الكل' && o.system !== catalogSystemFilter) return false;
    if (catalogCategoryFilter !== 'الكل' && o.category !== catalogCategoryFilter) return false;
    if (query) {
      const matchName = (o.name || '').toLowerCase().includes(query);
      const matchBadge = (o.badgeText || '').toLowerCase().includes(query);
      const matchSys = (o.system || '').toLowerCase().includes(query);
      const matchCat = (o.category || '').toLowerCase().includes(query);
      return matchName || matchBadge || matchSys || matchCat;
    }
    return true;
  });

  const filteredCatalogProjects = projects.filter((prj) => {
    if (prj.isDemo) return false;
    if (catalogSystemFilter !== 'الكل' && prj.system !== catalogSystemFilter) return false;
    if (catalogCategoryFilter !== 'الكل' && prj.category !== catalogCategoryFilter) return false;
    if (query) {
      const matchTitle = (prj.title || '').toLowerCase().includes(query);
      const matchClient = (prj.clientName || '').toLowerCase().includes(query); // اسم المحل / العميل
      const matchEmail = (prj.clientEmail || '').toLowerCase().includes(query); // إيميل المشروع / الحساب
      const matchDesc = (prj.description || '').toLowerCase().includes(query);
      const matchUrl = (prj.url || '').toLowerCase().includes(query);
      const matchSys = (prj.system || '').toLowerCase().includes(query);
      const matchCat = (prj.category || '').toLowerCase().includes(query);
      return matchTitle || matchClient || matchEmail || matchDesc || matchUrl || matchSys || matchCat;
    }
    return true;
  });

  const filteredCatalogDemos = projects.filter((prj) => {
    if (!prj.isDemo) return false;
    if (catalogSystemFilter !== 'الكل' && prj.system !== catalogSystemFilter) return false;
    if (catalogCategoryFilter !== 'الكل' && prj.category !== catalogCategoryFilter) return false;
    if (query) {
      const matchTitle = (prj.title || '').toLowerCase().includes(query);
      const matchClient = (prj.clientName || 'الجمهور افتراضي').toLowerCase().includes(query);
      const matchEmail = (prj.clientEmail || '').toLowerCase().includes(query);
      const matchDesc = (prj.description || '').toLowerCase().includes(query);
      const matchUrl = (prj.url || '').toLowerCase().includes(query);
      const matchSys = (prj.system || '').toLowerCase().includes(query);
      const matchCat = (prj.category || '').toLowerCase().includes(query);
      const matchDemoKey = 'ديمو تجريبي جمهور افتراضي الجمهور'.includes(query);
      return matchTitle || matchClient || matchEmail || matchDesc || matchUrl || matchSys || matchCat || matchDemoKey;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between border-b-2 border-b-[#FF7A1A]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/10">
            <PkgIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">إعدادات الباقات، العروض ومعرض المشاريع</h2>
            <p className="text-[11px] text-gray-300">إدارة مخصصة للباقات الأساسية، العروض المحدودة، ومعرض النماذج الحية</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <HorizontalSwipeContainer className="p-1 bg-[#121C30]/90 rounded-2xl border border-white/10 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'catalog'
              ? 'bg-[#FF7A1A] text-white shadow-lg shadow-[#FF7A1A]/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>الكتالوج المنظم</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedPackageId('new');
            setActiveTab('manage_packages');
          }}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'manage_packages'
              ? 'bg-[#FF7A1A] text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <PkgIcon className="w-3.5 h-3.5" />
          <span>إدارة الباقات ({packages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedOfferId('new');
            setActiveTab('manage_offers');
          }}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'manage_offers'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>إدارة العروض ({offers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedProjectId('new');
            setActiveTab('manage_projects');
          }}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'manage_projects'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>معرض المشاريع ({projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'account'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>الحساب والتثبيت</span>
        </button>
      </HorizontalSwipeContainer>

      {/* ---------------- 1. CATALOG TAB (ORGANIZED SECTIONS WITH FILTER) ---------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* CATALOG FILTER CONTROL BOX */}
          <div className="glass-card p-3.5 space-y-3 border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#FF7A1A]" /> تصفية الكتالوج والبحث
              </span>
              <button
                type="button"
                onClick={() => {
                  setCatalogSystemFilter('الكل');
                  setCatalogCategoryFilter('الكل');
                  setCatalogTypeFilter('all');
                  setCatalogSearchQuery('');
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  (catalogSystemFilter !== 'الكل' || catalogCategoryFilter !== 'الكل' || catalogTypeFilter !== 'all' || catalogSearchQuery)
                    ? 'bg-[#FF7A1A]/20 text-[#FF7A1A] border border-[#FF7A1A]/40 hover:bg-[#FF7A1A]/30 shadow-sm'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
                title="إعادة ضبط الفلترة وإظهار كافة الباقات والعروض"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FF7A1A]" />
                <span>إعادة ضبط (عرض الكل)</span>
              </button>
            </div>

            {/* Catalog Search Input Field */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#FF7A1A] absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث باسم الباقة، العرض، اسم المحل / العميل، أو رابط المشروع..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="glass-input w-full pr-9 pl-9 py-2 text-xs"
              />
              {catalogSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCatalogSearchQuery('')}
                  className="absolute left-2.5 top-2 p-1 text-gray-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                  title="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* System Filter Chips */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-medium block">النظام الرئيسي:</span>
              <HorizontalSwipeContainer>
                {['الكل', 'محلات', 'شركات', 'صالات جيم', 'برامج', 'أخرى'].map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setCatalogSystemFilter(sys)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all ${
                      catalogSystemFilter === sys
                        ? 'bg-[#FF7A1A] text-white font-bold shadow-md shadow-[#FF7A1A]/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </HorizontalSwipeContainer>
            </div>

            {/* Category Filter Chips */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">القسم الفرعي / المجال:</span>
              <HorizontalSwipeContainer>
                {(catalogSystemFilter !== 'الكل'
                  ? ['الكل', ...getCategoriesForSystem(catalogSystemFilter as SystemType)]
                  : ['الكل', 'سوبر ماركت', 'عقارات', 'مقاولات', 'سياحة', 'استثمار', 'أدوية', 'صيدلية', 'ملابس', 'مطعم', 'صالة صغيرة', 'عادية', 'فوق المتوسط', 'كبيرة', 'تطبيق إداري', 'برنامج إداري', 'نظام شخصي', 'ورش', 'عيادات', 'مصانع', 'خدمات', 'أخرى']
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all ${
                      catalogCategoryFilter === cat
                        ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </HorizontalSwipeContainer>
            </div>

            {/* Type Filter Buttons */}
            <div className="p-1 bg-black/30 rounded-xl text-[11px] font-semibold border border-white/5">
              <HorizontalSwipeContainer>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('all')}
                  className={`py-1.5 px-3 rounded-lg text-center whitespace-nowrap shrink-0 transition-all ${
                    catalogTypeFilter === 'all' ? 'bg-[#FF7A1A] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  الكل ({filteredCatalogPackages.length + filteredCatalogOffers.length + filteredCatalogProjects.length + filteredCatalogDemos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('packages')}
                  className={`py-1.5 px-3 rounded-lg text-center whitespace-nowrap shrink-0 transition-all ${
                    catalogTypeFilter === 'packages' ? 'bg-[#FF7A1A] text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  الباقات ({filteredCatalogPackages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('offers')}
                  className={`py-1.5 px-3 rounded-lg text-center whitespace-nowrap shrink-0 transition-all ${
                    catalogTypeFilter === 'offers' ? 'bg-amber-500 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  العروض ({filteredCatalogOffers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('projects')}
                  className={`py-1.5 px-3 rounded-lg text-center whitespace-nowrap shrink-0 transition-all ${
                    catalogTypeFilter === 'projects' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  المشاريع ({filteredCatalogProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('demos')}
                  className={`py-1.5 px-3 rounded-lg text-center whitespace-nowrap shrink-0 transition-all ${
                    catalogTypeFilter === 'demos' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ديمو ({filteredCatalogDemos.length})
                </button>
              </HorizontalSwipeContainer>
            </div>
          </div>

          {/* ---------------- SECTION 1: PERMANENT BASE PACKAGES ---------------- */}
          {(catalogTypeFilter === 'all' || catalogTypeFilter === 'packages') && (
            <div className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
                    <PkgIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#FF7A1A]">الباقات الأساسية الدائمة</h3>
                    <p className="text-[10px] text-gray-400">باقات الأنظمة الدائمة وميزات كل نظام</p>
                  </div>
                  <span className="text-xs bg-[#FF7A1A]/20 text-[#FF7A1A] font-extrabold px-2 py-0.5 rounded-full border border-[#FF7A1A]/30">
                    {filteredCatalogPackages.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackageId('new');
                    setActiveTab('manage_packages');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FF7A1A] hover:bg-[#e06810] text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة باقة جديدة</span>
                </button>
              </div>

              {filteredCatalogPackages.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCatalogPackages.map((p) => {
                    const textContent = generateTextForPackage(p);
                    return (
                      <div
                        key={p.id}
                        className="glass-card p-4 space-y-3 border border-white/10 hover:border-[#FF7A1A]/40 transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{p.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold px-2 py-0.5 rounded-md border border-[#FF7A1A]/30">
                                النظام: {p.system}
                              </span>
                              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-md">
                                المجال: {p.category}
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            {p.discount > 0 && (
                              <span className="text-[10px] text-gray-400 line-through block">
                                {p.price.toLocaleString('ar-EG')} ج.م
                              </span>
                            )}
                            <span className="text-base font-black text-[#FF7A1A]">
                              {p.finalPrice.toLocaleString('ar-EG')} <span className="text-[10px]">ج.م</span>
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-1.5 py-1">
                          {p.features.map((feat, idx) => (
                            <div
                              key={idx}
                              className={`text-[11px] flex items-center gap-1.5 ${
                                feat.enabled ? 'text-gray-200' : 'text-gray-500 line-through opacity-50'
                              }`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${feat.enabled ? 'text-[#FF7A1A]' : 'text-gray-600'}`} />
                              <span className="truncate">{feat.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Card Action Controls: Copy, WhatsApp, Edit, Delete */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(p.id, textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="نسخ تفاصيل الباقة"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#FF7A1A]" />
                              <span>{copiedId === p.id ? 'تم النسخ!' : 'نسخ'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-600/30"
                              title="إرسال عبر واتساب"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPackageId(p.id);
                                setActiveTab('manage_packages');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="تعديل الباقة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePackageById(p.id, p.name)}
                              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
                              title="حذف الباقة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-6 text-center space-y-2 border border-white/5">
                  <p className="text-xs text-gray-400">لا توجد باقات أساسية مطابقة للتصفية الحالية.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackageId('new');
                      setActiveTab('manage_packages');
                    }}
                    className="text-xs font-bold text-[#FF7A1A] hover:underline"
                  >
                    + اضغط هنا لإضافة باقة جديدة
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------- SECTION 2: LIMITED TIME OFFERS ---------------- */}
          {(catalogTypeFilter === 'all' || catalogTypeFilter === 'offers') && (
            <div className="space-y-3 pt-2">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-amber-400">العروض لفترة محدودة</h3>
                    <p className="text-[10px] text-gray-400">عروض ترويجية بخصومات خاصة ومدد محددة</p>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-400 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                    {filteredCatalogOffers.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfferId('new');
                    setActiveTab('manage_offers');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة عرض جديد</span>
                </button>
              </div>

              {filteredCatalogOffers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCatalogOffers.map((o) => {
                    const textContent = generateTextForOffer(o);
                    return (
                      <div
                        key={o.id}
                        className="glass-card p-4 space-y-3 border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-[#0B1220] to-[#0B1220] relative overflow-hidden"
                      >
                        {/* Offer Badge Top Bar */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow">
                            <Clock className="w-3 h-3" /> {o.badgeText || 'عرض محدود'}
                          </span>
                          <span className="text-[11px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            المدة: {o.durationValue} {o.durationUnit}
                          </span>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-extrabold text-white">{o.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                                النظام: {o.system}
                              </span>
                              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-md">
                                المجال: {o.category}
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            {o.discount > 0 && (
                              <span className="text-[10px] text-gray-400 line-through block">
                                {o.price.toLocaleString('ar-EG')} ج.م
                              </span>
                            )}
                            <span className="text-base font-black text-amber-400">
                              {o.finalPrice.toLocaleString('ar-EG')} <span className="text-[10px]">ج.م</span>
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-1.5 py-1">
                          {o.features.map((feat, idx) => (
                            <div
                              key={idx}
                              className={`text-[11px] flex items-center gap-1.5 ${
                                feat.enabled ? 'text-gray-200' : 'text-gray-500 line-through opacity-50'
                              }`}
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 ${feat.enabled ? 'text-amber-400' : 'text-gray-600'}`} />
                              <span className="truncate">{feat.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Card Action Controls: Copy, WhatsApp, Edit, Delete */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(o.id, textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="نسخ تفاصيل العرض"
                            >
                              <Copy className="w-3.5 h-3.5 text-amber-300" />
                              <span>{copiedId === o.id ? 'تم النسخ!' : 'نسخ'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-600/30"
                              title="إرسال عبر واتساب"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOfferId(o.id);
                                setActiveTab('manage_offers');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="تعديل العرض"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOfferById(o.id, o.name)}
                              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
                              title="حذف العرض"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-6 text-center space-y-2 border border-white/5">
                  <p className="text-xs text-gray-400">لا توجد عروض ترويجية مطابقة للتصفية الحالية.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOfferId('new');
                      setActiveTab('manage_offers');
                    }}
                    className="text-xs font-bold text-amber-400 hover:underline"
                  >
                    + اضغط هنا لإضافة عرض جديد
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------- SECTION 3: PROJECTS SHOWCASE ---------------- */}
          {(catalogTypeFilter === 'all' || catalogTypeFilter === 'projects') && (
            <div className="space-y-3 pt-2">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-400">معرض المشاريع والنماذج الحية</h3>
                    <p className="text-[10px] text-gray-400">روابط المعاينة المباشرة لمشاريع العملاء السابقة</p>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {filteredCatalogProjects.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId('new');
                    setActiveTab('manage_projects');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مشروع جديد</span>
                </button>
              </div>

              {filteredCatalogProjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCatalogProjects.map((prj) => {
                    const textContent = generateTextForProject(prj);
                    return (
                      <div
                        key={prj.id}
                        className="glass-card p-4 space-y-3 border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-[#0B1220] to-[#0B1220] relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                              <h4 className="text-sm font-extrabold text-white">{prj.title}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                                النظام: {prj.system}
                              </span>
                              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded-md">
                                المجال: {prj.category}
                              </span>
                            </div>
                          </div>

                          <a
                            href={prj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shrink-0"
                            title="فتح الرابط في نافذة جديدة"
                          >
                            <span>فتح الرابط</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {prj.clientName && (
                          <p className="text-[11px] text-gray-300">
                            العميل / النشاط: <strong className="text-white">{prj.clientName}</strong>
                          </p>
                        )}

                        {/* Direct URL & Email Display Boxes (Matching Twin Boxes) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Direct URL Display Box */}
                          <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[10px] text-emerald-200 truncate dir-ltr font-mono">
                                {prj.url}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(prj.url);
                                alert('تم نسخ رابط المشروع!');
                              }}
                              className="text-[9px] text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-0.5 rounded-md border border-emerald-400/30 transition-all shrink-0"
                              title="نسخ رابط المشروع"
                            >
                              نسخ الرابط
                            </button>
                          </div>

                          {/* Direct Email Display Box */}
                          <div className="p-2 bg-blue-950/40 rounded-xl border border-blue-500/20 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="text-[10px] text-blue-200 truncate dir-ltr font-mono">
                                {prj.clientEmail || (prj.hasRegisteredEmail ? 'متسجل ببريد ✓' : 'بدون بريد')}
                              </span>
                            </div>
                            {prj.clientEmail ? (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(prj.clientEmail!);
                                  alert('تم نسخ البريد الإلكتروني للمشروع!');
                                }}
                                className="text-[9px] text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 px-2 py-0.5 rounded-md border border-blue-400/30 transition-all shrink-0"
                                title="نسخ البريد الإلكتروني"
                              >
                                نسخ الإيميل
                              </button>
                            ) : prj.hasRegisteredEmail ? (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                                متسجل ✓
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {prj.description && (
                          <p className="text-[11px] text-gray-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                            {prj.description}
                          </p>
                        )}

                        {/* Card Action Controls: Copy, WhatsApp, Edit, Delete */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(prj.id, textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="نسخ رابط وتفاصيل المشروع"
                            >
                              <Copy className="w-3.5 h-3.5 text-emerald-300" />
                              <span>{copiedId === prj.id ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-600/30"
                              title="إرسال عبر واتساب"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(prj.id);
                                setActiveTab('manage_projects');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="تعديل بيانات المشروع"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProjectById(prj.id, prj.title)}
                              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
                              title="حذف المشروع"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-6 text-center space-y-2 border border-white/5">
                  <p className="text-xs text-gray-400">لا توجد مشاريع سابقة مطابقة للتصفية الحالية.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId('new');
                      setActiveTab('manage_projects');
                    }}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    + اضغط هنا لإضافة مشروع جديد للمعرض
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------- SECTION 4: DEMOS (الجمهور الافتراضي) ---------------- */}
          {(catalogTypeFilter === 'all' || catalogTypeFilter === 'demos') && (
            <div className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-white">الروابط التجريبية (الديمو - الجمهور الافتراضي)</h2>
                    <p className="text-[10px] text-gray-400">
                      روابط ديمو جاهزة للعرض والاختبار المباشر مخصصة للجمهور الافتراضي
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {filteredCatalogDemos.length} روابط تجريبية
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId('new');
                      setProjectTitle('');
                      setProjectUrl('');
                      setProjectIsDemo(true);
                      setProjectClientName('الجمهور افتراضي');
                      setActiveTab('manage_projects');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>+ إضافة ديمو</span>
                  </button>
                </div>
              </div>

              {filteredCatalogDemos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredCatalogDemos.map((prj) => {
                    const textContent = generateTextForProject(prj);

                    return (
                      <div
                        key={prj.id}
                        className="glass-card p-4 space-y-3 border border-purple-500/30 hover:border-purple-500/60 transition-all bg-gradient-to-b from-purple-950/20 to-black/30 shadow-lg relative group"
                      >
                        {/* Demo Badge Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🧪 ديمو تجريبي
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {prj.system}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-gray-300">
                                {prj.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                              {prj.title}
                            </h3>
                          </div>

                          <a
                            href={prj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shrink-0"
                            title="فتح رابط الديمو في نافذة جديدة"
                          >
                            <span>فتح الديمو</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <p className="text-[11px] text-purple-200 font-medium">
                          الجمهور / المستهدف: <strong className="text-white">{prj.clientName || 'الجمهور افتراضي'}</strong>
                        </p>

                        {/* Direct URL & Email Display Boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2 bg-purple-950/40 rounded-xl border border-purple-500/20 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="text-[10px] text-purple-200 truncate dir-ltr font-mono">
                                {prj.url}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(prj.url);
                                alert('تم نسخ رابط الديمو!');
                              }}
                              className="text-[9px] text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 px-2 py-0.5 rounded-md border border-purple-400/30 transition-all shrink-0"
                            >
                              نسخ الرابط
                            </button>
                          </div>

                          <div className="p-2 bg-blue-950/40 rounded-xl border border-blue-500/20 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="text-[10px] text-blue-200 truncate dir-ltr font-mono">
                                {prj.clientEmail || (prj.hasRegisteredEmail ? 'متسجل ببريد ✓' : 'بدون بريد')}
                              </span>
                            </div>
                            {prj.clientEmail ? (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(prj.clientEmail!);
                                  alert('تم نسخ البريد الإلكتروني للديمو!');
                                }}
                                className="text-[9px] text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 px-2 py-0.5 rounded-md border border-blue-400/30 transition-all shrink-0"
                              >
                                نسخ الإيميل
                              </button>
                            ) : prj.hasRegisteredEmail ? (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                                متسجل ✓
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {prj.description && (
                          <p className="text-[11px] text-gray-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                            {prj.description}
                          </p>
                        )}

                        {/* Action Controls */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(prj.id, textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-300" />
                              <span>{copiedId === prj.id ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(textContent)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-600/30"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(prj.id);
                                setActiveTab('manage_projects');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProjectById(prj.id, prj.title)}
                              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card p-6 text-center space-y-3 border border-white/5 bg-purple-950/10">
                  <p className="text-xs text-gray-300">لا توجد روابط ديمو مطابقة للتصفية الحالية.</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await onAddProject({
                            title: 'ديمو تجريبي - سيستم كاشير ومبيعات متكامل',
                            system: 'محلات',
                            category: 'سوبر ماركت',
                            url: 'https://demo-pos.example.com',
                            clientEmail: 'demo@example.com',
                            hasRegisteredEmail: true,
                            description: 'نسخة ديمو تجريبية للجمهور الافتراضي للاختبار والمعاينة المباشرة.',
                            clientName: 'الجمهور افتراضي',
                            isDemo: true,
                            createdAt: new Date().toISOString(),
                          });
                          alert('تم إضافة ديمو افتراضي بنجاح!');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      ⚡ إضافة نموذج ديمو جاهز تلقائياً
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId('new');
                        setProjectIsDemo(true);
                        setProjectClientName('الجمهور افتراضي');
                        setActiveTab('manage_projects');
                      }}
                      className="text-xs font-bold text-purple-300 hover:underline"
                    >
                      + كتابة رابط ديمو جديد يدويًا
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 2. MANAGE PACKAGES TAB ---------------- */}
      {activeTab === 'manage_packages' && (
        <div className="space-y-4">
          {/* Select package dropdown */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200">إدارة الباقات الأساسية الدائمة</label>
              <button
                type="button"
                onClick={() => setSelectedPackageId('new')}
                className="text-[11px] bg-[#FF7A1A]/20 text-[#FF7A1A] hover:bg-[#FF7A1A]/30 font-bold px-2.5 py-1 rounded-lg border border-[#FF7A1A]/40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة باقة جديدة
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="glass-input flex-1 p-2.5 text-xs font-semibold"
              >
                <option value="new">+ إنشاء باقة جديدة جديدة</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.name} - ({p.system} / {p.category}) - {p.finalPrice} ج.م
                  </option>
                ))}
              </select>

              {selectedPackageId !== 'new' && (
                <button
                  onClick={() => handleDeletePackageById(selectedPackageId, pkgName)}
                  disabled={isSubmitting}
                  className="glass-button px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  title="حذف هذه الباقة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Package Form */}
          <div className="glass-card p-4 space-y-4 border border-[#FF7A1A]/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-[#FF7A1A] flex items-center gap-1.5">
                <PkgIcon className="w-4 h-4" /> {selectedPackageId === 'new' ? 'إضافة باقة أساسية جديدة' : `تعديل باقة: ${pkgName}`}
              </h3>
              <span className="text-[10px] bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold px-2 py-0.5 rounded-full">
                باقة دائمة
              </span>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">اسم الباقة *</label>
              <input
                type="text"
                placeholder="مثال: الباقة الأساسية للمحلات والسوبر ماركت"
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">النظام الرئيسي المطبق</label>
                <select
                  value={pkgSystem}
                  onChange={(e) => {
                    const newSys = e.target.value as SystemType;
                    setPkgSystem(newSys);
                    const cats = getCategoriesForSystem(newSys);
                    if (cats && cats.length > 0) setPkgCategory(cats[0]);
                  }}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="محلات">محلات</option>
                  <option value="شركات">شركات</option>
                  <option value="صالات جيم">صالات جيم</option>
                  <option value="برامج">برامج</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">القسم الفرعي / المجال</label>
                <select
                  value={pkgCategory}
                  onChange={(e) => setPkgCategory(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  {getCategoriesForSystem(pkgSystem).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">مكونات وميزات الباقة</span>
                <span className="text-[10px] text-gray-400">حدد الميزات المضمنة بالعلامة</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {pkgFeatures.map((feat, idx) => (
                  <label
                    key={idx}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      feat.enabled
                        ? 'bg-[#FF7A1A]/15 border-[#FF7A1A]/50 text-white font-semibold'
                        : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={feat.enabled}
                      onChange={() => togglePkgFeature(idx)}
                      className="w-4 h-4 accent-[#FF7A1A] rounded"
                    />
                    <span className="truncate">{feat.name}</span>
                  </label>
                ))}
              </div>

              {/* Add Custom Feature */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="+ إضافة ميزة جديدة مخصصة..."
                  value={customPkgFeature}
                  onChange={(e) => setCustomPkgFeature(e.target.value)}
                  className="glass-input flex-1 p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomPkgFeature}
                  className="btn-orange px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة
                </button>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">السعر الأساسي (ج.م)</label>
                  <input
                    type="number"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">قيمة الخصم (ج.م)</label>
                  <input
                    type="number"
                    value={pkgDiscount}
                    onChange={(e) => setPkgDiscount(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs text-center font-bold text-red-400"
                  />
                </div>
              </div>

              {/* Final Price Box */}
              <div className="glass-card p-3 bg-gradient-to-r from-[#FF7A1A]/20 to-orange-600/20 border border-[#FF7A1A]/50 text-center rounded-xl">
                <span className="text-[11px] text-gray-300 block">السعر النهائي للباقة</span>
                <div className="flex items-center justify-center gap-2">
                  {pkgDiscount > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {pkgPrice.toLocaleString('ar-EG')} ج.م
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-[#FF7A1A]">
                    {pkgFinalPrice.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSavePackage}
                className="btn-orange w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {selectedPackageId === 'new' ? 'إضافة الباقة وحفظها في Firestore' : 'حفظ التعديلات على الباقة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. MANAGE OFFERS TAB ---------------- */}
      {activeTab === 'manage_offers' && (
        <div className="space-y-4">
          {/* Select offer dropdown */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200">إدارة العروض المحدودة لفترة</label>
              <button
                type="button"
                onClick={() => setSelectedOfferId('new')}
                className="text-[11px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة عرض جديد
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                className="glass-input flex-1 p-2.5 text-xs font-semibold"
              >
                <option value="new">+ إنشاء عرض جديد لفترة محدودة</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    🏷️ {o.name} - ({o.system} / {o.category}) - {o.finalPrice} ج.م
                  </option>
                ))}
              </select>

              {selectedOfferId !== 'new' && (
                <button
                  onClick={() => handleDeleteOfferById(selectedOfferId, offerName)}
                  disabled={isSubmitting}
                  className="glass-button px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  title="حذف هذا العرض"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Offer Form */}
          <div className="glass-card p-4 space-y-4 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> {selectedOfferId === 'new' ? 'إضافة عرض جديد لفترة محدودة' : `تعديل عرض: ${offerName}`}
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                عرض لفترة
              </span>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">اسم العرض *</label>
              <input
                type="text"
                placeholder="مثال: عرض انطلاقة السوبر ماركت - خصم الشتاء"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">النظام الرئيسي</label>
                <select
                  value={offerSystem}
                  onChange={(e) => {
                    const newSys = e.target.value as SystemType;
                    setOfferSystem(newSys);
                    const cats = getCategoriesForSystem(newSys);
                    if (cats && cats.length > 0) setOfferCategory(cats[0]);
                  }}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="محلات">محلات</option>
                  <option value="شركات">شركات</option>
                  <option value="صالات جيم">صالات جيم</option>
                  <option value="برامج">برامج</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">القسم الفرعي / المجال</label>
                <select
                  value={offerCategory}
                  onChange={(e) => setOfferCategory(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  {getCategoriesForSystem(offerSystem).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Offer Duration & Presets */}
            <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/10">
              <label className="text-[11px] font-bold text-amber-300 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> تحديد مدة العرض / الاشتراك التلقائي
              </label>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setOfferDurationValue(30);
                    setOfferDurationUnit('أيام');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    offerDurationValue === 30 && offerDurationUnit === 'أيام'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  📅 30 يوم
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfferDurationValue(1);
                    setOfferDurationUnit('أشهر');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    offerDurationValue === 1 && offerDurationUnit === 'أشهر'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  🗓️ شهر واحد
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOfferDurationValue(1);
                    setOfferDurationUnit('سنوات');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    offerDurationValue === 1 && offerDurationUnit === 'سنوات'
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  📆 سنة واحدة
                </button>
              </div>

              {/* Manual Digital Duration Inputs */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">المدة الرقمية</label>
                  <input
                    type="number"
                    min={1}
                    value={offerDurationValue}
                    onChange={(e) => setOfferDurationValue(parseInt(e.target.value) || 1)}
                    className="glass-input w-full p-2 text-xs font-bold text-center text-amber-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">وحدة التجديد والانتهاء</label>
                  <select
                    value={offerDurationUnit}
                    onChange={(e) => setOfferDurationUnit(e.target.value as OfferDurationUnit)}
                    className="glass-input w-full p-2 text-xs font-bold"
                  >
                    <option value="أيام">أيام (تلقائي)</option>
                    <option value="أشهر">أشهر (اشتراك شهري)</option>
                    <option value="سنوات">سنوات (اشتراك سنوي)</option>
                  </select>
                </div>
              </div>

              {/* Duration Auto Summary */}
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 font-medium flex items-center justify-between">
                <span>المدة المحددة للخدمة والاشتراك:</span>
                <span className="font-black text-amber-300">
                  {offerDurationValue} {offerDurationUnit}
                </span>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">ميزات ومحتويات العرض</span>
                <span className="text-[10px] text-gray-400">حدد الخدمات المتاحة بالعرض</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {offerFeatures.map((feat, idx) => (
                  <label
                    key={idx}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      feat.enabled
                        ? 'bg-amber-500/20 border-amber-500/50 text-white font-semibold'
                        : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={feat.enabled}
                      onChange={() => toggleOfferFeature(idx)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="truncate">{feat.name}</span>
                  </label>
                ))}
              </div>

              {/* Add Custom Feature */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="+ إضافة ميزة مخصصة للعرض..."
                  value={customOfferFeature}
                  onChange={(e) => setCustomOfferFeature(e.target.value)}
                  className="glass-input flex-1 p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomOfferFeature}
                  className="btn-orange px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة
                </button>
              </div>
            </div>

            {/* Offer Pricing & Badge */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">السعر الأصلي (ج.م)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">قيمة الخصم (ج.م)</label>
                  <input
                    type="number"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs text-center font-bold text-red-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">نص الشارة الترويجية (Badge)</label>
                <input
                  type="text"
                  placeholder="مثال: خصم خاص 20% - لفترة محدودة"
                  value={offerBadgeText}
                  onChange={(e) => setOfferBadgeText(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs"
                />
              </div>

              {/* Final price display */}
              <div className="glass-card p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-center rounded-xl">
                <span className="text-[11px] text-gray-300 block">السعر النهائي للعرض المحدود</span>
                <div className="flex items-center justify-center gap-2">
                  {offerDiscount > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {offerPrice.toLocaleString('ar-EG')} ج.م
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-amber-400">
                    {offerFinalPrice.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                  </span>
                </div>
              </div>

              {/* Save Offer Action */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveOffer}
                className="btn-orange w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {selectedOfferId === 'new' ? 'إضافة العرض وحفظه في Firestore' : 'حفظ التعديلات على العرض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. MANAGE PROJECTS TAB ---------------- */}
      {activeTab === 'manage_projects' && (
        <div className="space-y-4">
          {/* Select project dropdown */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200">إدارة معرض المشاريع والنماذج الحية</label>
              <button
                type="button"
                onClick={() => setSelectedProjectId('new')}
                className="text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة مشروع جديد
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="glass-input flex-1 p-2.5 text-xs font-semibold"
              >
                <option value="new">+ إضافة مشروع / نموذج ديمو حي جديد للمعرض</option>
                {projects.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.isDemo ? '🧪 [ديمو - الجمهور افتراضي]' : '🌐 [مشروع حقيقي]'} {pr.title} ({pr.system} / {pr.category})
                  </option>
                ))}
              </select>

              {selectedProjectId !== 'new' && (
                <button
                  onClick={() => handleDeleteProjectById(selectedProjectId, projectTitle)}
                  disabled={isSubmitting}
                  className="glass-button px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  title="حذف هذا المشروع"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Project Form */}
          <div className="glass-card p-4 space-y-4 border border-emerald-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-emerald-400" /> {selectedProjectId === 'new' ? 'إضافة مشروع جديد للمعرض' : `تعديل مشروع: ${projectTitle}`}
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                نماذج الأعمال
              </span>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">اسم/عنوان المشروع أو الديمو *</label>
              <input
                type="text"
                placeholder="مثال: نظام كاشير وإدارة سوبر ماركت البركة"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-semibold"
              />
            </div>

            {/* Type classification selector: Real Project vs Demo */}
            <div className="bg-black/30 p-3 rounded-2xl border border-white/10 space-y-2">
              <label className="text-[11px] text-gray-200 block font-bold">تصنيف ونوع الرابط:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProjectIsDemo(false);
                    if (projectClientName === 'الجمهور افتراضي') {
                      setProjectClientName('');
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    !projectIsDemo
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 مشروع حي لعميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProjectIsDemo(true);
                    if (!projectClientName.trim()) {
                      setProjectClientName('الجمهور افتراضي');
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    projectIsDemo
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5 text-purple-300" />
                  <span>🧪 ديمو (الجمهور افتراضي)</span>
                </button>
              </div>
            </div>

            {/* Primary Project Links & Credentials (URL + Email) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-black/20 p-3.5 rounded-2xl border border-white/10">
              {/* Project URL Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-emerald-300 block flex items-center gap-1 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> رابط المشروع المباشر (URL) *
                </label>
                <input
                  type="text"
                  placeholder="https://albaraka-pos.example.com"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-mono text-emerald-300 dir-ltr text-left"
                />
              </div>

              {/* Project Email Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-blue-300 block flex items-center gap-1 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> البريد الإلكتروني للمشروع / إيميل الحساب
                </label>
                <input
                  type="email"
                  placeholder="مثال: project-admin@example.com"
                  value={projectClientEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectClientEmail(val);
                    if (val.trim().length > 0) {
                      setProjectHasRegisteredEmail(true);
                    }
                  }}
                  className="glass-input w-full p-2.5 text-xs font-mono text-blue-200 dir-ltr text-left"
                />
              </div>

              {/* Email Registration Checkbox Banner */}
              <div className="md:col-span-2 flex items-center justify-between bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/20 shadow-inner">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-200 select-none font-medium">
                  <input
                    type="checkbox"
                    checked={projectHasRegisteredEmail || !!projectClientEmail.trim()}
                    onChange={(e) => setProjectHasRegisteredEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-400 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                  />
                  <span>تأكيد التسجيل ببريد إلكتروني للحساب</span>
                </label>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-all ${
                    projectHasRegisteredEmail || !!projectClientEmail.trim()
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {projectHasRegisteredEmail || !!projectClientEmail.trim()
                    ? '✓ متسجل ببريد إلكتروني'
                    : 'غير متسجل ببريد'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">النظام المطبق</label>
                <select
                  value={projectSystem}
                  onChange={(e) => {
                    const newSys = e.target.value as SystemType;
                    setProjectSystem(newSys);
                    const cats = getCategoriesForSystem(newSys);
                    if (cats && cats.length > 0) setProjectCategory(cats[0]);
                  }}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  <option value="محلات">محلات</option>
                  <option value="شركات">شركات</option>
                  <option value="صالات جيم">صالات جيم</option>
                  <option value="برامج">برامج</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">القسم الفرعي / المجال</label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                >
                  {getCategoriesForSystem(projectSystem).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">
                {projectIsDemo ? 'اسم الجمهور أو الفئة المستهدفة (تلقائي: الجمهور افتراضي)' : 'اسم العميل أو الجهة (اختياري)'}
              </label>
              <input
                type="text"
                placeholder={projectIsDemo ? 'الجمهور افتراضي' : 'مثال: محمود أحمد - سوبر ماركت البركة'}
                value={projectClientName}
                onChange={(e) => setProjectClientName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">وصف أو تفاصيل المشروع (اختياري)</label>
              <textarea
                rows={3}
                placeholder="مثال: نظام كاشير متكامل يحتوي على قارئ باركود وطباعة فواتير حرارية وإدارة مخازن."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>

            {/* Financials, Pricing Model & Payment Milestones */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-[#FF7A1A] flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> نظام البيع والدفعات المالية والمرحلية
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-semibold">نظام التسعير / الدفع</label>
                  <select
                    value={projectPricingModel}
                    onChange={(e) => setProjectPricingModel(e.target.value as PricingModel)}
                    className="glass-input w-full p-2.5 text-xs font-bold text-amber-300"
                  >
                    <option value="full_sale">💰 بيع كامل (شراء مباشر)</option>
                    <option value="monthly_subscription">📅 اشتراك شهري</option>
                    <option value="yearly_subscription">📆 اشتراك سنوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-semibold">إجمالي قيمة العقد (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={projectTotalPrice || ''}
                    onChange={(e) => setProjectTotalPrice(Number(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs font-bold text-emerald-300 text-left dir-ltr"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-semibold">المبلغ المدفوع (مقدم/عربون) (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={projectPaidAmount || ''}
                    onChange={(e) => setProjectPaidAmount(Number(e.target.value) || 0)}
                    className="glass-input w-full p-2.5 text-xs font-bold text-blue-300 text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Status & Debt Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">حالة الدفع الحالية:</span>
                  <span
                    className={`font-extrabold px-2.5 py-0.5 rounded-md text-[10px] border ${
                      projectPaidAmount >= projectTotalPrice && projectTotalPrice > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : projectPaidAmount > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {projectPaidAmount >= projectTotalPrice && projectTotalPrice > 0
                      ? '✓ دفع كامل'
                      : projectPaidAmount > 0
                      ? '⏳ دفع جزئي (عربون)'
                      : '❌ لم يدفع'}
                  </span>

                  <span className="text-[11px] text-gray-400 border-r border-white/10 pr-2 mr-2">مرحلة العمل:</span>
                  <span
                    className={`font-extrabold px-2.5 py-0.5 rounded-md text-[10px] border ${
                      projectPaidAmount >= projectTotalPrice && projectTotalPrice > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {projectPaidAmount >= projectTotalPrice && projectTotalPrice > 0
                      ? '🎉 مكتمل ومكتمل التسليم'
                      : '⚙️ تحت الإنشاء وجاري العمل'}
                  </span>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-gray-400">المتبقي الآجل: </span>
                  <span className="font-extrabold text-red-400">
                    {Math.max(0, projectTotalPrice - projectPaidAmount).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Team Members Assignment & Commissions (تكوين وربط الشغل) */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" /> ربط الشغل وفريق العمل (المهندس والميديا مان والنسب)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Engineer Selector */}
                <div className="space-y-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <label className="text-[11px] text-gray-300 block font-semibold flex items-center gap-1">
                    💻 المهندس / المطور المسند له المشروع
                  </label>
                  <select
                    value={projectAssignedEngineerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setProjectAssignedEngineerId(id);
                      const member = teamMembers.find((m) => m.id === id);
                      if (member) {
                        setProjectAssignedEngineerName(member.name);
                        setProjectEngineerCommissionRate(member.defaultCommissionRate || 30);
                      }
                    }}
                    className="glass-input w-full p-2 text-xs font-medium"
                  >
                    <option value="">-- اختار مهندس من الفريق --</option>
                    {teamMembers
                      .filter((m) => m.position === 'engineer' || m.position === 'owner' || m.position === 'custom')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({POSITION_LABELS[m.position]})
                        </option>
                      ))}
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-400">نسبة عمولة المهندس %:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectEngineerCommissionRate}
                      onChange={(e) => setProjectEngineerCommissionRate(Number(e.target.value) || 0)}
                      className="glass-input w-20 p-1 text-xs text-center font-bold text-[#FF7A1A]"
                    />
                  </div>
                </div>

                {/* Media Buyer Selector */}
                <div className="space-y-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <label className="text-[11px] text-gray-300 block font-semibold flex items-center gap-1">
                    📢 مسئول التسويق والميديا (Media Buyer)
                  </label>
                  <select
                    value={projectAssignedMediaBuyerId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setProjectAssignedMediaBuyerId(id);
                      const member = teamMembers.find((m) => m.id === id);
                      if (member) {
                        setProjectAssignedMediaBuyerName(member.name);
                        setProjectMediaBuyerCommissionRate(member.defaultCommissionRate || 20);
                      }
                    }}
                    className="glass-input w-full p-2 text-xs font-medium"
                  >
                    <option value="">-- اختار ميديا مان من الفريق --</option>
                    {teamMembers
                      .filter((m) => m.position === 'media_buyer' || m.position === 'custom')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({POSITION_LABELS[m.position]})
                        </option>
                      ))}
                  </select>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-400">نسبة عمولة الميديا مان %:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectMediaBuyerCommissionRate}
                      onChange={(e) => setProjectMediaBuyerCommissionRate(Number(e.target.value) || 0)}
                      className="glass-input w-20 p-1 text-xs text-center font-bold text-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Commission & Engineer Mode */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-purple-300 font-bold">👑 نسبة صاحب المشروع بالمجمل %:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={projectOwnerCommissionRate}
                    onChange={(e) => setProjectOwnerCommissionRate(Number(e.target.value) || 0)}
                    className="glass-input w-20 p-1 text-xs text-center font-bold text-purple-300"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-purple-200 select-none font-semibold">
                  <input
                    type="checkbox"
                    checked={projectOwnerIsEngineer}
                    onChange={(e) => setProjectOwnerIsEngineer(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <span>صاحب المشروع يشارك أيضاً كـ مهندس مبرمج</span>
                </label>
              </div>
            </div>

            {/* Save Project Action */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveProject}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{selectedProjectId === 'new' ? 'إضافة المشروع للمعرض وتخزينه بـ Firestore' : 'حفظ التعديلات على المشروع'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 5. ACCOUNT SETTINGS & INSTALL APP TAB ---------------- */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          {/* Change Account Credentials Form */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 border-b border-white/10 pb-2">
              <User className="w-4 h-4" /> إعدادات حساب تسجيل الدخول
            </h3>

            <form onSubmit={handleUpdateAccount} className="space-y-3">
              {accountSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-bold">
                  {accountSuccessMsg}
                </div>
              )}

              {accountErrorMsg && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs text-center font-bold">
                  {accountErrorMsg}
                </div>
              )}

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">اسم المستخدم الحالي</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">كلمة المرور الحالية *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="كلمة المرور الحالية لتأكيد التغيير"
                  className="glass-input w-full p-2.5 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="جديدة (اختياري)"
                    className="glass-input w-full p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد الجديدة"
                    className="glass-input w-full p-2.5 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات الحساب وكلمة المرور</span>
              </button>
            </form>
          </div>

          {/* Install Application Section */}
          <div className="glass-card p-4 space-y-3 border border-amber-500/30">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق على الجهاز (Install App PWA)</span>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              يمكنك تحويل هذا النظام إلى تطبيق محمول أو مكتبي يعمل بملء الشاشة، مما يسهل العمل بدون شريط متصفح وبسرعة أعلى!
            </p>

            <button
              type="button"
              onClick={onInstallApp}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>تثبيت التطبيق الآن على الشاشة الرئيسية</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="glass-card p-4 border border-red-500/30 text-center space-y-2">
            <h4 className="text-xs font-bold text-red-400">تسجيل الخروج من الحساب</h4>
            <p className="text-[11px] text-gray-400">عند تسجيل الخروج سيتطلب إدخال اسم المستخدم وكلمة المرور للوصول مجدداً</p>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Protected Developer Delete Confirmation Modal */}
      <ProtectedDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        itemDescription={deleteModalState.itemDescription}
        onConfirmDelete={deleteModalState.onConfirm}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
