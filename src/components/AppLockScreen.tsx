import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { TeamMember } from '../types';
import { verifyTextMatch } from '../lib/authCrypto';

interface AppLockScreenProps {
  currentUser: TeamMember;
  onUnlock: () => void;
  onLogout: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ currentUser, onUnlock, onLogout }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleDigit = async (digit: string) => {
    if (checking) return;
    const next = (pin + digit).slice(0, 6);
    setPin(next);
    setError('');

    // Auto-check once a reasonable PIN length is reached (4-6 digits)
    if (next.length >= 4) {
      setChecking(true);
      const ok = await verifyTextMatch(next, currentUser.appLockPinHash, currentUser.appLockPinSalt);
      if (ok) {
        onUnlock();
        return;
      }
      // Wrong PIN at 6 digits (or immediately wrong at 4/5 if user pauses) -
      // only hard-fail at 6 digits to allow 4 or 5 digit PINs to keep typing.
      if (next.length === 6) {
        setError('الرقم السري غلط، حاول تاني.');
        setPin('');
      }
      setChecking(false);
    }
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center p-6 text-white font-['Cairo',sans-serif]">
      <div className="w-16 h-16 rounded-2xl bg-[#FF7A1A]/15 border border-[#FF7A1A]/40 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-[#FF7A1A]" />
      </div>
      <p className="text-sm font-bold text-gray-200 mb-1">التطبيق مقفول</p>
      <p className="text-xs text-gray-400 mb-6">ادخل الرقم السري عشان تكمل، يا {currentUser.name}</p>

      {/* PIN dots */}
      <div className="flex items-center gap-3 mb-6" dir="ltr">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
              i < pin.length ? 'bg-[#FF7A1A] border-[#FF7A1A]' : 'border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-400 font-bold mb-4">{error}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            disabled={checking}
            className="glass-card py-4 text-lg font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="py-4 text-[10px] font-bold text-gray-400 hover:text-red-400"
        >
          تسجيل خروج
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={checking}
          className="glass-card py-4 text-lg font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={checking}
          className="py-4 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-40"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
