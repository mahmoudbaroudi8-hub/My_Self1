import React, { useState } from 'react';
import { Users, Search, Phone, MessageSquare, MapPin, Store, Trash2, Plus, Receipt, FileSpreadsheet, FileText } from 'lucide-react';
import { Client, Sale, ScreenView } from '../types';
import { exportClientsToExcel } from '../lib/excelExport';
import { ProtectedDeleteModal } from './ProtectedDeleteModal';
import { ClientStatementModal } from './ClientStatementModal';

interface ClientsScreenProps {
  clients: Client[];
  sales: Sale[];
  onDeleteClient: (id: string) => Promise<void>;
  onNavigate: (screen: ScreenView) => void;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  sales,
  onDeleteClient,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('الكل');
  const [statementClient, setStatementClient] = useState<Client | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: '',
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchesSystem = selectedSystemFilter === 'الكل' || c.system === selectedSystemFilter;
    return matchesSearch && matchesSystem;
  });

  const getClientSalesTotal = (clientId: string) => {
    return sales
      .filter((s) => s.clientId === clientId || s.clientName === clientId)
      .reduce((sum, s) => sum + (s.finalInvoice || 0), 0);
  };

  const getClientDebt = (clientId: string) => {
    return sales
      .filter((s) => s.clientId === clientId || s.clientName === clientId)
      .reduce((sum, s) => {
        const debt = (s.finalInvoice || 0) - (s.paidAmount || 0);
        return sum + (debt > 0 ? debt : 0);
      }, 0);
  };

  return (
    <div className="space-y-3.5 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">إدارة ورعاية العملاء</h2>
            <p className="text-[11px] text-gray-300">إجمالي {clients.length} عميل مسجل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

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
            const totalSales = getClientSalesTotal(client.id);
            const totalDebt = getClientDebt(client.id);
            const formattedPhone = client.phone.replace(/[^0-9]/g, '');
            const waNumber = formattedPhone.startsWith('0') ? `2${formattedPhone}` : formattedPhone;

            return (
              <div key={client.id} className="glass-card p-4 space-y-2.5 relative border-r-2 border-r-[#FF7A1A]">
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
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-black/20 text-center">
                  <div>
                    <span className="text-[9px] text-gray-400 block">إجمالي التعاملات</span>
                    <span className="text-xs font-bold text-white">{totalSales.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block">المتبقي (ديون)</span>
                    <span className={`text-xs font-bold ${totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {totalDebt.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setStatementClient(client)}
                      className="px-2.5 py-1 bg-[#FF7A1A]/20 hover:bg-[#FF7A1A]/30 text-[#FF7A1A] border border-[#FF7A1A]/40 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                      title="استخراج وطباعة كشف حساب PDF رسمي للعميل"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>كشف حساب PDF</span>
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
            );
          })
        )}
      </div>

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
    </div>
  );
};
