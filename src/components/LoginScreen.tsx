import React, { useState } from 'react';
import { Lock, User, KeyRound, Download, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { TeamMember } from '../types';
import { verifyTextMatch } from '../lib/authCrypto';
import { recordFailedLoginAttempt, resetLoginAttempts, auth, migrateMemberToRealAuth, registerDeviceAndAlertIfNew } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginScreenProps {
  teamMembers?: TeamMember[];
  onLoginSuccess: (member?: TeamMember) => void;
  savedUsername: string;
  installPrompt: any;
  onInstallApp: () => void;
  isAppInstalled: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  teamMembers = [],
  onLoginSuccess,
  savedUsername,
  installPrompt,
  onInstallApp,
  isAppInstalled,
}) => {
  const [username, setUsername] = useState(savedUsername || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const uInput = username.trim().toLowerCase();
    const pInput = password.trim();

    // Find matching employee member in teamMembers list first for full rate-limiting and salt check
    const matchedMember = teamMembers.find((m) => {
      if (m.isActive === false) return false;
      const mUsername = (m.username || '').toLowerCase();
      const mEmail = (m.email || '').toLowerCase();
      const mPhone = (m.phone || '').replace(/[^0-9]/g, '');
      const mName = (m.name || '').toLowerCase();

      return (
        uInput === mUsername ||
        uInput === mEmail ||
        (mPhone && uInput.replace(/[^0-9]/g, '') === mPhone) ||
        uInput === mName ||
        (m.position === 'owner' && (uInput === 'admin' || uInput === 'البارودي'))
      );
    });

    // If matched member is found, check if account is currently locked out
    if (matchedMember) {
      if (matchedMember.lockedUntil) {
        const lockTime = new Date(matchedMember.lockedUntil).getTime();
        const now = Date.now();
        if (lockTime > now) {
          const remainingMins = Math.ceil((lockTime - now) / 60000);
          setErrorMsg(
            `تم تجاوز عدد المحاولات المسموح بها (5 محاولات خاطئة متتالية). الحساب مقفل مؤقتاً، حاول بعد ${remainingMins} دقيقة.`
          );
          return;
        }
      }

      // Verify credentials: real Firebase Auth for migrated members, legacy
      // client-side hash check as a fallback for members not yet migrated.
      let credentialsOk = false;
      if (matchedMember.authUid && matchedMember.email) {
        try {
          await signInWithEmailAndPassword(auth, matchedMember.email, pInput);
          credentialsOk = true;
        } catch {
          credentialsOk = false;
        }
      } else {
        const passwordOk = await verifyTextMatch(pInput, matchedMember.password, matchedMember.passwordSalt);
        const pinOk = await verifyTextMatch(pInput, matchedMember.pinCode, matchedMember.pinSalt);
        const defaultFallbackOk =
          !matchedMember.password && !matchedMember.pinCode && pInput === '297062';
        credentialsOk = passwordOk || pinOk || defaultFallbackOk;
      }

      if (credentialsOk) {
        // Successful login: reset failed attempt counters
        await resetLoginAttempts(matchedMember.id);

        // Silent one-time upgrade: if this member logged in via the legacy
        // path (no real Firebase Auth account yet) and has an email on file,
        // give them a real account now using the password they just typed.
        // Runs in the background — never blocks or fails the login itself.
        if (!matchedMember.authUid && matchedMember.email) {
          migrateMemberToRealAuth(matchedMember, pInput).catch(() => {});
        }

        // Fire-and-forget: record this device and alert the owner if it's
        // the first time this browser has logged into this account.
        registerDeviceAndAlertIfNew(matchedMember).catch(() => {});

        if (rememberMe) {
          localStorage.setItem('bm_is_logged_in', 'true');
          localStorage.setItem('bm_active_user_id', matchedMember.id);
          sessionStorage.removeItem('bm_is_logged_in');
          sessionStorage.removeItem('bm_active_user_id');
        } else {
          sessionStorage.setItem('bm_is_logged_in', 'true');
          sessionStorage.setItem('bm_active_user_id', matchedMember.id);
          localStorage.removeItem('bm_is_logged_in');
          localStorage.removeItem('bm_active_user_id');
        }
        onLoginSuccess(matchedMember);
        return;
      } else {
        // Failed credential match: record failed login attempt
        const { newCount, isLocked } = await recordFailedLoginAttempt(
          matchedMember.id,
          matchedMember.failedLoginAttempts || 0
        );

        if (isLocked) {
          setErrorMsg(
            'تم تجاوز عدد المحاولات المسموح بها (5 محاولات خاطئة متتالية). تم قفل الحساب مؤقتاً لمدة 15 دقيقة.'
          );
        } else {
          setErrorMsg(
            `كلمة المرور أو رمز PIN غير صحيح. المحاولة الخاطئة رقم (${newCount}) من 5 محاولات قبل القفل.`
          );
        }
        return;
      }
    }

    // Direct Owner fallback check (if owner document not seeded or customized username)
    const storedUsername = (localStorage.getItem('bm_username') || 'admin').toLowerCase();
    const storedPassword = localStorage.getItem('bm_password');
    const isOwnerCreds =
      (uInput === storedUsername || uInput === 'admin') && ((storedPassword && pInput === storedPassword) || pInput === '297062');

    if (isOwnerCreds) {
      const ownerMember = teamMembers.find((m) => m.position === 'owner') || {
        id: 'owner-default',
        name: 'صاحب المشروع (البارودي)',
        email: 'admin@system.local',
        phone: '01000000000',
        username: 'admin',
        position: 'owner',
        defaultCommissionRate: 10,
        isActive: true,
        allowedScreens: ['home', 'pos', 'add-client', 'clients', 'leads', 'packages', 'sector', 'sales', 'expenses', 'reports', 'team'],
        permissions: {
          canManageProjects: true,
          canManageSales: true,
          canManagePackages: true,
          canViewExpenses: true,
          canManageTeam: true,
          canViewReports: true,
          canConfirmLeads: true,
        },
      };
      const activeId = ownerMember.id;

      if (rememberMe) {
        localStorage.setItem('bm_is_logged_in', 'true');
        localStorage.setItem('bm_active_user_id', activeId);
        sessionStorage.removeItem('bm_is_logged_in');
        sessionStorage.removeItem('bm_active_user_id');
      } else {
        sessionStorage.setItem('bm_is_logged_in', 'true');
        sessionStorage.setItem('bm_active_user_id', activeId);
        localStorage.removeItem('bm_is_logged_in');
        localStorage.removeItem('bm_active_user_id');
      }
      onLoginSuccess(ownerMember);
      registerDeviceAndAlertIfNew(ownerMember).catch(() => {});
      return;
    }

    setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مجدداً.');
  };

  return (
    <div className="min-h-screen w-full bg-[#080D1A] flex flex-col justify-center items-center p-4 relative overflow-hidden text-white font-sans">
      {/* Glow Ambient background */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#FF7A1A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 space-y-5">
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-amber-400 p-0.5 shadow-xl shadow-[#FF7A1A]/20">
            <div className="w-full h-full bg-[#0B1220] rounded-[14px] flex items-center justify-center text-[#FF7A1A]">
              <ShieldCheck className="w-9 h-9" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">نظام إدارة المبيعات والأنظمة</h1>
          <p className="text-xs text-gray-400">سجل الدخول للوصول لقاعدة البيانات وإدارة المبيعات</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 space-y-4 border border-white/10 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-300 mb-1.5 block">اسم المستخدم</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  required
                  className="glass-input w-full pr-10 pl-3 py-3 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 mb-1.5 block">كلمة المرور</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  required
                  className="glass-input w-full pr-10 pl-3 py-3 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-300 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#FF7A1A] rounded"
                />
                <span>تذكر تسجيل دخولي</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-orange w-full py-3.5 rounded-xl text-xs font-extrabold shadow-lg shadow-[#FF7A1A]/30 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <span>تسجيل الدخول للنظام</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Install App Button */}
        {!isAppInstalled && (
          <div className="glass-card p-4 text-center space-y-2 border border-amber-500/30">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>تثبيت التطبيق على جهازك</span>
            </div>
            <p className="text-[11px] text-gray-300">
              يمكنك تثبيت النظام كتطبيق مستقيل يعمل بسرعة على الهاتف أو جهازك المحمول
            </p>
            <button
              type="button"
              onClick={onInstallApp}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق الآن (Install App)</span>
            </button>
          </div>
        )}

        <div className="text-center text-[11px] text-gray-300 space-y-1">
          <p>تطوير وإدارة الأنظمة والبرامج © 2026</p>
        </div>
      </div>
    </div>
  );
};
