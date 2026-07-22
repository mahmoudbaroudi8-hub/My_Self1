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
  CheckSquare
} from 'lucide-react';
import {
  Package,
  Offer,
  ProjectItem,
  PackageFeature,
  SystemType,
  CategoryType,
  OfferDurationUnit,
  getCategoriesForSystem
} from '../types';

interface PackagesScreenProps {
  packages: Package[];
  offers: Offer[];
  projects: ProjectItem[];
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
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'all' | 'packages' | 'offers' | 'projects'>('all');
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
  const [projectDescription, setProjectDescription] = useState('');

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
      setProjectDescription('');
    } else {
      const found = projects.find((pr) => pr.id === selectedProjectId);
      if (found) {
        setProjectTitle(found.title || '');
        setProjectSystem(found.system || 'محلات');
        setProjectCategory(found.category || 'سوبر ماركت');
        setProjectUrl(found.url || '');
        setProjectClientName(found.clientName || '');
        setProjectDescription(found.description || '');
      }
    }
  }, [selectedProjectId, projects]);

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
  const handleDeletePackageById = async (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف باقة "${name}"؟`)) {
      setIsSubmitting(true);
      try {
        await onDeletePackage(id);
        if (selectedPackageId === id) setSelectedPackageId('new');
        alert('تم حذف الباقة بنجاح.');
      } catch (err) {
        console.error('Error deleting package:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
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
  const handleDeleteOfferById = async (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف عرض "${name}"؟`)) {
      setIsSubmitting(true);
      try {
        await onDeleteOffer(id);
        if (selectedOfferId === id) setSelectedOfferId('new');
        alert('تم حذف العرض بنجاح.');
      } catch (err) {
        console.error('Error deleting offer:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
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

    setIsSubmitting(true);
    try {
      if (selectedProjectId === 'new') {
        await onAddProject({
          title: projectTitle.trim(),
          system: projectSystem,
          category: projectCategory,
          url: formattedUrl,
          clientName: projectClientName.trim() || undefined,
          description: projectDescription.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
        alert('تمت إضافة المشروع للمعرض بنجاح!');
      } else {
        await onUpdateProject(selectedProjectId, {
          title: projectTitle.trim(),
          system: projectSystem,
          category: projectCategory,
          url: formattedUrl,
          clientName: projectClientName.trim() || undefined,
          description: projectDescription.trim() || undefined,
        });
        alert('تم تحديث بيانات المشروع بنجاح!');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      alert('حدث خطأ أثناء حفظ المشروع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE PROJECT BY ID
  const handleDeleteProjectById = async (id: string, title: string) => {
    if (confirm(`هل أنت تأكد من حذف مشروع "${title}"؟`)) {
      setIsSubmitting(true);
      try {
        await onDeleteProject(id);
        if (selectedProjectId === id) setSelectedProjectId('new');
        alert('تم حذف المشروع بنجاح.');
      } catch (err) {
        console.error('Error deleting project:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
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
    return `🚀 *مشروع سابق / نموذج حي*\n` +
      `📌 *${prj.title}*\n` +
      `🏢 النظام: ${prj.system} | المجال: ${prj.category}\n` +
      (prj.clientName ? `👤 العميل / المكان: ${prj.clientName}\n` : '') +
      (prj.description ? `📝 التفاصيل: ${prj.description}\n` : '') +
      `🔗 *رابط المعاينة المباشر:*\n${prj.url}\n\n` +
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
    if (catalogSystemFilter !== 'الكل' && prj.system !== catalogSystemFilter) return false;
    if (catalogCategoryFilter !== 'الكل' && prj.category !== catalogCategoryFilter) return false;
    if (query) {
      const matchTitle = (prj.title || '').toLowerCase().includes(query);
      const matchClient = (prj.clientName || '').toLowerCase().includes(query); // اسم المحل / العميل
      const matchDesc = (prj.description || '').toLowerCase().includes(query);
      const matchUrl = (prj.url || '').toLowerCase().includes(query);
      const matchSys = (prj.system || '').toLowerCase().includes(query);
      const matchCat = (prj.category || '').toLowerCase().includes(query);
      return matchTitle || matchClient || matchDesc || matchUrl || matchSys || matchCat;
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
      <div className="flex gap-1 p-1 bg-[#121C30]/90 rounded-2xl border border-white/10 text-[11px] font-bold overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
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
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
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
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
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
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
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
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'account'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>الحساب والتثبيت</span>
        </button>
      </div>

      {/* ---------------- 1. CATALOG TAB (ORGANIZED SECTIONS WITH FILTER) ---------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* CATALOG FILTER CONTROL BOX */}
          <div className="glass-card p-3.5 space-y-3 border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#FF7A1A]" /> تصفية الكتالوج والبحث
              </span>
              {(catalogSystemFilter !== 'الكل' || catalogCategoryFilter !== 'الكل' || catalogTypeFilter !== 'all' || catalogSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSystemFilter('الكل');
                    setCatalogCategoryFilter('الكل');
                    setCatalogTypeFilter('all');
                    setCatalogSearchQuery('');
                  }}
                  className="text-[10px] text-amber-400 hover:underline font-bold"
                >
                  إعادة ضبط الفلترة
                </button>
              )}
            </div>

            {/* Catalog Search Input Field */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث باسم الباقة، العرض، اسم المحل / العميل، أو رابط المشروع..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="glass-input w-full pr-9 pl-3 py-2 text-xs"
              />
            </div>

            {/* System Filter Chips */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-medium block">النظام الرئيسي:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['الكل', 'محلات', 'شركات', 'صالات جيم', 'برامج', 'أخرى'].map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setCatalogSystemFilter(sys)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      catalogSystemFilter === sys
                        ? 'bg-[#FF7A1A] text-white font-bold shadow-md shadow-[#FF7A1A]/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-[10px] text-gray-400 font-medium block">القسم الفرعي / المجال:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(catalogSystemFilter !== 'الكل'
                  ? ['الكل', ...getCategoriesForSystem(catalogSystemFilter as SystemType)]
                  : ['الكل', 'سوبر ماركت', 'عقارات', 'مقاولات', 'سياحة', 'استثمار', 'أدوية', 'صيدلية', 'ملابس', 'مطعم', 'صالة صغيرة', 'عادية', 'فوق المتوسط', 'كبيرة', 'تطبيق إداري', 'برنامج إداري', 'نظام شخصي', 'ورش', 'عيادات', 'مصانع', 'خدمات', 'أخرى']
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      catalogCategoryFilter === cat
                        ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter Buttons */}
            <div className="grid grid-cols-4 p-1 bg-black/30 rounded-xl text-[11px] font-semibold border border-white/5 gap-0.5">
              <button
                type="button"
                onClick={() => setCatalogTypeFilter('all')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  catalogTypeFilter === 'all' ? 'bg-[#FF7A1A] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                الكل ({filteredCatalogPackages.length + filteredCatalogOffers.length + filteredCatalogProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogTypeFilter('packages')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  catalogTypeFilter === 'packages' ? 'bg-[#FF7A1A] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                الباقات ({filteredCatalogPackages.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogTypeFilter('offers')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  catalogTypeFilter === 'offers' ? 'bg-amber-500 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                العروض ({filteredCatalogOffers.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogTypeFilter('projects')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  catalogTypeFilter === 'projects' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                المشاريع ({filteredCatalogProjects.length})
              </button>
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

                        {prj.description && (
                          <p className="text-[11px] text-gray-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                            {prj.description}
                          </p>
                        )}

                        {/* Direct URL Display Box */}
                        <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-200 truncate dir-ltr font-mono max-w-[220px]">
                            {prj.url}
                          </span>
                        </div>

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

            {/* Offer Duration */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">مدة العرض الرقمية</label>
                <input
                  type="number"
                  min={1}
                  value={offerDurationValue}
                  onChange={(e) => setOfferDurationValue(parseInt(e.target.value) || 1)}
                  className="glass-input w-full p-2.5 text-xs font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">وحدة مدة العرض</label>
                <select
                  value={offerDurationUnit}
                  onChange={(e) => setOfferDurationUnit(e.target.value as OfferDurationUnit)}
                  className="glass-input w-full p-2.5 text-xs"
                >
                  <option value="أيام">أيام</option>
                  <option value="أشهر">أشهر</option>
                  <option value="سنوات">سنوات</option>
                </select>
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
                <option value="new">+ إضافة مشروع / نموذج حي جديد للمعرض</option>
                {projects.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    🌐 {pr.title} ({pr.system} / {pr.category})
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
              <label className="text-[11px] text-gray-300 mb-1 block">اسم/عنوان المشروع *</label>
              <input
                type="text"
                placeholder="مثال: نظام كاشير وإدارة سوبر ماركت البركة"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-emerald-300 mb-1 block flex items-center gap-1">
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
              <label className="text-[11px] text-gray-300 mb-1 block">اسم العميل أو الجهة (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: محمود أحمد - سوبر ماركت البركة"
                value={projectClientName}
                onChange={(e) => setProjectClientName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
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
    </div>
  );
};
