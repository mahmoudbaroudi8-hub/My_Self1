import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Check, ArrowDown } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isStandaloneApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Listen for PWA prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl p-5 text-right shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7A1A]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF7A1A]/30">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">تثبيت البرنامج على الموبايل (PWA)</h3>
            <p className="text-xs text-gray-400">تطبيق سريع يعمل بدون إنترنت على الشاشة الرئيسية</p>
          </div>
        </div>

        {isStandalone || installed ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-emerald-400">البرنامج مثبت بالفعل على جهازك!</p>
            <p className="text-xs text-gray-300">يمكنك فتحه مباشرة من الشاشة الرئيسية للهاتف أو الكمبيوتر.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              يمكنك تثبيت برنامج <strong className="text-white">Business Manager</strong> كـ تطبيق مجاني ومستقل على شاشتك الرئيسية بنقرة واحدة فقط دون الحاجة إلى متجر متقدم.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-gradient-to-r from-[#FF7A1A] to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-[#FF7A1A]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-5 h-5" />
              تثبيت التطبيق الآن
            </button>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs">
            <p className="font-bold text-amber-400 text-sm">خطوات التثبيت على آيفون / آيباد (Safari):</p>
            <ol className="space-y-2 text-gray-200 pr-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px]">1</span>
                <span>اضغط على زر المشاركة <Share className="w-4 h-4 inline mx-1 text-sky-400" /> في أسفل شاشة Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px]">2</span>
                <span>انزل للأسفل واختر <strong className="text-white">"إضافة إلى الشاشة الرئيسية"</strong> <PlusSquare className="w-4 h-4 inline mx-1 text-emerald-400" />.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px]">3</span>
                <span>اضغط على <strong className="text-white">"إضافة Add"</strong> في أعلى اليمين.</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-gray-300">
            <p className="font-bold text-amber-400 text-sm">خطوات التثبيت للاندرويد والكمبيوتر:</p>
            <p className="leading-relaxed">
              افتح قائمة متصفحك (الثلاث نقاط <span className="font-bold text-white">⋮</span> أو أيقونة الشاشة في شريط العنوان) ثم اختر <strong className="text-white font-bold">"تثبيت التطبيق Install App"</strong> أو <strong className="text-white font-bold">"إضافة إلى الشاشة الرئيسية"</strong>.
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
