import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, MessageSquare, MapPin, Store, Trash2, Plus, Receipt, FileSpreadsheet, FileText, CreditCard, Calendar, Edit3, DollarSign, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Client, Sale, Payment, ScreenView, TeamMember, Lead } from '../types';
import { exportClientsToExcel } from '../lib/excelExport';
import { ProtectedDeleteModal } from './ProtectedDeleteModal';
import { ClientStatementModal } from './ClientStatementModal';
import { LeadsManager } from './LeadsManager';
import { isScreenAllowedForUser } from '../lib/permissions';

interface ClientsScreenProps {
  clients: Client[];
  sales: Sale[];
  payments: Payment[];
  leads?: Lead[];
  teamMembers?: TeamMember[];
  currentUser?: TeamMember | null;
  initialScreen?: ScreenView;
  onDeleteClient: (id: string) => Promise<void>;
  onUpdateClient?: (id: string, data: Partial<Client>) => Promise<void>;
  onAddPayment: (payment: Omit<Payment, 'id'>) => Promise<string>;
  onDeletePayment: (id: string) => Promise<void>;
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => Promise<void>;
  onNavigate: (screen: ScreenView) => void;
  onAddLead?: (lead: Omit<Lead, 'id'>) => Promise<string>;
  onUpdateLead?: (id: string, lead: Partial<Lead>) => Promise<void>;
  onDeleteLead?: (id: string) => Promise<void>;
  onConfirmLeadToPos?: (lead: Lead) => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  sales,
  payments,
  leads = [],
  teamMembers = [],
  currentUser,
  initialScreen = 'clients',
  onDeleteClient,
  onUpdateClient,
  onAddPayment,
  onDeletePayment,
  onEditSale,
  onDeleteSale,
  onNavigate,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onConfirmLeadToPos,
}) => {
  const canViewClients = isScreenAllowedForUser(currentUser, 'clients');
  const canViewLeads = isScreenAllowedForUser(currentUser, 'leads');

  const getInitialTab = (): 'actual' | 'leads' => {
    if (initialScreen === 'leads' && canViewLeads) return 'leads';
    if (canViewClients) return 'actual';
    if (canViewLeads) return 'leads';
    return 'actual';
  };

  const [activeTab, setActiveTab] = useState<'actual' | 'leads'>(getInitialTab);

  useEffect(() => {
    if (initialScreen === 'leads' && canViewLeads) {
      setActiveTab('leads');
    } else if (initialScreen === 'clients' && canViewClients) {
      setActiveTab('actual');
    } else if (!canViewClients && canViewLeads) {
      setActiveTab('leads');
    } else if (canViewClients && !canViewLeads) {
      setActiveTab('actual');
    }
  }, [initialScreen, canViewClients, canViewLeads]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('الكل');
  const [statementClient, setStatementClient] = useState<Client | null>(null);

  // Accordion for expanded client details (Payments & Sales history)
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Payment Modal State
  const [addPaymentClient, setAddPaymentClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [selectedPaymentSaleId, setSelectedPaymentSaleId] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: '',
  });

  const isOwner = !currentUser || currentUser.position === 'owner';

  const accessibleClients = clients.filter((c) => {
    if (isOwner) return true;
    const assigned = currentUser.assignedClientIds || [];
    return assigned.includes(c.id);
  });

  const filteredClients = accessibleClients.filter((c) => {
    const matchesSearch =
      c.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchesSystem = selectedSystemFilter === 'الكل' || c.system === selectedSystemFilter;
    return matchesSearch && matchesSystem;
  });

  const getClientSalesTotal = (client: Client) => {
    return sales
      .filter((s) => s.clientId === client.id || s.shopName === client.shopName || s.clientName === client.name)
      .reduce((sum, s) => sum + (s.finalInvoice || 0), 0);
  };

  const getClientPaymentsTotal = (client: Client) => {
    const initialPaidSales = sales
      .filter((s) => s.clientId === client.id || s.shopName === client.shopName || s.clientName === client.name)
      .reduce((sum, s) => sum + (s.paidAmount || 0), 0);

    const loggedPayments = payments
      .filter((p) => p.clientId === client.id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return initialPaidSales + loggedPayments;
  };

  const getClientDebt = (client: Client) => {
    const totalInvoices = getClientSalesTotal(client);
    const totalPaid = getClientPaymentsTotal(client);
    return Math.max(0, totalInvoices - totalPaid);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPaymentClient) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('رجاءً أدخل مبلغ صحيح للدفعة.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await onAddPayment({
        clientId: addPaymentClient.id,
        clientName: addPaymentClient.name || addPaymentClient.shopName,
        saleId: selectedPaymentSaleId || undefined,
        amount: amt,
        date: paymentDate || new Date().toISOString().split('T')[0],
        note: paymentNote.trim() || undefined,
        createdAt: new Date().toISOString(),
      });

      // Reset & Close
      setAddPaymentClient(null);
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedPaymentSaleId('');
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('حدث خطأ أثناء تسجيل الدفعة.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center">
            {activeTab === 'leads' ? <Target className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {activeTab === 'leads' ? 'إدارة ومتابعة العملاء المحتملين (Leads)' : 'إدارة ورعاية العملاء والتحصيلات'}
            </h2>
            <p className="text-[11px] text-gray-300">
              {activeTab === 'leads'
                ? `إجمالي ${leads.length} عميل محتمل مسجل`
                : isOwner
                ? `إجمالي ${clients.length} عميل مسجل`
                : `العملاء المسندون إليك: ${accessibleClients.length} من أصل ${clients.length}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'actual' && canViewClients && (
            <>
              <button
                onClick={() => exportClientsToExcel(clients, sales)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="تصدير دليل العملاء إلى Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">تصدير Excel</span>
              </button>
              <button
                onClick={() => onNavigate('add-client')}
                className="btn-orange px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md"
              >
                <Plus className="w-4 h-4" /> إضافة عميل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher: Only render if user has permissions for BOTH actual clients and leads */}
      {canViewClients && canViewLeads && (
        <div className="flex items-center gap-2 bg-[#121C30]/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('actual')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'actual'
                ? 'bg-[#FF7A1A] text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>العملاء الفعليون ({accessibleClients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'leads'
                ? 'bg-[#FF7A1A] text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>العملاء المحتملون (Leads)</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 text-white font-extrabold">
              {leads.length}
            </span>
          </button>
        </div>
      )}

      {activeTab === 'leads' ? (
        <LeadsManager
          leads={leads}
          clients={clients}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onAddLead={onAddLead || (async () => '')}
          onUpdateLead={onUpdateLead || (async () => {})}
          onUpdateClient={onUpdateClient}
          onDeleteLead={onDeleteLead || (async () => {})}
          onConfirmLeadToPos={onConfirmLeadToPos || (() => {})}
        />
      ) : (
        <>
          {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="ابحث باسم المحل أو المالك أو رقم الموبايل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pr-9 pl-3 py-2.5 text-xs"
          />
        </div>

        {/* System Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['الكل', 'محلات', 'شركات', 'صالات جيم', 'برامج', 'أخرى'].map((sys) => (
            <button
              key={sys}
              onClick={() => setSelectedSystemFilter(sys)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSystemFilter === sys
                  ? 'bg-[#FF7A1A] text-white'
                  : 'glass-button text-gray-300'
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-2.5">
        {filteredClients.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-xs">
            لا يوجد عملاء مطابقين للبحث.
          </div>
        ) : (
          filteredClients.map((client) => {
            const totalSales = getClientSalesTotal(client);
            const totalPaid = getClientPaymentsTotal(client);
            const totalDebt = getClientDebt(client);
            const formattedPhone = client.phone.replace(/[^0-9]/g, '');
            const waNumber = formattedPhone.startsWith('0') ? `2${formattedPhone}` : formattedPhone;

            const clientPayments = payments.filter((p) => p.clientId === client.id);
            const clientSalesList = sales.filter(
              (s) => s.clientId === client.id || s.shopName === client.shopName || s.clientName === client.name
            );

            const isExpanded = expandedClientId === client.id;

            return (
              <div key={client.id} className="glass-card p-4 space-y-3 relative border-r-2 border-r-[#FF7A1A]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#FF7A1A]" />
                      {client.shopName}
                    </h3>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      المالك: <span className="text-white font-medium">{client.name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-[#FF7A1A]/15 text-[#FF7A1A] px-2 py-0.5 rounded-full font-semibold">
                      {client.system}
                    </span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                      {client.category}
                    </span>
                  </div>
                </div>

                {client.address && (
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    {client.address}
                  </p>
                )}

                {/* Financial Summary for Client */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-black/30 text-center">
                  <div>
                    <span className="text-[9px] text-gray-400 block">إجمالي التعاملات</span>
                    <span className="text-xs font-bold text-white">{totalSales.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block">المسدد والتحصيلات</span>
                    <span className="text-xs font-bold text-emerald-400">{totalPaid.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block">المتبقي (دين)</span>
                    <span className={`text-xs font-bold ${totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {totalDebt.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>

                {/* Contact & Actions Row */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Record Payment Button */}
                    <button
                      onClick={() => setAddPaymentClient(client)}
                      className="btn-orange px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>تسجيل دفعة جديدة</span>
                    </button>

                    <button
                      onClick={() => setStatementClient(client)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                      title="استخراج وطباعة كشف حساب PDF رسمي للعميل"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#FF7A1A]" />
                      <span>كشف حساب</span>
                    </button>

                    {client.phone && (
                      <>
                        <a
                          href={`tel:${client.phone}`}
                          className="glass-button px-2 py-1 text-[11px] text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/10"
                        >
                          <Phone className="w-3 h-3" /> اتصال
                        </a>
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-button px-2 py-1 text-[11px] text-emerald-400 flex items-center gap-1 hover:bg-emerald-500/10"
                        >
                          <MessageSquare className="w-3 h-3" /> واتساب
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Details (Sales & Payments history) */}
                    <button
                      onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                      className="text-[11px] text-[#FF7A1A] font-medium flex items-center gap-1 hover:underline"
                    >
                      <span>{isExpanded ? 'إخفاء التفاصيل' : `سجل الدفعات والمبيعات (${clientPayments.length + clientSalesList.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        setDeleteModalState({
                          isOpen: true,
                          clientId: client.id,
                          clientName: client.shopName || client.name,
                        });
                      }}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="حذف العميل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Payments History & Sales History */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/10 space-y-3 bg-black/20 p-3 rounded-xl animate-fade-in">
                    {/* 1. Payments History */}
                    <div>
                      <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <CreditCard className="w-3.5 h-3.5" /> سجل الدفعات والتحصيلات المسجلة ({clientPayments.length})
                      </h4>
                      {clientPayments.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">لم يتم تسجيل أي دفعات فرعية يدوية لهذا العميل بعد.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {clientPayments.map((pay) => (
                            <div key={pay.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                              <div>
                                <span className="font-bold text-emerald-300">{pay.amount.toLocaleString('ar-EG')} ج.م</span>
                                {pay.note && <span className="text-[10px] text-gray-300 mr-2">({pay.note})</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">{pay.date}</span>
                                <button
                                  onClick={() => onDeletePayment(pay.id)}
                                  className="text-red-400 hover:text-red-300 p-0.5"
                                  title="حذف الدفعة"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Sales History */}
                    <div>
                      <h4 className="text-[11px] font-bold text-[#FF7A1A] flex items-center gap-1.5 mb-2">
                        <Receipt className="w-3.5 h-3.5" /> سجل عمليات البيع بالفواتير ({clientSalesList.length})
                      </h4>
                      {clientSalesList.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">لا توجد عمليات بيع مسجلة لهذا العميل.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {clientSalesList.map((sale) => (
                            <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                              <div>
                                <span className="font-semibold text-white">{sale.packageName}</span>
                                <span className="text-[10px] text-gray-400 block">
                                  إجمالي: {sale.finalInvoice.toLocaleString('ar-EG')} ج.م | مدفوع: {sale.paidAmount.toLocaleString('ar-EG')} ج.م
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400">{sale.date}</span>
                                <button
                                  onClick={() => onEditSale(sale)}
                                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-[#FF7A1A]"
                                  title="تعديل العملية"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('هل أنت تأكد من حذف هذه العملية؟ ستقوم العملية بتعديل الإحصائيات والأرقام تلقائياً.')) {
                                      onDeleteSale(sale.id);
                                    }
                                  }}
                                  className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300"
                                  title="حذف العملية"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Register Payment Modal */}
      {addPaymentClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-5 space-y-4 border border-[#FF7A1A] animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> تسجيل دفعة للعميل
              </h3>
              <button
                onClick={() => setAddPaymentClient(null)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-xs text-gray-200">
              العميل: <strong className="text-white">{addPaymentClient.shopName || addPaymentClient.name}</strong>
              <div className="text-[11px] text-amber-300 mt-0.5">
                الدين المستحق حالياً: <strong>{getClientDebt(addPaymentClient).toLocaleString('ar-EG')} ج.م</strong>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">المبلغ المدفوع (ج.م) *</label>
                <input
                  type="number"
                  required
                  placeholder="مثال: 1500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="glass-input w-full p-2.5 text-sm text-center font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">تاريخ التسديد</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">ملاحظات / طريقة الدفع (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كاش / تحويل فودافون كاش / انستاباي"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="glass-input w-full p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="btn-orange flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'جاري الحفظ...' : 'تأكيد وحفظ الدفعة'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddPaymentClient(null)}
                  className="glass-button py-2.5 px-4 rounded-xl text-xs text-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementClient && (
        <ClientStatementModal
          client={statementClient}
          sales={sales}
          onClose={() => setStatementClient(null)}
        />
      )}

      <ProtectedDeleteModal
        isOpen={deleteModalState.isOpen}
        title="حذف عميل من الدليل"
        itemDescription={`العميل: "${deleteModalState.clientName}"`}
        onConfirmDelete={() => onDeleteClient(deleteModalState.clientId)}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />
        </>
      )}
    </div>
  );
};
