import React, { useState } from 'react';
import { Receipt, Search, Filter, Check, Send, Trash2, Eye, Printer, Phone, Calendar, Globe, ExternalLink, Copy, FileSpreadsheet, Edit3 } from 'lucide-react';
import { Sale, Client, ScreenView, TeamMember } from '../types';
import { shareInvoicePdf } from '../lib/pdfInvoice';
import { exportSalesToExcel } from '../lib/excelExport';
import { CorporateInvoiceModal } from './CorporateInvoiceModal';
import { ProtectedDeleteModal } from './ProtectedDeleteModal';
import { hasPermission } from '../lib/permissions';

interface SalesScreenProps {
  sales: Sale[];
  clients?: Client[];
  currentUser: TeamMember | null;
  onUpdateSaleStatus: (id: string, status: 'mowakad' | 'morsal_qabl_dafa') => Promise<void>;
  onEditSale?: (sale: Sale) => void;
  onDeleteSale: (id: string) => Promise<void>;
  onNavigate: (screen: ScreenView) => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({
  sales,
  clients,
  currentUser,
  onUpdateSaleStatus,
  onEditSale,
  onDeleteSale,
  onNavigate,
}) => {
  const canManageSales = hasPermission(currentUser, 'canManageSales');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mowakad' | 'morsal_qabl_dafa'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    saleId: string;
    saleName: string;
  }>({
    isOpen: false,
    saleId: '',
    saleName: '',
  });

  const filteredSales = sales.filter((s) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (s.shopName || '').toLowerCase().includes(query) ||
      (s.clientName || '').toLowerCase().includes(query) ||
      (s.phone || '').includes(query) ||
      (s.projectUrl || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    let matchesDate = true;
    if (startDate && s.date < startDate) matchesDate = false;
    if (endDate && s.date > endDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-3.5 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">سجل المبيعات والفواتير</h2>
            <p className="text-[11px] text-gray-300">إجمالي {sales.length} عملية بيع مسجلة</p>
          </div>
        </div>

        <button
          onClick={() => exportSalesToExcel(sales)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          title="تصدير سجل المبيعات إلى ملف Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">تصدير Excel</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم المحل أو العميل أو التليفون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pr-9 pl-3 py-2.5 text-xs"
          />
        </div>

        {/* Date filter & Status filter buttons */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input w-full p-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 mb-0.5 block">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input w-full p-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-[#FF7A1A] text-white' : 'glass-button text-gray-300'
            }`}
          >
            الكل ({sales.length})
          </button>
          <button
            onClick={() => setStatusFilter('mowakad')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'mowakad' ? 'bg-emerald-600 text-white' : 'glass-button text-gray-300'
            }`}
          >
            مؤكد ({sales.filter((s) => s.status === 'mowakad').length})
          </button>
          <button
            onClick={() => setStatusFilter('morsal_qabl_dafa')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'morsal_qabl_dafa' ? 'bg-amber-600 text-white' : 'glass-button text-gray-300'
            }`}
          >
            قبل الدفع ({sales.filter((s) => s.status === 'morsal_qabl_dafa').length})
          </button>
        </div>
      </div>

      {/* Sales Cards */}
      <div className="space-y-2.5">
        {filteredSales.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-xs">
            لا توجد عمليات مبيعات مطابقة.
          </div>
        ) : (
          filteredSales.map((sale) => {
            const debt = (sale.finalInvoice || 0) - (sale.paidAmount || 0);

            return (
              <div key={sale.id} className="glass-card p-4 space-y-2.5 relative border-r-2 border-r-[#FF7A1A]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">{sale.shopName}</h3>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      العميل: {sale.clientName} • {sale.system} ({sale.category})
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      sale.status === 'mowakad'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {sale.status === 'mowakad' ? 'مؤكد' : 'مرسل قبل الدفع'}
                  </span>
                </div>

                {/* Pricing row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <div className="text-gray-300">
                    الباقة: <span className="text-white font-semibold">{sale.packageName || 'بدون باقة'}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-extrabold text-[#FF7A1A]">
                      {(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                    {debt > 0 && (
                      <span className="text-[10px] text-amber-400 block font-semibold">
                        متبقي دين: {debt.toLocaleString('ar-EG')} ج.م
                      </span>
                    )}
                  </div>
                </div>

                {/* Project URL Row if available */}
                {sale.projectUrl && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 gap-2">
                    <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                      <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate font-mono text-[11px]" dir="ltr">
                        {sale.projectUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sale.projectUrl!);
                          setCopiedUrlId(sale.id);
                          setTimeout(() => setCopiedUrlId(null), 2000);
                        }}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="نسخ رابط المشروع"
                      >
                        <Copy className="w-3 h-3 text-emerald-300" />
                        <span>{copiedUrlId === sale.id ? 'تم النسخ!' : 'نسخ'}</span>
                      </button>

                      <a
                        href={sale.projectUrl.startsWith('http') ? sale.projectUrl : `https://${sale.projectUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm"
                        title="انتقل للرابط"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>انتقل لرابط</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoice(sale)}
                      className="glass-button px-2.5 py-1 text-[11px] text-white flex items-center gap-1 hover:bg-white/10"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FF7A1A]" /> الفاتورة
                    </button>

                    <button
                      onClick={() => shareInvoicePdf(sale)}
                      className="glass-button px-2.5 py-1 text-[11px] text-emerald-300 flex items-center gap-1 hover:bg-emerald-500/20"
                      title="إرسال فاتورة PDF عبر الواتساب"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" /> PDF واتساب
                    </button>

                    {onEditSale && canManageSales && (
                      <button
                        onClick={() => onEditSale(sale)}
                        className="glass-button px-2.5 py-1 text-[11px] text-[#FF7A1A] flex items-center gap-1 hover:bg-[#FF7A1A]/20"
                        title="تعديل تفاصيل الفاتورة والعميل"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </button>
                    )}

                    {sale.status === 'morsal_qabl_dafa' && canManageSales && (
                      <button
                        onClick={() => onUpdateSaleStatus(sale.id, 'mowakad')}
                        className="glass-button px-2.5 py-1 text-[11px] text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/20"
                      >
                        <Check className="w-3.5 h-3.5" /> تأكيد العملية
                      </button>
                    )}
                  </div>

                  {canManageSales && (
                  <button
                    onClick={() => {
                      setDeleteModalState({
                        isOpen: true,
                        saleId: sale.id,
                        saleName: sale.shopName || sale.clientName || 'عملية بيع',
                      });
                    }}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="حذف عملية البيع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Corporate Invoice Modal */}
      {selectedInvoice && (
        <CorporateInvoiceModal
          sale={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <ProtectedDeleteModal
        isOpen={deleteModalState.isOpen}
        title="حذف عملية بيع وفاتورة"
        itemDescription={`الفاتورة الخاص بـ: "${deleteModalState.saleName}"`}
        onConfirmDelete={() => onDeleteSale(deleteModalState.saleId)}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
