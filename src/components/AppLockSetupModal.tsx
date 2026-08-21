import React, { useState } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { TeamMember } from '../types';
import { hashText, verifyTextMatch } from '../lib/authCrypto';
import { updateTeamMember } from '../lib/firebase';

interface AppLockSetupModalProps {
  currentUser: TeamMember;
  onClose: () => void;
  onUpdated: (patch: Partial<TeamMember>) => void;
}

export const AppLockSetupModal: React.FC<AppLockSetupModalProps> = ({ currentUser, onClose, onUpdated }) => {
  const isEnabled = Boolean(currentUser.appLockEnabled);
  const [step, setStep] = useState<'menu' | 'setup' | 'confirm' | 'disable'>('menu');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveNewPin = async () => {
    if (pin.length < 4) {
      setError('لازم الرقم السري يكون 4 أرقام على الأقل.');
      return;
    }
    if (pin !== confirmPin) {
      setError('الرقمين مش متطابقين، حاول تاني.');
      setConfirmPin('');
      return;
    }
    setSaving(true);
    try {
      const { hash, salt } = await hashText(pin);
      await updateTeamMember(currentUser.id, {
        appLockEnabled: true,
        appLockPinHash: hash,
        appLockPinSalt: salt,
      });
      onUpdated({ appLockEnabled: true, appLockPinHash: hash, appLockPinSalt: salt });
      onClose();
    } catch {
      setError('حصل خطأ أثناء الحفظ، حاول تاني.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    const ok = await verifyTextMatch(currentPinInput, currentUser.appLockPinHash, currentUser.appLockPinSalt);
    if (!ok) {
      setError('الرقم السري الحالي غلط.');
      return;
    }
    setSaving(true);
    try {
      await updateTeamMember(currentUser.id, {
        appLockEnabled: false,
        appLockPinHash: '',
        appLockPinSalt: '',
      });
      onUpdated({ appLockEnabled: false, appLockPinHash: '', appLockPinSalt: '' });
      onClose();
    } catch {
      setError('حصل خطأ أثناء الحفظ، حاول تاني.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0B1220]/95 backdrop-blur-2xl border-2 border-[#FF7A1A]/40 rounded-2xl shadow-2xl p-5 text-right space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF7A1A]" />
            <h3 className="text-sm font-extrabold text-white">قفل PIN عند فتح التطبيق</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'menu' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              {isEnabled
                ? 'القفل مفعّل حالياً — التطبيق هيطلب الرقم السري ده كل ما تفتحه على الجهاز ده.'
                : 'لو فعّلته، التطبيق هيطلب رقم سري قصير كل ما تفتحه على الجهاز ده، حتى لو انت مسجل دخول بالفعل.'}
            </p>
            {isEnabled ? (
              <button
                onClick={() => setStep('disable')}
                className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold"
              >
                إيقاف القفل
              </button>
            ) : (
              <button onClick={() => setStep('setup')} className="btn-orange w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> تفعيل القفل
              </button>
            )}
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300">اختار رقم سري (4-6 أرقام)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-center text-lg tracking-[0.5em]"
              dir="ltr"
              autoFocus
            />
            <button
              disabled={pin.length < 4}
              onClick={() => setStep('confirm')}
              className="btn-orange w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300">أكّد الرقم السري تاني</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-center text-lg tracking-[0.5em]"
              dir="ltr"
              autoFocus
            />
            {error && <p className="text-[11px] text-red-400 font-bold">{error}</p>}
            <button
              disabled={confirmPin.length < 4 || saving}
              onClick={handleSaveNewPin}
              className="btn-orange w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              {saving ? 'جاري الحفظ...' : 'تفعيل القفل'}
            </button>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300">ادخل الرقم السري الحالي عشان توقف القفل</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-center text-lg tracking-[0.5em]"
              dir="ltr"
              autoFocus
            />
            {error && <p className="text-[11px] text-red-400 font-bold">{error}</p>}
            <button
              disabled={currentPinInput.length < 4 || saving}
              onClick={handleDisable}
              className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold disabled:opacity-40"
            >
              {saving ? 'جاري الحفظ...' : 'إيقاف القفل'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
