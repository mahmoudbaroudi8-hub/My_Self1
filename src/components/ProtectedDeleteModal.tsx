import React, { useState } from 'react';
import { ShieldAlert, Lock, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProtectedDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemDescription?: string;
  onConfirmDelete: () => Promise<void> | void;
  onClose: () => void;
  developerPin?: string;
}

export const ProtectedDeleteModal: React.FC<ProtectedDeleteModalProps> = ({
  isOpen,
  title,
  itemDescription,
  onConfirmDelete,
  onClose,
  developerPin = '297062',
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Verify PIN / Password (strictly 297062)
    const validPins = ['297062', developerPin.trim()];
    if (!validPins.includes(enteredPin.trim())) {
      setErrorMessage('كلمة السر غير صحيحة! هذا الخيار محمي برقم سر المطور وصاحب العمل فقط.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmDelete();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setEnteredPin('');
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error during protected delete:', err);
      setErrorMessage('حدث خطأ أثناء تنفيذ عملية الحذف من Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-5 space-y-4 border-2 border-red-500/50 bg-[#0B1220] shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              <p className="text-[11px] text-red-300 font-semibold">حماية خاصة بصاحب العمل والمطور</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item detail */}
        {itemDescription && (
          <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs text-red-200 font-medium space-y-1">
            <span className="block text-[10px] text-red-400 font-bold">العنصر المراد حذفه نهائياً:</span>
            <p className="font-extrabold text-white text-sm">{itemDescription}</p>
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold">تم معالجة الطلب وحذف العنصر نهائياً بنجاح!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-bold block flex items-center justify-between">
                <span>أدخل كلمة السر الخاصة بالمطور وصاحب الشغل *</span>
                <span className="text-[10px] text-amber-400 font-bold">🔒 حماية خيارات الحذف</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  required
                  placeholder="كلمة السر الخاصة بالمطور..."
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="glass-input w-full p-3 pr-10 text-center font-bold text-base tracking-widest text-[#FF7A1A]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex-1 flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد ومعالجة الحذف</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
