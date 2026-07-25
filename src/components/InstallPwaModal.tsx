import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Check, ExternalLink, Copy, Globe, AlertCircle } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check if running inside iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

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

  const handleOpenExternal = () => {
    window.open(window.location.href, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl p-5 text-right shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7A1A]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF7A1A]/30 shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">تثبيت التطبيق (الموبايل والكمبيوتر)</h3>
            <p className="text-xs text-gray-400">تطبيق حقيقي يعمل بدون متصفح على الهاتف والكمبيوتر</p>
          </div>
        </div>

        {/* Iframe Notice */}
        {isInIframe && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>ملاحظة للتثبيت على الهاتف:</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              أنت متواجد حالياً داخل نافذة معايينة، المتصفح يمنع تثبيت التطبيقات من داخل المعاينة مباشرة. يرجى فتح رابط التطبيق المباشر أولاً:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleOpenExternal}
                className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                فتح في نافذة خارجية
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
          </div>
        )}

        {isStandalone || installed ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-emerald-400">البرنامج مثبت بالفعل على جهازك!</p>
            <p className="text-xs text-gray-300">يمكنك فتحه مباشرة من أيقونة الشاشة الرئيسية لهاتفك.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              اضغط على الزر أدناه لتثبيت برنامج <strong className="text-white">Business Manager</strong> فوراً كـ تطبيق حقيقي على شاشة موبايلك:
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
            <p className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              خطوات التثبيت على آيفون / آيباد (متصفح Safari):
            </p>
            <ol className="space-y-2.5 text-gray-200 pr-1">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>افتح هذا الرابط في متصفح <strong className="text-white">Safari</strong> واضغط على زر <strong className="text-sky-400">المشاركة (Share <Share className="w-3.5 h-3.5 inline mx-1" />)</strong> بأسفل الشاشة.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>اسحب القائمة لأسفل واختر <strong className="text-emerald-400">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline mx-1" />)</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>اضغط <strong className="text-white">"إضافة (Add)"</strong> في أعلى اليمين وسيطهر التطبيق كأيقونة على شاشتك.</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-gray-300">
            <p className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              خطوات التثبيت على الموبايل والكمبيوتر (Chrome/Edge):
            </p>
            <ol className="space-y-2 text-gray-200 pr-1">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>على الكمبيوتر: اضغط على أيقونة التثبيت <strong className="text-white">⊕</strong> الموجودة في شريط العنوان (URL) أعلى المتصفح، أو قائمة <span className="font-bold text-white">الثلاث نقاط ⋮</span> ثم <strong className="text-white">"تثبيت Business Manager"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>على الهاتف الأندرويد: افتح قائمة <span className="font-bold text-white">الثلاث نقاط ⋮</span> واختر <strong className="text-white">"تثبيت التطبيق (Install App)"</strong> أو <strong className="text-white">"إضافة إلى الشاشة الرئيسية"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>أكد التثبيت وسيصبح التطبيق برنامجاً مستقلاً يعمل بأيقونة خاصة على سطح المكتب للشاشة الرئيسية للكمبيوتر وللموبايل وبدون إطار المتصفح.</span>
              </li>
            </ol>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={handleCopyLink}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم نسخ الرابط' : 'نسخ رابط التطبيق'}
          </button>
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
