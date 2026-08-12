import React, { useState, useMemo } from 'react';
import { Target, Search, Plus, Phone, MessageSquare, Edit3, Trash2, CheckCircle2, UserCheck, Clock, ShieldCheck, Tag, FileText, AlertTriangle } from 'lucide-react';
import { Lead, Client, TeamMember, SystemType, CategoryType, getCategoriesForSystem, SYSTEM_CATEGORIES_MAP } from '../types';
import { ProtectedDeleteModal } from './ProtectedDeleteModal';
import { checkPhoneDuplicate } from '../lib/phoneCheck';
import { DuplicatePhoneAlert } from './DuplicatePhoneAlert';
import { RecordDetailsModal } from './RecordDetailsModal';

interface LeadsManagerProps {
  leads: Lead[];
  clients?: Client[];
  teamMembers: TeamMember[];
  currentUser?: TeamMember | null;
  onAddLead: (lead: Omit<Lead, 'id'>) => Promise<string>;
  onUpdateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  onUpdateClient?: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onConfirmLeadToPos: (lead: Lead) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({
  leads,
  clients = [],
  teamMembers,
  currentUser,
  onAddLead,
  onUpdateLead,
  onUpdateClient,
  onDeleteLead,
  onConfirmLeadToPos,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'محتمل' | 'مؤكد'>('all');
  const [systemFilter, setSystemFilter] = useState<string>('الكل');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('محلات');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('سوبر ماركت');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissedDuplicate, setIsDismissedDuplicate] = useState(false);

  const [modalRecordState, setModalRecordState] = useState<{
    isOpen: boolean;
    type: 'client' | 'lead' | null;
    record: Client | Lead | null;
  }>({ isOpen: false, type: null, record: null });

  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
  }>({
    isOpen: false,
    leadId: '',
    leadName: '',
  });

  const isOwner = !currentUser || currentUser.position === 'owner';

