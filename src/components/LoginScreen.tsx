import React, { useState } from 'react';
import { Lock, User, KeyRound, Download, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { TeamMember } from '../types';

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
  const [username, setUsername] = useState(savedUsername || 'admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const uInput = username.trim().toLowerCase();
    const pInput = password.trim();

    // 1. Check Owner login (admin / 123 or pin 297062)
    const storedUsername = (localStorage.getItem('bm_username') || 'admin').toLowerCase();
    const storedPassword = localStorage.getItem('bm_password') || '123';
    const isOwnerCreds = (uInput === storedUsername || uInput === 'admin') && (pInput === storedPassword || pInput === '297062');

    if (isOwnerCreds) {
      if (rememberMe) {
        localStorage.setItem('bm_is_logged_in', 'true');
        localStorage.removeItem('bm_active_user_id');
      } else {
        sessionStorage.setItem('bm_is_logged_in', 'true');
        sessionStorage.removeItem('bm_active_user_id');
      }
      const ownerMember = teamMembers.find((m) => m.position === 'owner');
      onLoginSuccess(ownerMember);
      return;
    }

    // 2. Check Employee login in teamMembers list
    const matchedEmployee = teamMembers.find((m) => {
      if (m.isActive === false) return false;

      const mUsername = (m.username || '').toLowerCase();
      const mEmail = (m.email || '').toLowerCase();
      const mPhone = (m.phone || '').replace(/[^0-9]/g, '');
      const mName = (m.name || '').toLowerCase();

      const usernameMatch =
        uInput === mUsername ||
        uInput === mEmail ||
        (mPhone && uInput.replace(/[^0-9]/g, '') === mPhone) ||
        uInput === mName;

      const passwordMatch =
        pInput === m.password ||
        pInput === m.pinCode ||
        (m.password === undefined && (pInput === '1234' || pInput === '123'));

      return usernameMatch && passwordMatch;
    });

    if (matchedEmployee) {
      if (rememberMe) {
        localStorage.setItem('bm_is_logged_in', 'true');
        localStorage.setItem('bm_active_user_id', matchedEmployee.id);
      } else {
        sessionStorage.setItem('bm_is_logged_in', 'true');
        sessionStorage.setItem('bm_active_user_id', matchedEmployee.id);
      }
      onLoginSuccess(matchedEmployee);
      return;
    }

    setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة. للوصول كـ مالك (admin / 123) أو عبر بيانات الموظف المُسجلة');
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
              <span className="text-[10px] text-gray-400">(admin / 123)</span>
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
