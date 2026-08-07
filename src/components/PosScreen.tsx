import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Package as PkgIcon,
  HardDrive,
  MapPin,
  Check,
  Send,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Store,
  Tag,
  Clock,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { Accordion } from './Accordion';
import { Client, Package, Offer, Sale, SystemType, CategoryType, DeviceItem, VisitItem, ScreenView, ItemType, getCategoriesForSystem, TeamMember, POSITION_LABELS, EmployeeCommissionItem, Lead } from '../types';
import { shareInvoicePdf } from '../lib/pdfInvoice';
import { checkPhoneDuplicate } from '../lib/phoneCheck';
import { DuplicatePhoneAlert } from './DuplicatePhoneAlert';
import { RecordDetailsModal } from './RecordDetailsModal';

interface PosScreenProps {
  clients: Client[];
  leads?: Lead[];
  packages: Package[];
  offers: Offer[];
  teamMembers?: TeamMember[];
  editingSale?: Sale | null;
  prefilledLead?: Lead | null;
  onConfirmLeadDone?: (leadId: string) => Promise<void>;
  onSaveSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  onUpdateSale?: (id: string, sale: Partial<Sale>) => Promise<void>;
  onAddClient?: (client: Omit<Client, 'id'>) => Promise<string>;
  onUpdateClient?: (id: string, data: Partial<Client>) => Promise<void>;
  onUpdateLead?: (id: string, data: Partial<Lead>) => Promise<void>;
  onCancelEdit?: () => void;
  onNavigate: (screen: ScreenView) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  clients,
  leads = [],
  packages,
  offers,
  teamMembers = [],
  editingSale,
  prefilledLead,
  onConfirmLeadDone,
  onSaveSale,
  onUpdateSale,
  onAddClient,
  onUpdateClient,
  onUpdateLead,
  onCancelEdit,
  onNavigate,
}) => {
  // Form State
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('محلات');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('سوبر ماركت');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [shopName, setShopName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [projectUrl, setProjectUrl] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(today);
  const [deliveryDate, setDeliveryDate] = useState<string>(today);
  const [nextVisitDate, setNextVisitDate] = useState<string>('');

  // Subscription Item Type: Package vs Offer
  const [itemType, setItemType] = useState<ItemType>('package');

  // Package state
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [packagePrice, setPackagePrice] = useState<number>(0);

  // Offer state
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [offerDuration, setOfferDuration] = useState<string>('');

  // Devices state
  const [devices, setDevices] = useState<DeviceItem[]>([
    { name: 'جهاز كاشير لمس متكامل', price: 8500, enabled: false },
    { name: 'شاشة لمس إضافية للعميل', price: 3500, enabled: false },
    { name: 'طابعة فواتير حرارية 80mm', price: 1800, enabled: false },
    { name: 'قارئ باركود ليزري أوتوماتيك', price: 1200, enabled: false },
    { name: 'درج نقدية حديدي 5 خانات', price: 950, enabled: false },
    { name: 'طابعة باركود ملصقات حرارية', price: 2800, enabled: false },
    { name: 'طقم ماوس وكيبورد لاسلكي', price: 450, enabled: false },
  ]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePrice, setNewDevicePrice] = useState('');

  // Visits state
  const [visits, setVisits] = useState<VisitItem[]>([
    { type: 'زيارة تركيب وتدريب الموقع', price: 500, enabled: false },
    { type: 'زيارة دعم فني ومتابعة ميدانية', price: 300, enabled: false },
    { type: 'زيارة صيانة وبرمجة الأجهزة', price: 400, enabled: false },
  ]);
  const [newVisitType, setNewVisitType] = useState('');
  const [newVisitPrice, setNewVisitPrice] = useState('');

  // Discount & Paid Amount
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Assigned Employees & Commission Rates State
  const [assignedEmployees, setAssignedEmployees] = useState<EmployeeCommissionItem[]>([]);
  const [isDismissedDuplicate, setIsDismissedDuplicate] = useState(false);

  const [modalRecordState, setModalRecordState] = useState<{
    isOpen: boolean;
    type: 'client' | 'lead' | null;
    record: Client | Lead | null;
  }>({ isOpen: false, type: null, record: null });

  const phoneDuplicate = useMemo(
    () => checkPhoneDuplicate(phone, clients, leads, undefined, selectedClientId || undefined),
    [phone, clients, leads, selectedClientId]
  );

  const handleSelectClientForPos = (targetClient: Client) => {
    setSelectedClientId(targetClient.id);
    setClientName(targetClient.name);
    setShopName(targetClient.shopName);
    setPhone(targetClient.phone);
    if (targetClient.system) setSelectedSystem(targetClient.system);
    if (targetClient.category) setSelectedCategory(targetClient.category);
    setIsDismissedDuplicate(true);
  };

  // Populating prefilledLead when passed from Leads confirm
  useEffect(() => {
    if (prefilledLead) {
      if (prefilledLead.name) setClientName(prefilledLead.name);
      if (prefilledLead.phone) setPhone(prefilledLead.phone);
      if (prefilledLead.system) setSelectedSystem(prefilledLead.system);
      if (prefilledLead.category) setSelectedCategory(prefilledLead.category);
    }
  }, [prefilledLead]);

  // Populating editingSale when passed
  useEffect(() => {
    if (editingSale) {
      if (editingSale.system) setSelectedSystem(editingSale.system);
      if (editingSale.category) setSelectedCategory(editingSale.category);
      if (editingSale.clientId) setSelectedClientId(editingSale.clientId);
      setClientName(editingSale.clientName || '');
      setShopName(editingSale.shopName || '');
      setPhone(editingSale.phone || '');
      setProjectUrl(editingSale.projectUrl || '');
      setDate(editingSale.date || today);
      setDeliveryDate(editingSale.deliveryDate || today);
      setNextVisitDate(editingSale.nextVisitDate || '');
      setItemType(editingSale.itemType || 'package');
      setSelectedPackageId(editingSale.packageId || '');
      setSelectedOfferId(editingSale.offerId || '');
      setPackageName(editingSale.packageName || '');
      setPackagePrice(editingSale.packagePrice || 0);
      setOfferDuration(editingSale.offerDuration || '');
      setDiscount(editingSale.discount || 0);
      setPaidAmount(editingSale.paidAmount || 0);

      // Populate assigned employees
      if (editingSale.employeeCommissions && editingSale.employeeCommissions.length > 0) {
        setAssignedEmployees(editingSale.employeeCommissions);
      } else if (editingSale.assignedEmployeeId) {
        setAssignedEmployees([
          {
            employeeId: editingSale.assignedEmployeeId,
            employeeName: editingSale.assignedEmployeeName || 'موظف مسؤول',
            commissionPercent: editingSale.employeeCommissionRate || 10,
            commissionAmount: ((editingSale.finalInvoice || 0) * (editingSale.employeeCommissionRate || 10)) / 100,
          },
        ]);
      }

      if (editingSale.devices && editingSale.devices.length > 0) {
        const defaultDevices = [
          { name: 'جهاز كاشير لمس متكامل', price: 8500, enabled: false },
          { name: 'شاشة لمس إضافية للعميل', price: 3500, enabled: false },
          { name: 'طابعة فواتير حرارية 80mm', price: 1800, enabled: false },
          { name: 'قارئ باركود ليزري أوتوماتيك', price: 1200, enabled: false },
          { name: 'درج نقدية حديدي 5 خانات', price: 950, enabled: false },
          { name: 'طابعة باركود ملصقات حرارية', price: 2800, enabled: false },
          { name: 'طقم ماوس وكيبورد لاسلكي', price: 450, enabled: false },
        ];
        const merged = defaultDevices.map((d) => {
          const match = editingSale.devices.find((sd) => sd.name === d.name);
          return match ? { ...d, enabled: true, price: match.price } : d;
        });
        editingSale.devices.forEach((sd) => {
          if (!merged.some((m) => m.name === sd.name)) {
            merged.push({ ...sd, enabled: true });
          }
        });
        setDevices(merged);
      }

      if (editingSale.visits && editingSale.visits.length > 0) {
        const defaultVisits = [
          { type: 'زيارة تركيب وتدريب الموقع', price: 500, enabled: false },
          { type: 'زيارة دعم فني ومتابعة ميدانية', price: 300, enabled: false },
          { type: 'زيارة صيانة وبرمجة الأجهزة', price: 400, enabled: false },
        ];
        const merged = defaultVisits.map((v) => {
          const match = editingSale.visits.find((sv) => sv.type === v.type);
          return match ? { ...v, enabled: true, price: match.price } : v;
        });
        editingSale.visits.forEach((sv) => {
          if (!merged.some((m) => m.type === sv.type)) {
            merged.push({ ...sv, enabled: true });
          }
        });
        setVisits(merged);
      }
    }
  }, [editingSale]);

  // Filter packages based on selected system & category
  const filteredPackages = packages.filter(
    (p) => (!p.system || p.system === selectedSystem)
  );

  // Filter offers based on selected system & category
  const filteredOffers = offers.filter(
    (o) => (!o.system || o.system === selectedSystem)
  );

  // When client dropdown changes
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setShopName(found.shopName);
      setPhone(found.phone);
      if (found.system) setSelectedSystem(found.system);
      if (found.category) setSelectedCategory(found.category);
    } else {
      setClientName('');
      setShopName('');
      setPhone('');
    }
  };

  // When package dropdown changes
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    const found = packages.find((p) => p.id === packageId);
    if (found) {
      setPackageName(found.name);
      setPackagePrice(found.finalPrice || found.price || 0);
    } else {
      setPackageName('');
      setPackagePrice(0);
    }
  };

  // When offer dropdown changes
  const handleOfferSelect = (offerId: string) => {
    setSelectedOfferId(offerId);
    const found = offers.find((o) => o.id === offerId);
    if (found) {
      setPackageName(`[عرض] ${found.name}`);
      setPackagePrice(found.finalPrice || found.price || 0);
      setOfferDuration(`${found.durationValue} ${found.durationUnit}`);
    } else {
      setPackageName('');
      setPackagePrice(0);
      setOfferDuration('');
    }
  };

  // Toggle Device Checkbox
  const toggleDevice = (index: number) => {
    const updated = [...devices];
    updated[index].enabled = !updated[index].enabled;
    setDevices(updated);
  };

  // Update Device Price
  const updateDevicePrice = (index: number, val: number) => {
    const updated = [...devices];
    updated[index].price = val;
    setDevices(updated);
  };

  // Add Custom Device
  const handleAddCustomDevice = () => {
    if (!newDeviceName.trim()) return;
    const priceVal = parseFloat(newDevicePrice) || 0;
    setDevices([...devices, { name: newDeviceName.trim(), price: priceVal, enabled: true }]);
    setNewDeviceName('');
    setNewDevicePrice('');
  };

  // Toggle Visit Checkbox
  const toggleVisit = (index: number) => {
    const updated = [...visits];
    updated[index].enabled = !updated[index].enabled;
    setVisits(updated);
  };

  // Update Visit Price
  const updateVisitPrice = (index: number, val: number) => {
    const updated = [...visits];
    updated[index].price = val;
    setVisits(updated);
  };

  // Add Custom Visit
  const handleAddCustomVisit = () => {
    if (!newVisitType.trim()) return;
    const priceVal = parseFloat(newVisitPrice) || 0;
    setVisits([...visits, { type: newVisitType.trim(), price: priceVal, enabled: true }]);
    setNewVisitType('');
    setNewVisitPrice('');
  };

  // Calculations
  const devicesTotal = devices.reduce((sum, d) => sum + (d.enabled ? Number(d.price) || 0 : 0), 0);
  const visitsTotal = visits.reduce((sum, v) => sum + (v.enabled ? Number(v.price) || 0 : 0), 0);
  const subtotal = (Number(packagePrice) || 0) + devicesTotal + visitsTotal;
  const finalInvoice = Math.max(0, subtotal - (Number(discount) || 0));

  // Auto set paidAmount to finalInvoice if user hasn't explicitly edited paidAmount (and not editing)
  useEffect(() => {
    if (!editingSale) {
      setPaidAmount(finalInvoice);
    }
  }, [finalInvoice, editingSale]);

  const handleAddEmployeeToSale = (empId: string) => {
    if (!empId) return;
    const emp = teamMembers.find((m) => m.id === empId);
    if (!emp) return;

    if (assignedEmployees.some((item) => item.employeeId === emp.id)) {
      return;
    }

    const defaultRate = emp.defaultCommissionRate ?? 10;
    setAssignedEmployees([
      ...assignedEmployees,
      {
        employeeId: emp.id,
        employeeName: emp.name,
        position: emp.position,
        commissionPercent: defaultRate,
        commissionAmount: (finalInvoice * defaultRate) / 100,
      },
    ]);
  };

  const handleRemoveEmployeeFromSale = (empId: string) => {
    setAssignedEmployees(assignedEmployees.filter((item) => item.employeeId !== empId));
  };

  const handleUpdateEmployeeCommissionRate = (empId: string, rate: number) => {
    setAssignedEmployees(
      assignedEmployees.map((item) => {
        if (item.employeeId === empId) {
          return {
            ...item,
            commissionPercent: rate,
            commissionAmount: (finalInvoice * rate) / 100,
          };
        }
        return item;
      })
    );
  };

  const [savedSaleForSharing, setSavedSaleForSharing] = useState<Sale | null>(null);

  const resetForm = () => {
    setSelectedClientId('');
    setClientName('');
    setShopName('');
    setPhone('');
    setProjectUrl('');
    setDate(today);
    setDeliveryDate(today);
    setNextVisitDate('');
    setItemType('package');
    setSelectedPackageId('');
    setPackageName('');
    setPackagePrice(0);
    setSelectedOfferId('');
    setOfferDuration('');
    setDevices([
      { name: 'جهاز كاشير لمس متكامل', price: 8500, enabled: false },
      { name: 'شاشة لمس إضافية للعميل', price: 3500, enabled: false },
      { name: 'طابعة فواتير حرارية 80mm', price: 1800, enabled: false },
      { name: 'قارئ باركود ليزري أوتوماتيك', price: 1200, enabled: false },
      { name: 'درج نقدية حديدي 5 خانات', price: 950, enabled: false },
      { name: 'طابعة باركود ملصقات حرارية', price: 2800, enabled: false },
      { name: 'طقم ماوس وكيبورد لاسلكي', price: 450, enabled: false },
    ]);
    setVisits([
      { type: 'زيارة تركيب وتدريب الموقع', price: 500, enabled: false },
      { type: 'زيارة دعم فني ومتابعة ميدانية', price: 300, enabled: false },
      { type: 'زيارة صيانة وبرمجة الأجهزة', price: 400, enabled: false },
    ]);
    setDiscount(0);
    setPaidAmount(0);
    setAssignedEmployees([]);
    setIsDismissedDuplicate(false);
  };

  const handleSubmitSale = async (status: 'mowakad' | 'morsal_qabl_dafa') => {
    if (!shopName.trim() && !clientName.trim()) {
      alert('رجاءً أدخل اسم المحل/الشركة أو اسم العميل على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check or create client ID if not manually selected
      let effectiveClientId = selectedClientId || undefined;

      if (!effectiveClientId) {
        // First check if phone exists in existing clients list
        if (phoneDuplicate.isDuplicate && phoneDuplicate.matchType === 'client' && phoneDuplicate.matchedId) {
          effectiveClientId = phoneDuplicate.matchedId;
        } else if (onAddClient && (clientName.trim() || shopName.trim())) {
          // Auto-create new client in `clients` database
          const newClientId = await onAddClient({
            name: clientName.trim() || shopName.trim(),
            shopName: shopName.trim() || clientName.trim(),
            phone: phone.trim(),
            system: selectedSystem,
            category: selectedCategory,
            address: '',
          });
          if (newClientId) {
            effectiveClientId = newClientId;
          }
        }
      }

      const finalEmployeeCommissions = assignedEmployees.map((item) => ({
        ...item,
        commissionAmount: (finalInvoice * (Number(item.commissionPercent) || 0)) / 100,
      }));

      const saleData: Omit<Sale, 'id'> = {
        clientId: effectiveClientId,
        clientName: clientName || shopName,
        shopName: shopName || clientName,
        phone: phone || '',
        system: selectedSystem,
        category: selectedCategory,
        date: date || today,
        deliveryDate: deliveryDate || today,
        nextVisitDate: nextVisitDate.trim() || undefined,
        itemType,
        packageId: itemType === 'package' ? (selectedPackageId || undefined) : undefined,
        offerId: itemType === 'offer' ? (selectedOfferId || undefined) : undefined,
        packageName: packageName || (itemType === 'offer' ? 'عرض ترويجي' : 'بدون باقة محددة'),
        packagePrice: Number(packagePrice) || 0,
        offerDuration: itemType === 'offer' ? offerDuration : undefined,
        devices: devices.filter((d) => d.enabled),
        visits: visits.filter((v) => v.enabled),
        devicesTotal,
        visitsTotal,
        subtotal,
        discount: Number(discount) || 0,
        finalInvoice,
        paidAmount: Number(paidAmount) || 0,
        status,
        projectUrl: projectUrl.trim() || undefined,
        assignedEmployeeId: finalEmployeeCommissions[0]?.employeeId,
        assignedEmployeeName: finalEmployeeCommissions[0]?.employeeName,
        employeeCommissionRate: finalEmployeeCommissions[0]?.commissionPercent,
        employeeCommissions: finalEmployeeCommissions,
        createdAt: editingSale?.createdAt || new Date().toISOString(),
      };

      let currentSavedSale: Sale;
      if (editingSale && onUpdateSale) {
        await onUpdateSale(editingSale.id, saleData);
        currentSavedSale = { id: editingSale.id, ...saleData };
      } else {
        const dummyId = 'sale_' + Date.now();
        await onSaveSale(saleData);
        currentSavedSale = { id: dummyId, ...saleData };
      }

      setSavedSaleForSharing(currentSavedSale);

      if (prefilledLead && onConfirmLeadDone) {
        await onConfirmLeadDone(prefilledLead.id);
      }

      // Reset form fields so the POS screen is clean
      resetForm();

      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error saving sale:', err);
      alert('حدث خطأ أثناء حفظ عملية البيع. يرجى التأكد من الاتصال بالشبكة والمحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Top Banner */}
      <div className={`glass-card p-4 border ${editingSale ? 'bg-[#FF7A1A]/20 border-[#FF7A1A]' : 'bg-gradient-to-r from-[#FF7A1A]/20 to-amber-500/10 border-[#FF7A1A]/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {editingSale ? '📝 وضع تعديل عملية بيع سابقة' : 'تسجيل فاتورة بيع جديدة'}
            </h2>
            <p className="text-[11px] text-gray-300">
              {editingSale ? `تعديل البيانات للعميل: ${editingSale.clientName || editingSale.shopName}` : 'حدد البيانات والأجهزة والزيارات لاحتساب الإجمالي'}
            </p>
          </div>
          <div className="text-left flex items-center gap-3">
            <div>
              <span className="text-[10px] text-gray-400 block">إجمالي الفاتورة</span>
              <span className="text-xl font-extrabold text-[#FF7A1A]">
                {finalInvoice.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
              </span>
            </div>
            {editingSale && onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-200 border border-white/20"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Client & System Info Card */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-[#FF7A1A] flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> بيانات العميل والنظام
          </span>
          <button
            type="button"
            onClick={() => onNavigate('add-client')}
            className="text-[11px] text-[#FF7A1A] font-semibold hover:underline flex items-center gap-1"
          >
            + إضافة عميل جديد
          </button>
        </div>

        {/* System & Category selection */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">الأنظمة</label>
            <select
              value={selectedSystem}
              onChange={(e) => {
                const newSys = e.target.value as SystemType;
                setSelectedSystem(newSys);
                const cats = getCategoriesForSystem(newSys);
                if (cats && cats.length > 0) {
                  setSelectedCategory(cats[0]);
                }
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
            <label className="text-[11px] text-gray-300 mb-1 block">القسم الفرعي</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input w-full p-2.5 text-xs font-medium"
            >
              {getCategoriesForSystem(selectedSystem).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Choose Existing Client */}
        <div>
          <label className="text-[11px] text-gray-300 mb-1 block">اختر عميل مسجل</label>
          <select
            value={selectedClientId}
            onChange={(e) => handleClientSelect(e.target.value)}
            className="glass-input w-full p-2.5 text-xs"
          >
            <option value="">-- اختر من قائمة العملاء أو ادخل البيانات بالأسفل --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shopName} - {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Manual Shop Name & Client Name */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">اسم المحل / الشركة *</label>
            <input
              type="text"
              placeholder="مثال: سوبرماركت الفردوس"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="glass-input w-full p-2.5 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">اسم المالك / العميل</label>
            <input
              type="text"
              placeholder="مثال: أحمد مصطفى"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="glass-input w-full p-2.5 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">رقم الموبايل</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setIsDismissedDuplicate(false);
              }}
              className="glass-input w-full p-2.5 text-xs text-left"
              dir="ltr"
            />
            <DuplicatePhoneAlert
              phoneDuplicate={phoneDuplicate}
              clients={clients}
              leads={leads}
              isDismissed={isDismissedDuplicate}
              onContinueAnyway={() => setIsDismissedDuplicate(true)}
              onSelectClientForPos={handleSelectClientForPos}
              onViewEditRecord={(type, rec) => {
                setModalRecordState({
                  isOpen: true,
                  type,
                  record: rec,
                });
              }}
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-300 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>رابط مشروع العمل (اختياري)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="glass-input w-full p-2.5 text-xs text-left"
              dir="ltr"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="text-[11px] text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#FF7A1A]" /> تاريخ العملية
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full p-2.5 text-xs text-center"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> تاريخ التسليم
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="glass-input w-full p-2.5 text-xs text-center"
            />
          </div>
        </div>
      </div>

      {/* 2. Accordion: Package or Offer Selection */}
      <Accordion
        title={itemType === 'package' ? 'باقة النظام' : 'عرض ترويجي محدود'}
        icon={itemType === 'package' ? <PkgIcon className="w-4 h-4" /> : <Tag className="w-4 h-4 text-amber-400" />}
        badge={packageName ? (itemType === 'offer' && offerDuration ? `${packageName} (${offerDuration})` : packageName) : 'لم تحدد'}
        defaultOpen={true}
      >
        <div className="space-y-3 pt-2">
          {/* Toggle Type: Package vs Offer */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setItemType('package');
                setPackageName('');
                setPackagePrice(0);
                setSelectedPackageId('');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                itemType === 'package'
                  ? 'bg-[#FF7A1A] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PkgIcon className="w-3.5 h-3.5" />
              <span>باقة رئيسية</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setItemType('offer');
                setPackageName('');
                setPackagePrice(0);
                setSelectedOfferId('');
                setOfferDuration('');
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                itemType === 'offer'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>عرض محدود</span>
            </button>
          </div>

          {/* PACKAGE DROPDOWN */}
          {itemType === 'package' && (
            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">اختر من الباقات المتاحة ({selectedSystem})</label>
              <select
                value={selectedPackageId}
                onChange={(e) => handlePackageSelect(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              >
                <option value="">-- اختر باقة نظام --</option>
                {filteredPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - ({pkg.finalPrice} ج.م)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* OFFER DROPDOWN */}
          {itemType === 'offer' && (
            <div className="space-y-2">
              <label className="text-[11px] text-amber-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> اختر من العروض المحدودة المتاحة ({selectedSystem})
              </label>
              <select
                value={selectedOfferId}
                onChange={(e) => handleOfferSelect(e.target.value)}
                className="glass-input w-full p-2.5 text-xs border-amber-500/30"
              >
                <option value="">-- اختر عرض ترويجي --</option>
                {filteredOffers.map((off) => (
                  <option key={off.id} value={off.id}>
                    ⚡ {off.name} - (لمدة {off.durationValue} {off.durationUnit}) - ({off.finalPrice} ج.م)
                  </option>
                ))}
              </select>

              {offerDuration && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center justify-between">
                  <span>صلاحية العرض المحدد:</span>
                  <strong className="font-bold bg-amber-400/20 px-2 py-0.5 rounded">
                    {offerDuration}
                  </strong>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">سعر الباقة / العرض المعتمد (ج.م)</label>
            <input
              type="number"
              value={packagePrice}
              onChange={(e) => setPackagePrice(parseFloat(e.target.value) || 0)}
              className="glass-input w-full p-2.5 text-xs text-center font-bold text-[#FF7A1A]"
            />
          </div>
        </div>
      </Accordion>

      {/* 3. Accordion: Hardware Devices */}
      <Accordion
        title="الأجهزة والمستلزمات"
        icon={<HardDrive className="w-4 h-4" />}
        badge={`${devicesTotal.toLocaleString('ar-EG')} ج.م`}
        defaultOpen={true}
      >
        <div className="space-y-2.5 pt-2">
          {devices.map((device, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                device.enabled
                  ? 'bg-[#FF7A1A]/10 border-[#FF7A1A]/40'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={device.enabled}
                  onChange={() => toggleDevice(idx)}
                  className="w-4 h-4 accent-[#FF7A1A] rounded"
                />
                <span className={`text-xs font-medium ${device.enabled ? 'text-white' : 'text-gray-300'}`}>
                  {device.name}
                </span>
              </label>

              <div className="flex items-center gap-1.5 w-28">
                <input
                  type="number"
                  value={device.price}
                  onChange={(e) => updateDevicePrice(idx, parseFloat(e.target.value) || 0)}
                  disabled={!device.enabled}
                  className={`glass-input text-xs p-1.5 text-center w-full font-bold ${
                    device.enabled ? 'text-[#FF7A1A]' : 'opacity-50 text-gray-400'
                  }`}
                />
                <span className="text-[10px] text-gray-400">ج.م</span>
              </div>
            </div>
          ))}

          {/* Add custom device */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              placeholder="+ إضافة جهاز مخصص"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="glass-input flex-1 p-2 text-xs"
            />
            <input
              type="number"
              placeholder="السعر"
              value={newDevicePrice}
              onChange={(e) => setNewDevicePrice(e.target.value)}
              className="glass-input w-20 p-2 text-xs text-center"
            />
            <button
              type="button"
              onClick={handleAddCustomDevice}
              className="btn-orange px-3 py-2 rounded-xl text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة
            </button>
          </div>

          <div className="text-left text-xs font-bold text-gray-300 pt-1">
            إجمالي الأجهزة: <span className="text-[#FF7A1A]">{devicesTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </Accordion>

      {/* 4. Accordion: Visits & Training */}
      <Accordion
        title="زيارات والدعم الفني"
        icon={<MapPin className="w-4 h-4" />}
        badge={`${visitsTotal.toLocaleString('ar-EG')} ج.م`}
        defaultOpen={true}
      >
        <div className="space-y-2.5 pt-2">
          {visits.map((visit, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                visit.enabled
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={visit.enabled}
                  onChange={() => toggleVisit(idx)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className={`text-xs font-medium ${visit.enabled ? 'text-white' : 'text-gray-300'}`}>
                  {visit.type}
                </span>
              </label>

              <div className="flex items-center gap-1.5 w-28">
                <input
                  type="number"
                  value={visit.price}
                  onChange={(e) => updateVisitPrice(idx, parseFloat(e.target.value) || 0)}
                  disabled={!visit.enabled}
                  className={`glass-input text-xs p-1.5 text-center w-full font-bold ${
                    visit.enabled ? 'text-emerald-400' : 'opacity-50 text-gray-400'
                  }`}
                />
                <span className="text-[10px] text-gray-400">ج.م</span>
              </div>
            </div>
          ))}

          {/* Add custom visit */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              placeholder="+ إضافة نوع زيارة مخصص"
              value={newVisitType}
              onChange={(e) => setNewVisitType(e.target.value)}
              className="glass-input flex-1 p-2 text-xs"
            />
            <input
              type="number"
              placeholder="السعر"
              value={newVisitPrice}
              onChange={(e) => setNewVisitPrice(e.target.value)}
              className="glass-input w-20 p-2 text-xs text-center"
            />
            <button
              type="button"
              onClick={handleAddCustomVisit}
              className="btn-orange px-3 py-2 rounded-xl text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة
            </button>
          </div>

          {/* Next Visit Date Reminder */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <label className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> تاريخ الزيارة أو المتابعة القادمة (اختياري)
            </label>
            <input
              type="date"
              value={nextVisitDate}
              onChange={(e) => setNextVisitDate(e.target.value)}
              className="glass-input w-full p-2 text-xs font-medium text-emerald-300"
            />
          </div>

          <div className="text-left text-xs font-bold text-gray-300 pt-1">
            إجمالي الزيارات: <span className="text-emerald-400">{visitsTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </Accordion>

      {/* 4.5 Accordion: Employee Assignment & Commissions */}
      <Accordion
        title="إسناد الموظفين المباشر والعمولات"
        icon={<UserPlus className="w-4 h-4" />}
        badge={assignedEmployees.length > 0 ? `${assignedEmployees.length} موظف مُسند` : 'اختياري'}
        defaultOpen={assignedEmployees.length > 0}
      >
        <div className="space-y-3 pt-2">
          {/* Employee Selection Dropdown */}
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block font-semibold">
              اختر موظف لإسناد العملية وحساب عمولته:
            </label>
            <select
              onChange={(e) => {
                handleAddEmployeeToSale(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="glass-input w-full p-2.5 text-xs text-[#FF7A1A] font-bold"
            >
              <option value="" disabled>
                + اختر موظف من قائمة الفريق...
              </option>
              {teamMembers
                .filter((m) => m.isActive !== false)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({POSITION_LABELS[m.position] || m.position}) - العمولة الافتراضية: {m.defaultCommissionRate || 10}%
                  </option>
                ))}
            </select>
          </div>

          {/* Assigned Employees List Cards */}
          {assignedEmployees.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 block font-medium">الموظفون المسندون ونسب العمولات القابلة للتعديل:</span>
              {assignedEmployees.map((emp) => {
                const commAmount = (finalInvoice * (Number(emp.commissionPercent) || 0)) / 100;

                return (
                  <div
                    key={emp.employeeId}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A] font-bold text-xs">
                        👤
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{emp.employeeName}</div>
                        <span className="text-[10px] text-[#FF7A1A] font-medium">
                          {POSITION_LABELS[emp.position as any] || emp.position || 'موظف'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Commission Percentage Input */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-gray-400">نسبة العمولة %:</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={emp.commissionPercent}
                          onChange={(e) =>
                            handleUpdateEmployeeCommissionRate(emp.employeeId, parseFloat(e.target.value) || 0)
                          }
                          className="glass-input w-16 p-1.5 text-xs text-center font-bold text-[#FF7A1A]"
                        />
                      </div>

                      {/* Calculated Commission Amount Preview */}
                      <div className="text-left bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <span className="text-[9px] text-emerald-300 block">العمولة المستحقة</span>
                        <span className="text-xs font-black text-emerald-400">
                          {commAmount.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployeeFromSale(emp.employeeId)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                        title="إلغاء إسناد الموظف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">لم يتم إسناد أي موظف لهذه العملية بعد (يمكنك تركها بدون إسناد أو اختيار موظف).</p>
          )}
        </div>
      </Accordion>

      {/* 5. Summary & Actions Card */}
      <div className="glass-card p-4 space-y-3 bg-gradient-to-b from-[#121C30] to-[#0B1220] border-t-2 border-t-[#FF7A1A]">
        <h3 className="text-xs font-bold text-white border-b border-white/10 pb-2">ملخص وحساب الفاتورة النهائية</h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-300">
            <span>سعر باقة النظام:</span>
            <span className="font-semibold text-white">{packagePrice.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>إجمالي الأجهزة:</span>
            <span className="font-semibold text-white">{devicesTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>إجمالي الزيارات:</span>
            <span className="font-semibold text-white">{visitsTotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div className="flex justify-between text-gray-300 font-bold border-t border-white/10 pt-1">
            <span>المجموع قبل الخصم:</span>
            <span className="text-white">{subtotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>

        {/* Discount & Paid amount inputs */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">خصم مسموح به (ج.م)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="glass-input w-full p-2.5 text-xs text-center font-bold text-red-400"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-300 mb-1 block">المبلغ المدفوع (ج.م)</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="glass-input w-full p-2.5 text-xs text-center font-bold text-emerald-400"
            />
          </div>
        </div>

        {/* Final Invoice Display */}
        <div className="glass-card p-3 bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 text-center rounded-xl">
          <span className="text-xs text-gray-300 block mb-0.5">إجمالي الفاتورة النهائي</span>
          <div className="text-2xl font-extrabold text-[#FF7A1A]">
            {finalInvoice.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
          </div>
          {finalInvoice - paidAmount > 0 && (
            <span className="text-[11px] text-amber-400 font-semibold block mt-1">
              المتبقي دين للعميل: {(finalInvoice - paidAmount).toLocaleString('ar-EG')} ج.م
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          {/* Confirm Sale Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitSale('mowakad')}
            className="btn-orange w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" />
            {isSubmitting ? 'جاري الحفظ والتحديث...' : (editingSale ? 'تأكيد وحفظ التعديلات' : 'تأكيد العملية وتسجيل المبيعات')}
          </button>

          {/* Send Before Payment Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitSale('morsal_qabl_dafa')}
            className="glass-button w-full py-3 rounded-xl font-semibold text-xs text-gray-200 hover:text-white flex items-center justify-center gap-2 hover:bg-white/10 cursor-pointer active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 text-amber-400" />
            {editingSale ? 'حفظ التعديل كـ مسودة (قبل الدفع)' : 'إرسال قبل الدفع (حفظ كـ مسودة)'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 text-center space-y-4 border border-[#FF7A1A]">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">تم حفظ العملية بنجاح!</h3>
            <p className="text-xs text-gray-300">
              تم تسجيل العملية وتحديث الإحصائيات والإيرادات في قاعدة البيانات بنجاح.
            </p>

            {savedSaleForSharing && (
              <button
                type="button"
                onClick={async () => {
                  await shareInvoicePdf(savedSaleForSharing);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الفاتورة PDF عبر واتساب للعميل</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('sales');
                }}
                className="btn-orange flex-1 py-2.5 rounded-xl text-xs font-bold"
              >
                عرض سجل المبيعات
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('home');
                }}
                className="glass-button flex-1 py-2.5 rounded-xl text-xs text-gray-300"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={modalRecordState.isOpen}
        recordType={modalRecordState.type}
        record={modalRecordState.record}
        onClose={() => setModalRecordState({ isOpen: false, type: null, record: null })}
        onUpdateClient={onUpdateClient}
        onUpdateLead={onUpdateLead}
        onSelectClientForPos={handleSelectClientForPos}
      />
    </div>
  );
};
