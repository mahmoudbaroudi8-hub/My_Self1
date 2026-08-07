import React, { useState } from 'react';
import { Database, Download, Upload, FileSpreadsheet, CheckCircle2, RefreshCw, X, ShieldAlert, Users, ChevronLeft } from 'lucide-react';
import { Client, Package, Offer, Sale, Expense, ProjectItem, ScreenView } from '../types';
import { exportFullReportToExcel } from '../lib/excelExport';
import { addClient, addPackage, addOffer, addSale, addExpense, addProject } from '../lib/firebase';

interface BackupModalProps {
  clients: Client[];
  packages: Package[];
  offers: Offer[];
  projects: ProjectItem[];
  sales: Sale[];
  expenses: Expense[];
  onClose: () => void;
  onRefreshData?: () => void;
  onNavigate?: (screen: ScreenView) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  clients,
  packages,
  offers,
  projects,
  sales,
  expenses,
  onClose,
  onRefreshData,
  onNavigate,
}) => {
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // 1. Export JSON Backup
  const handleExportJsonBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Business Manager System',
      data: {
        clients,
        packages,
        offers,
        projects,
        sales,
        expenses,
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BusinessManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Restore JSON Backup
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('هل أنت تأكد من استرجاع البيانات من هذا الملف؟ ستقوم العملية بإضافة البيانات إلى قاعدة البيانات الحالية.')) {
      return;
    }

    setRestoring(true);
    setRestoreMessage('جاري قراءة واسترجاع ملف النسخة الاحتياطية...');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.data) {
        throw new Error('تنسيق الملف غير صحيح.');
      }

      const {
        clients: importedClients = [],
        packages: importedPackages = [],
        offers: importedOffers = [],
        projects: importedProjects = [],
        sales: importedSales = [],
        expenses: importedExpenses = [],
      } = parsed.data;

      // Import sequentially
      let count = 0;
      for (const c of importedClients) {
        const { id, ...rest } = c;
        await addClient(rest);
        count++;
      }
      for (const p of importedPackages) {
        const { id, ...rest } = p;
        await addPackage(rest);
        count++;
      }
      for (const o of importedOffers) {
        const { id, ...rest } = o;
        await addOffer(rest);
        count++;
      }
      for (const pr of importedProjects) {
        const { id, ...rest } = pr;
        await addProject(rest);
        count++;
      }
      for (const s of importedSales) {
        const { id, ...rest } = s;
        await addSale(rest);
        count++;
      }
      for (const ex of importedExpenses) {
        const { id, ...rest } = ex;
        await addExpense(rest);
        count++;
      }

      setRestoreMessage(`تمت عملية الاسترجاع بنجاح! تم إضافة ${count} سجل في قاعدة البيانات.`);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error restoring backup:', err);
      setRestoreMessage('حدث خطأ أثناء استرجاع الملف. تأكد من سلامة ملف JSON.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-card max-w-md w-full p-5 space-y-4 border border-[#FF7A1A]/40 max-h-[90vh] overflow-y-auto relative shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">إعدادات النظام والنسخ الاحتياطي</h3>
              <p className="text-[11px] text-gray-300 truncate">إدارة النظام، الفريق، والنسخ الاحتياطي</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/10 transition-colors flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team & Permissions Dedicated Row */}
        {onNavigate && (
          <div className="p-3.5 glass-card border border-[#FF7A1A]/40 bg-gradient-to-r from-[#FF7A1A]/10 via-[#121C30] to-[#0B1220] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF7A1A]/20 border border-[#FF7A1A]/30 text-[#FF7A1A] flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">الفريق والأدوار والصلاحيات</h4>
                <p className="text-[10px] text-gray-300">إدارة الأعضاء، البوسيشن، الصلاحيات ورموز الـ PIN</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigate('team');
              }}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-[#FF7A1A]/20 shrink-0 transition-all active:scale-95"
            >
              <span>فتح الشاشة الكاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Database Live Sync Status Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>قاعدة البيانات متصلة وتعمل بالتحديث التلقائي M3</span>
          </div>
          <p className="text-[11px] text-gray-300">
            يتم مزامنة أي إضافة أو تعديل تلقائياً وفورياً عبر السيرفر.
          </p>
          <div className="text-[10px] text-emerald-400 font-mono bg-black/40 p-2 rounded-lg break-all">
            DB ID: ai-studio-businessmanager-bae8257c-b9d6-4fa1-bc1b-163f4b9d969b
          </div>
        </div>

        {/* Actions Grid */}
        <div className="space-y-3 pt-1">
          {/* Action 1: Download JSON Backup */}
          <div className="p-3.5 glass-card space-y-2 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#FF7A1A]" />
                  <span>تنزيل نسخة احتياطية (JSON)</span>
                </h4>
                <p className="text-[10px] text-gray-400">حفظ نسخة كاملة من بياناتك على جهازك الشخصي</p>
              </div>
            </div>

            <button
              onClick={handleExportJsonBackup}
              className="w-full btn-orange py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> تنزيل ملف Backup الان
            </button>
          </div>

          {/* Action 2: Import / Restore Backup */}
          <div className="p-3.5 glass-card space-y-2 border border-white/10">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>استرجاع بيانات من جهازك</span>
              </h4>
              <p className="text-[10px] text-gray-400">رفع واسترجاع ملف backup.json إلى قاعدة البيانات</p>
            </div>

            <label className="w-full glass-button py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 text-purple-300 border-purple-500/30">
              <Upload className="w-4 h-4 text-purple-400" />
              <span>{restoring ? 'جاري الاسترجاع...' : 'اختر ملف النسخة الاحتياطية'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={restoring}
                className="hidden"
              />
            </label>

            {restoreMessage && (
              <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg font-semibold">
                {restoreMessage}
              </p>
            )}
          </div>

          {/* Action 3: Professional Excel Export */}
          <div className="p-3.5 glass-card space-y-2 border border-white/10">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>تصدير Excel احترافي شامل</span>
              </h4>
              <p className="text-[10px] text-gray-400">استخراج ملف اكسل متعدد الصفحات للعملاء والمبيعات والمصروفات</p>
            </div>

            <button
              onClick={() => exportFullReportToExcel({ sales, clients, expenses, packages })}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" /> تحميل تقرير Excel الشامل
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="glass-button px-5 py-2 text-xs font-bold text-gray-300 rounded-xl"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
