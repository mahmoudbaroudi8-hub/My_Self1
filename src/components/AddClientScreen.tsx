import React, { useState, useMemo } from 'react';
import { UserPlus, Store, Phone, MapPin, Check, ChevronRight, AlertTriangle } from 'lucide-react';
import { Client, Lead, SystemType, CategoryType, ScreenView, getCategoriesForSystem } from '../types';
import { checkPhoneDuplicate } from '../lib/phoneCheck';
import { DuplicatePhoneAlert } from './DuplicatePhoneAlert';
import { RecordDetailsModal } from './RecordDetailsModal';

interface AddClientScreenProps {
  clients?: Client[];
  leads?: Lead[];
  onAddClient: (client: Omit<Client, 'id'>) => Promise<string>;
  onUpdateClient?: (id: string, data: Partial<Client>) => Promise<void>;
  onUpdateLead?: (id: string, data: Partial<Lead>) => Promise<void>;
  onNavigate: (screen: ScreenView) => void;
}

export const AddClientScreen: React.FC<AddClientScreenProps> = ({
  clients = [],
  leads = [],
  onAddClient,
  onUpdateClient,
  onUpdateLead,
  onNavigate,
}) => {
  const [system, setSystem] = useState<SystemType>('محلات');
  const [category, setCategory] = useState<CategoryType>('سوبر ماركت');
  const [shopName, setShopName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissedDuplicate, setIsDismissedDuplicate] = useState(false);

  const [modalRecordState, setModalRecordState] = useState<{
    isOpen: boolean;
    type: 'client' | 'lead' | null;
    record: Client | Lead | null;
  }>({ isOpen: false, type: null, record: null });

  const phoneDuplicate = useMemo(
    () => checkPhoneDuplicate(phone, clients, leads),
    [phone, clients, leads]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !name.trim()) {
      alert('رجاءً ادخل اسم المحل/الشركة واسم المالك/العميل.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddClient({
        name: name.trim(),
        shopName: shopName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        system,
        category,
        createdAt: new Date().toISOString(),
      });
      alert('تمت إضافة العميل بنجاح!');
      onNavigate('clients');
    } catch (err) {
      console.error('Error adding client:', err);
      alert('حدث خطأ أثناء حفظ بيانات العميل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Header card */}
      <div className="glass-card p-4 flex items-center justify-between border-b-2 border-b-[#FF7A1A]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">تسجيل عميل جديد</h2>
            <p className="text-[11px] text-gray-300">أدخل بيانات العميل والمحل لإضافته للقاعدة</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('clients')}
          className="glass-button px-3 py-1.5 text-xs text-gray-300 hover:text-white"
        >
          إلغاء
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3.5">
        {/* Systems selector */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1.5 block">القطاع / النظام</label>
          <div className="grid grid-cols-2 gap-2">
            {(['محلات', 'شركات', 'صالات جيم', 'أخرى'] as SystemType[]).map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => {
                  setSystem(sys);
                  const cats = getCategoriesForSystem(sys);
                  if (cats && cats.length > 0) setCategory(cats[0]);
                }}
                className={`py-2 px-2 text-xs rounded-xl border font-semibold transition-all ${
                  system === sys
                    ? 'bg-[#FF7A1A] text-white border-[#FF7A1A]'
                    : 'glass-button text-gray-300 border-white/10'
                }`}
              >
                {sys}
              </button>
            ))}

            {/* 'برامج' taking full width across both columns */}
            <button
              type="button"
              onClick={() => {
                setSystem('برامج');
                const cats = getCategoriesForSystem('برامج');
                if (cats && cats.length > 0) setCategory(cats[0]);
              }}
              className={`col-span-2 py-2.5 px-3 text-xs rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                system === 'برامج'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/50'
                  : 'glass-button text-purple-300 border-purple-500/30 bg-purple-950/20'
              }`}
            >
              <span>💻 قطاع البرامج والتطبيقات</span>
            </button>
          </div>
        </div>

        {/* Sub-category selector */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1.5 block">القسم الفرعي</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full p-2.5 text-xs font-medium"
          >
            {getCategoriesForSystem(system).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Shop Name */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-[#FF7A1A]" /> اسم المحل / التجاري *
          </label>
          <input
            type="text"
            required
            placeholder="أدخل اسم المحل التجاري (مثال: محلات النور)"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="glass-input w-full p-2.5 text-xs"
          />
        </div>

        {/* Client Owner Name */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1 block">اسم المالك / العميل *</label>
          <input
            type="text"
            required
            placeholder="أدخل اسم صاحب المحل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full p-2.5 text-xs"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" /> رقم موبايل العميل
          </label>
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
            onViewEditRecord={(type, rec) => {
              setModalRecordState({
                isOpen: true,
                type,
                record: rec,
              });
            }}
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-bold text-gray-200 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FF7A1A]" /> العنوان
          </label>
          <textarea
            rows={2}
            placeholder="أدخل العنوان والتفاصيل..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="glass-input w-full p-2.5 text-xs"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-orange w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? 'جاري الحفظ...' : 'إضافة العميل وتأكيد الحفظ'}
        </button>
      </form>

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={modalRecordState.isOpen}
        recordType={modalRecordState.type}
        record={modalRecordState.record}
        onClose={() => setModalRecordState({ isOpen: false, type: null, record: null })}
        onUpdateClient={onUpdateClient}
        onUpdateLead={onUpdateLead}
      />
    </div>
  );
};