  // Deduplicate team members for follow-up assignment list
  const uniqueTeamMembers = useMemo(() => {
    const seen = new Set<string>();
    return (teamMembers || []).filter((m) => {
      const key = m.id || m.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [teamMembers]);

  const phoneDuplicate = useMemo(
    () => checkPhoneDuplicate(phone, clients, leads, editingLeadId || undefined),
    [phone, clients, leads, editingLeadId]
  );
  const canConfirmLeads = isOwner || Boolean(currentUser?.permissions?.canConfirmLeads);

  // Visibility Filter: Owner sees all; staff sees assigned leads
  const visibleLeads = leads.filter((lead) => {
    if (isOwner) return true;
    const assigned = lead.assignedEmployeeIds || [];
    if (currentUser?.id && assigned.includes(currentUser.id)) return true;
    return false;
  });

  const filteredLeads = visibleLeads.filter((lead) => {
    const query = searchTerm.toLowerCase();
    const matchesQuery =
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      (lead.notes || '').toLowerCase().includes(query) ||
      lead.system.toLowerCase().includes(query) ||
      lead.category.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSystem = systemFilter === 'الكل' || lead.system === systemFilter;

    return matchesQuery && matchesStatus && matchesSystem;
  });

  const handleOpenAddModal = () => {
    setEditingLeadId(null);
    setName('');
    setPhone('');
    setNotes('');
    setSelectedSystem('محلات');
    setSelectedCategory('سوبر ماركت');
    setAssignedEmployeeIds(currentUser ? [currentUser.id] : []);
    setShowModal(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setName(lead.name);
    setPhone(lead.phone);
    setNotes(lead.notes || '');
    setSelectedSystem(lead.system);
    setSelectedCategory(lead.category);
    setAssignedEmployeeIds(lead.assignedEmployeeIds || []);
    setShowModal(true);
  };

  const handleSystemChange = (sys: SystemType) => {
    setSelectedSystem(sys);
    const cats = getCategoriesForSystem(sys);
    if (cats.length > 0) {
      setSelectedCategory(cats[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('رجاءً أدخل اسم العميل المحتمل');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Lead, 'id'> = {
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        system: selectedSystem,
        category: selectedCategory,
        assignedEmployeeIds,
        status: editingLeadId ? (leads.find((l) => l.id === editingLeadId)?.status || 'محتمل') : 'محتمل',
        createdAt: editingLeadId ? (leads.find((l) => l.id === editingLeadId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      };

      if (editingLeadId) {
        await onUpdateLead(editingLeadId, payload);
      } else {
        await onAddLead(payload);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving lead:', err);
      alert('حدث خطأ أثناء حفظ العميل المحتمل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCleanPhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('01')) clean = '2' + clean;
    return clean;
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              العملاء المحتملون (Leads)
              <span className="px-2 py-0.5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] text-xs font-bold border border-[#FF7A1A]/30">
                {visibleLeads.length}
              </span>
            </h3>
            <p className="text-[11px] text-gray-300">
              {isOwner
                ? 'عرض كافة العملاء المحتملين المسجلين في النظام'
                : 'عرض العملاء المحتملين المسندين لحسابك فقط'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-orange px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل محتمل جديد</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، القطاع أو التفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pr-9 pl-3 py-2 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="md:col-span-4 flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-[#FF7A1A] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            الكل ({visibleLeads.length})
          </button>
          <button
            onClick={() => setStatusFilter('محتمل')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'محتمل' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            محتمل ({visibleLeads.filter((l) => l.status === 'محتمل').length})
          </button>
          <button
            onClick={() => setStatusFilter('مؤكد')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'مؤكد' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            مؤكد ({visibleLeads.filter((l) => l.status === 'مؤكد').length})
          </button>
        </div>

        {/* System Filter */}
        <div className="md:col-span-3">
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="glass-input w-full p-2 text-xs font-semibold text-gray-200"
          >
            <option value="الكل" className="bg-[#0B1220]">كل القطاعات</option>
            {Object.keys(SYSTEM_CATEGORIES_MAP).map((sys) => (
              <option key={sys} value={sys} className="bg-[#0B1220]">{sys}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads List Grid */}
      {filteredLeads.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-3">
          <Target className="w-10 h-10 text-gray-500 mx-auto" />
          <p className="text-xs text-gray-400">لا يوجد عملاء محتملون مطابقون للبحث أو الفلتر الحرير.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredLeads.map((lead) => {
            const isConfirmed = lead.status === 'مؤكد';
            const assignedMembers = teamMembers.filter((m) =>
              (lead.assignedEmployeeIds || []).includes(m.id)
            );

            return (
              <div
                key={lead.id}
                className={`glass-card p-4 space-y-3 border transition-all ${
                  isConfirmed
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent'
                    : 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white">{lead.name}</h4>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isConfirmed ? '✓ مؤكد' : '⏳ محتمل'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#FF7A1A] font-bold">
                        {lead.system} • {lead.category}
                      </span>
                    </div>
                  </div>

                  {/* Phone Quick Actions */}
                  {lead.phone && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`https://wa.me/${getCleanPhone(lead.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                        title="مراسلة عبر الواتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors"
                        title="اتصال تلفوني"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Notes & Inquiry Details */}
                {lead.notes && (
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#FF7A1A]" />
                      تفاصيل الاستفسار والاحتياجات:
                    </span>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {/* Assigned Employees List */}
                {assignedMembers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-400" />
                      المسند إليهم:
                    </span>
                    {assignedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-semibold"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-white/10 gap-2">
                  {/* Primary Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isConfirmed && (
                      <button
                        type="button"
                        onClick={() => onUpdateLead(lead.id, { status: 'مؤكد' })}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="تحديث الحالة إلى مؤكد فورًا"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مؤكد</span>
                      </button>
                    )}

                    {!isConfirmed && canConfirmLeads ? (
                      <button
                        type="button"
                        onClick={() => onConfirmLeadToPos(lead)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#FF7A1A] to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        title="تحويل العميل المحتمل إلى عميل فعلي وفتح نقطة البيع (POS)"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>تحويل لعميل فعلي / تسجيل بيع</span>
                      </button>
                    ) : isConfirmed ? (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم تأكيد هذا العميل بنجاح</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Secondary Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(lead)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="تعديل العميل المحتمل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteModalState({
                            isOpen: true,
                            leadId: lead.id,
                            leadName: lead.name,
                          })
                        }
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-colors cursor-pointer"
                        title="حذف العميل المحتمل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-5 space-y-4 border border-[#FF7A1A]/50 max-h-[85vh] overflow-y-auto relative my-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF7A1A]" />
                {editingLeadId ? 'تعديل بيانات العميل المحتمل' : 'إضافة عميل محتمل جديد (Lead)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-bold">اسم العميل المحتمل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-bold">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="مثال: 01012345678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsDismissedDuplicate(false);
                    }}
                    className="glass-input w-full p-2.5 text-xs font-bold dir-ltr"
                  />
                  <DuplicatePhoneAlert
                    phoneDuplicate={phoneDuplicate}
                    clients={clients}
                    leads={leads}
                    isDismissed={isDismissedDuplicate}
                    onContinueAnyway={() => setIsDismissedDuplicate(true)}
                    onViewEditRecord={(type, rec) => {
                      setModalRecordState({
                        isOpen: true,
                        type,
                        record: rec,
                      });
                    }}
                  />
                </div>
              </div>

              {/* System & Category selection */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-bold">القطاع المهتم به</label>
                  <select
                    value={selectedSystem}
                    onChange={(e) => handleSystemChange(e.target.value as SystemType)}
                    className="glass-input w-full p-2.5 text-xs font-bold text-gray-200"
                  >
                    {Object.keys(SYSTEM_CATEGORIES_MAP).map((sys) => (
                      <option key={sys} value={sys} className="bg-[#0B1220]">{sys}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-bold">القسم الفرعي</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs font-bold text-gray-200"
                  >
                    {getCategoriesForSystem(selectedSystem).map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0B1220]">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inquiry Notes */}
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block font-bold">تفاصيل الاستفسار واحتياجات العميل</label>
                <textarea
                  rows={3}
                  placeholder="اكتب استفسارات العميل، الأنظمة والمعدات المطلوبة، تاريخ المتابعة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs"
                />
              </div>

              {/* Assigned Employees Selection */}
              {isOwner && (
                <div>
                  <label className="text-[11px] text-gray-300 mb-1 block font-bold">إسناد الموظفين المتابعين للـ Lead</label>
                  <div className="max-h-36 overflow-y-auto p-2 bg-black/30 rounded-xl border border-white/5 space-y-1">
                    {uniqueTeamMembers.map((m) => {
                      const isAssigned = assignedEmployeeIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                            isAssigned ? 'bg-[#FF7A1A]/20 border border-[#FF7A1A]/40 text-white' : 'bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => {
                                if (isAssigned) {
                                  setAssignedEmployeeIds(assignedEmployeeIds.filter((id) => id !== m.id));
                                } else {
                                  setAssignedEmployeeIds([...assignedEmployeeIds, m.id]);
                                }
                              }}
                              className="w-4 h-4 accent-[#FF7A1A] rounded"
                            />
                            <span>{m.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{m.position}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-orange flex-1 py-2.5 rounded-xl text-xs font-bold shadow-lg"
                >
                  {editingLeadId ? 'حفظ التعديلات' : 'إضافة العميل المحتمل'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="glass-button flex-1 py-2.5 rounded-xl text-xs text-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lead Protected Modal */}
      <ProtectedDeleteModal
        isOpen={deleteModalState.isOpen}
        title="حذف عميل محتمل"
        itemDescription={`العميل المحتمل: "${deleteModalState.leadName}"`}
        onConfirmDelete={() => onDeleteLead(deleteModalState.leadId)}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={modalRecordState.isOpen}
        recordType={modalRecordState.type}
        record={modalRecordState.record}
        onClose={() => setModalRecordState({ isOpen: false, type: null, record: null })}
        onUpdateClient={onUpdateClient}
        onUpdateLead={onUpdateLead}
      />
    </div>
  );
};
