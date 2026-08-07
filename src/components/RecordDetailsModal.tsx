import React, { useState, useEffect } from 'react';
import { X, User, Store, Phone, MapPin, Check, FileText, AlertCircle, Edit3, ShieldCheck } from 'lucide-react';
import { Client, Lead, SystemType, CategoryType, getCategoriesForSystem, SYSTEM_CATEGORIES_MAP } from '../types';

interface RecordDetailsModalProps {
  isOpen: boolean;
  recordType: 'client' | 'lead' | null;
  record: Client | Lead | null;
  onClose: () => void;
  onUpdateClient?: (id: string, data: Partial<Client>) => Promise<void>;
  onUpdateLead?: (id: string, data: Partial<Lead>) => Promise<void>;
  onSelectClientForPos?: (client: Client) => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  isOpen,
  recordType,
  record,
  onClose,
  onUpdateClient,
  onUpdateLead,
  onSelectClientForPos,
}) => {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [system, setSystem] = useState<SystemType>('محلات');
  const [category, setCategory] = useState<CategoryType>('سوبر ماركت');
  const [status, setStatus] = useState<'محتمل' | 'مؤكد'>('محتمل');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name || '');
      setPhone(record.phone || '');
      setSystem(record.system || 'محلات');
      setCategory(record.category || 'سوبر ماركت');

      if ('shopName' in record) {
        setShopName(record.shopName || '');
        setAddress((record as Client).address || '');
      } else {
        setShopName('');
        setAddress('');
      }

      if ('notes' in record) {
        setNotes((record as Lead).notes || '');
        setStatus((record as Lead).status || 'محتمل');
      } else {
        setNotes('');
      }
    }
  }, [record]);

  if (!isOpen || !record || !recordType) return null;

  const isClient = recordType === 'client';

  const handleSystemChange = (sys: SystemType) => {
    setSystem(sys);
    const cats = getCategoriesForSystem(sys);
    if (cats && cats.length > 0) {
      setCategory(cats[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('رجاءً أدخل اسم العميل.');
      return;
    }

    setIsSaving(true);
    setSuccessMsg(false);

    try {
      if (isClient && onUpdateClient) {
        await onUpdateClient(record.id, {
          name: name.trim(),
          shopName: shopName.trim() || name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          system,
          category,
        });
      } else if (!isClient && onUpdateLead) {
        await onUpdateLead(record.id, {
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          system,
          category,
          status,
        });
      }
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error updating record:', err);
      alert('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-card max-w-lg w-full p-5 space-y-4 border border-[#FF7A1A]/40 max-h-[90vh] overflow-y-auto relative shadow-2xl my-auto animate-fade-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isClient ? 'bg-[#FF7A1A]/20 text-[#FF7A1A]' : 'bg-purple-500/20 text-purple-300'}`}>
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {isClient ? 'سجل العميل الفعلي' : 'سجل العميل المحتمل (Lead)'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isClient ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                  {isClient ? 'عميل موثق' : 'محتمل'}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 truncate">
                تعديل وتحديث البيانات المباشرة للملف المسجل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ التعديلات بنجاح وتحديث السجل!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#FF7A1A]" /> اسم صاحب الحساب *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-semibold"
              />
            </div>

            {/* Shop Name (for Client) */}
            {isClient && (
              <div>
                <label className="text-[11px] font-bold text-gray-200 mb-1 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-[#FF7A1A]" /> اسم المحل / الشركة
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-semibold"
                />
              </div>
            )}

            {/* Phone */}
            <div className={isClient ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
              <label className="text-[11px] font-bold text-gray-200 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#FF7A1A]" /> رقم الموبايل
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-semibold dir-ltr text-left"
              />
            </div>
          </div>

          {/* System & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 block">القطاع / النظام</label>
              <select
                value={system}
                onChange={(e) => handleSystemChange(e.target.value as SystemType)}
                className="glass-input w-full p-2.5 text-xs font-semibold text-gray-200"
              >
                {Object.keys(SYSTEM_CATEGORIES_MAP).map((sys) => (
                  <option key={sys} value={sys} className="bg-[#0B1220]">{sys}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 block">القسم الفرعي</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="glass-input w-full p-2.5 text-xs font-semibold text-gray-200"
              >
                {getCategoriesForSystem(system).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0B1220]">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address or Notes */}
          {isClient ? (
            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#FF7A1A]" /> العنوان والتفاصيل
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-400" /> الملاحظات واهتمامات العميل
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input w-full p-2.5 text-xs"
              />
            </div>
          )}

          {/* Lead Status */}
          {!isClient && (
            <div>
              <label className="text-[11px] font-bold text-gray-200 mb-1 block">حالة العميل المحتمل</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('محتمل')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${status === 'محتمل' ? 'bg-amber-500/30 text-amber-300 border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
                >
                  محتمل ⏳
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('مؤكد')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${status === 'مؤكد' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
                >
                  مؤكد (تم الاتفاق) Check
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-white/10">
            {onSelectClientForPos && isClient && (
              <button
                type="button"
                onClick={() => {
                  onSelectClientForPos(record as Client);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>اختيار العميل لفاتورة البيع</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 btn-orange py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات على السجل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
