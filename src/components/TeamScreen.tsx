import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Edit3,
  Trash2,
  Lock,
  Percent,
  CheckCircle2,
  XCircle,
  Key,
  Briefcase,
  UserCheck,
  Award,
  DollarSign,
  AlertCircle,
  Phone,
  MessageSquare,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  LayoutGrid,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import {
  TeamMember,
  TeamMemberPosition,
  POSITION_LABELS,
  ProjectItem,
  ScreenView,
  ALL_SCREENS_CONFIG,
} from '../types';
import { resetTeamToOwnerOnly } from '../lib/firebase';

interface TeamScreenProps {
  teamMembers: TeamMember[];
  projects: ProjectItem[];
  currentUser: TeamMember | null;
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<string>;
  onUpdateTeamMember: (id: string, member: Partial<TeamMember>) => Promise<void>;
  onDeleteTeamMember: (id: string) => Promise<void>;
  onSwitchUser: (member: TeamMember) => void;
  onOpenBackup?: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({
  teamMembers = [],
  projects = [],
  currentUser,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  onSwitchUser,
  onOpenBackup,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('new');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [position, setPosition] = useState<TeamMemberPosition>('engineer');
  const [customPositionTitle, setCustomPositionTitle] = useState<string>('');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);
  const [pinCode, setPinCode] = useState<string>('1234');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Allowed screens state
  const [allowedScreens, setAllowedScreens] = useState<ScreenView[]>([
    'home',
    'pos',
    'sales',
    'clients',
    'packages',
    'sector',
    'expenses',
    'reports',
    'team',
    'add-client',
  ]);

  // Permissions state
  const [canManageProjects, setCanManageProjects] = useState<boolean>(true);
  const [canManageSales, setCanManageSales] = useState<boolean>(false);
  const [canManagePackages, setCanManagePackages] = useState<boolean>(true);
  const [canViewExpenses, setCanViewExpenses] = useState<boolean>(false);
  const [canManageTeam, setCanManageTeam] = useState<boolean>(false);
  const [canViewReports, setCanViewReports] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // UI helpers for password sheet table
  const [showSheetTable, setShowSheetTable] = useState<boolean>(true);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // PIN Verification Modal State for switching user
  const [switchTarget, setSwitchTarget] = useState<TeamMember | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPinToClipboard = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMemberId(member.id);
    setName(member.name);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setWhatsappPhone(member.whatsappPhone || member.phone || '');
    setUsername(member.username || '');
    setPassword(member.password || '');
    setPosition(member.position);
    setCustomPositionTitle(member.customPositionTitle || '');
    setDefaultCommissionRate(member.defaultCommissionRate ?? 10);
    setPinCode(member.pinCode || '1234');
    setIsActive(member.isActive !== false);

    setAllowedScreens(
      member.allowedScreens || [
        'home',
        'pos',
        'sales',
        'clients',
        'packages',
        'sector',
        'expenses',
        'reports',
        'team',
        'add-client',
      ]
    );

    setCanManageProjects(member.permissions?.canManageProjects ?? true);
    setCanManageSales(member.permissions?.canManageSales ?? false);
    setCanManagePackages(member.permissions?.canManagePackages ?? false);
    setCanViewExpenses(member.permissions?.canViewExpenses ?? false);
    setCanManageTeam(member.permissions?.canManageTeam ?? false);
    setCanViewReports(member.permissions?.canViewReports ?? true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleResetForm = () => {
    setSelectedMemberId('new');
    setName('');
    setEmail('');
    setPhone('');
    setWhatsappPhone('');
    setUsername('');
    setPassword('');
    setPosition('engineer');
    setCustomPositionTitle('');
    setDefaultCommissionRate(10);
    setPinCode('1234');
    setIsActive(true);

    setAllowedScreens([
      'home',
      'pos',
      'sales',
      'clients',
      'packages',
      'sector',
      'expenses',
      'reports',
      'team',
      'add-client',
    ]);

    setCanManageProjects(true);
    setCanManageSales(false);
    setCanManagePackages(true);
    setCanViewExpenses(false);
    setCanManageTeam(false);
    setCanViewReports(true);
  };

  const toggleScreenPermission = (screenId: ScreenView) => {
    if (allowedScreens.includes(screenId)) {
      setAllowedScreens(allowedScreens.filter((s) => s !== screenId));
    } else {
      setAllowedScreens([...allowedScreens, screenId]);
    }
  };

  const handleResetToOwnerOnly = async () => {
    if (
      window.confirm(
        'هل تريد مسح كافة الحسابات وإعادة الضبط لحساب صاحب المشروع "البارودي" فقط برقم السير 297062؟'
      )
    ) {
      try {
        setIsSubmitting(true);
        await resetTeamToOwnerOnly();
        setStatusMessage({
          text: 'تمت إعادة ضبط الفريق لحساب "البارودي" فقط بنجاح (PIN: 297062)',
          type: 'success',
        });
      } catch (err) {
        console.error('Error resetting team:', err);
        setStatusMessage({ text: 'حدث خطأ أثناء إعادة الضبط', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ text: 'يرجى إدخال اسم العضو بالكامل', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const memberPayload: Omit<TeamMember, 'id'> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsappPhone: whatsappPhone.trim() || phone.trim(),
        username: username.trim() || email.trim() || name.trim().toLowerCase().replace(/\s+/g, ''),
        password: password.trim() || pinCode.trim() || '1234',
        position,
        customPositionTitle: position === 'custom' ? customPositionTitle.trim() : '',
        defaultCommissionRate: Number(defaultCommissionRate) ?? 10,
        defaultCommissionPercent: Number(defaultCommissionRate) ?? 10,
        pinCode: pinCode.trim() || '1234',
        isActive,
        allowedScreens,
        permissions: {
          canManageProjects,
          canManageSales,
          canManagePackages,
          canViewExpenses,
          canManageTeam,
          canViewReports,
        },
        createdAt: new Date().toISOString(),
      };

      if (selectedMemberId === 'new') {
        await onAddTeamMember(memberPayload);
        setStatusMessage({ text: 'تمت إضافة عضو الفريق بنجاح إلى قاعدة البيانات!', type: 'success' });
      } else {
        await onUpdateTeamMember(selectedMemberId, memberPayload);
        setStatusMessage({ text: 'تم تحديث بيانات ومستويات صلاحية العضو بنجاح!', type: 'success' });
      }

      handleResetForm();
    } catch (err) {
      console.error('Error saving team member:', err);
      setStatusMessage({ text: 'حدث خطأ أثناء التعديل أو الإضافة', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (window.confirm(`هل أنت متأكد من مسح وإزالة العضو "${memberName}" نهائياً من الفريق والقاعدة؟`)) {
      try {
        setIsSubmitting(true);
        await onDeleteTeamMember(id);
        setStatusMessage({ text: `تم حذف العضو "${memberName}" بنجاح!`, type: 'success' });
        if (selectedMemberId === id) {
          handleResetForm();
        }
      } catch (err) {
        console.error('Error deleting team member:', err);
        setStatusMessage({ text: 'حدث خطأ أثناء محاولة حذف العضو', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleVerifySwitchPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTarget) return;

    const correctPin = switchTarget.pinCode || '1234';
    if (enteredPin.trim() === correctPin) {
      if (onSwitchUser) onSwitchUser(switchTarget);
      setSwitchTarget(null);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('رمز PIN غير صحيح، حاول مرة أخرى');
    }
  };

  // Calculate earnings summary per member from assigned projects
  const getMemberFinancialSummary = (member: TeamMember) => {
    let assignedProjectsCount = 0;
    let totalCommissionsEarned = 0;

    (projects || []).forEach((prj) => {
      const price = prj.totalPrice || 0;
      const paid = prj.paidAmount || 0;

      // Engineer commission
      if (prj.assignedEngineerId === member.id) {
        assignedProjectsCount++;
        const rate = prj.engineerCommissionRate ?? member.defaultCommissionRate;
        totalCommissionsEarned += (paid * rate) / 100;
      }

      // Media buyer commission
      if (prj.assignedMediaBuyerId === member.id) {
        if (prj.assignedEngineerId !== member.id) {
          assignedProjectsCount++;
        }
        const rate = prj.mediaBuyerCommissionRate ?? member.defaultCommissionRate;
        totalCommissionsEarned += (paid * rate) / 100;
      }

      // Owner overall commission
      if (member.position === 'owner') {
        const ownerRate = prj.ownerCommissionRate ?? 50;
        totalCommissionsEarned += (paid * ownerRate) / 100;
        if (prj.ownerIsEngineer && prj.assignedEngineerId === member.id) {
          const engRate = prj.engineerCommissionRate ?? 30;
          totalCommissionsEarned += (paid * engRate) / 100;
        }
      }
    });

    return { assignedProjectsCount, totalCommissionsEarned };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Active User Info */}
      <div className="glass-card p-4 space-y-3 bg-gradient-to-r from-[#0E1B33] via-[#122242] to-[#0E1B33] border-2 border-[#FF7A1A]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A1A]/20 border border-[#FF7A1A]/50 flex items-center justify-center text-[#FF7A1A] shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">إدارة الفريق، البوسيشن والصلاحيات</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مؤمن بداتا بيز
                </span>
              </div>
              <p className="text-xs text-gray-300">
                تسجيل دخول الموظفين والمهندسين والميديا مان، وتخصيص نسب الأرباح وصلاحيات الإدارة
              </p>
            </div>
          </div>

          {/* Current Active Account Card & Quick Actions */}
          {currentUser && (
            <div className="bg-black/40 px-3.5 py-2 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-[10px] text-gray-400 block">الحساب والمنصب النشط حالياً:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{currentUser.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF7A1A]/20 text-[#FF7A1A] border border-[#FF7A1A]/30">
                      {currentUser.position === 'custom'
                        ? currentUser.customPositionTitle || 'وظيفة مخصصة'
                        : POSITION_LABELS[currentUser.position]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onOpenBackup && (
                  <button
                    type="button"
                    onClick={onOpenBackup}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                    title="قاعدة البيانات والنسخ الاحتياطي (Backup & Restore)"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إدارة قاعدة البيانات والنسخ الاحتياطي</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetToOwnerOnly}
                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  title="حذف باقي الحسابات والاحتفاظ بـ 'البارودي' صاحب المشروع (297062) فقط"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الحسابات</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheet / Passwords & WhatsApp Overview Table */}
      <div className="glass-card p-4 space-y-3 bg-[#0B1220]/90 border border-emerald-500/30 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">جدول الحسابات، كلمات المرور والواتساب والصلاحيات الشامل</h2>
              <p className="text-[10px] text-gray-400">شيت يوضح جميع الموظفين، رموز PIN الخاصة بدخولهم، أرقام الواتساب للشاشات المتاحة</p>
            </div>
          </div>

          <button
            onClick={() => setShowSheetTable(!showSheetTable)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 font-bold"
          >
            {showSheetTable ? 'إخفاء الشيت' : 'عرض الشيت'}
          </button>
        </div>

        {showSheetTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-300 font-bold border-b border-white/10">
                  <th className="p-2.5">الموظف / الوظيفة</th>
                  <th className="p-2.5">رمز الدخول (PIN)</th>
                  <th className="p-2.5">الواتساب والتواصل</th>
                  <th className="p-2.5">الشاشات المسموح بها</th>
                  <th className="p-2.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamMembers.map((m) => {
                  const showPin = visiblePins[m.id];
                  const pinText = m.pinCode || '1234';
                  const wa = m.whatsappPhone || m.phone || '';
                  const waClean = wa.replace(/[^0-9]/g, '');

                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-extrabold text-white">
                        <div className="flex items-center gap-2">
                          <span>{m.position === 'owner' ? '👑' : '👤'}</span>
                          <div>
                            <div>{m.name}</div>
                            <span className="text-[10px] text-[#FF7A1A] font-bold">
                              {m.position === 'custom'
                                ? m.customPositionTitle || 'وظيفة مخصصة'
                                : POSITION_LABELS[m.position]}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 w-fit">
                          <span className="font-mono font-bold text-[#FF7A1A] tracking-wider text-xs">
                            {showPin ? pinText : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(m.id)}
                            className="p-1 hover:text-white text-gray-400"
                            title={showPin ? 'إخفاء PIN' : 'إظهار PIN'}
                          >
                            {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPinToClipboard(m.id, pinText)}
                            className="p-1 hover:text-emerald-400 text-gray-400"
                            title="نسخ PIN"
                          >
                            {copiedPinId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-2.5">
                        {waClean ? (
                          <a
                            href={`https://wa.me/${waClean.startsWith('2') ? waClean : '2' + waClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition-all dir-ltr"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{wa}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-500">غير محدد</span>
                        )}
                      </td>

                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {m.position === 'owner' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              كل الشاشات (مالك المشروع)
                            </span>
                          ) : m.allowedScreens && m.allowedScreens.length > 0 ? (
                            ALL_SCREENS_CONFIG.filter((s) => m.allowedScreens?.includes(s.id)).map((s) => (
                              <span
                                key={s.id}
                                className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20 text-[9px] font-semibold"
                              >
                                {s.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-500">لا يوجد شاشات مخصصة</span>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSwitchTarget(m);
                              setEnteredPin('');
                              setPinError('');
                            }}
                            className="p-1.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[10px] font-bold"
                            title="تسجيل الدخول بهذا الحساب"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSelectMember(m)}
                            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
                            title="تعديل الصلاحيات والبيانات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {m.position !== 'owner' && (
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px]"
                              title="حذف العضو نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Grid: Team Members List vs Manage/Add Member Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Team Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-gray-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF7A1A]" />
              أعضاء فريق العمل والوظائف ({teamMembers.length})
            </h2>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-xl bg-[#FF7A1A] hover:bg-[#ff8a33] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ إضافة عضو فريق جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {teamMembers.map((member) => {
              const { assignedProjectsCount, totalCommissionsEarned } = getMemberFinancialSummary(member);
              const isCurrent = currentUser?.id === member.id;

              return (
                <div
                  key={member.id}
                  className={`glass-card p-4 space-y-3 transition-all relative ${
                    isCurrent
                      ? 'border-2 border-[#FF7A1A] bg-gradient-to-r from-[#FF7A1A]/10 to-transparent shadow-lg shadow-[#FF7A1A]/10'
                      : 'border border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shadow-sm">
                        {member.position === 'owner' ? '👑' : member.position === 'media_buyer' ? '📢' : '💻'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-white">{member.name}</h3>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ الحساب الحالي
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#FF7A1A] font-bold">
                          {member.position === 'custom'
                            ? member.customPositionTitle || 'وظيفة مخصصة'
                            : POSITION_LABELS[member.position]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSwitchTarget(member);
                          setEnteredPin('');
                          setPinError('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="تبديل الحساب وتسجيل الدخول باسم هذا العضو"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>دخول كـ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                        title="تعديل البيانات والصلاحيات"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {member.position !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
                          title="حذف العضو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial & Commission Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-gray-400 block">النسبة الافتراضية للعمولة</span>
                      <span className="text-sm font-extrabold text-[#FF7A1A] flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        {member.defaultCommissionRate}%
                      </span>
                    </div>

                    <div className="bg-black/30 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-gray-400 block">أرباح ومستحقات المشاريع</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {totalCommissionsEarned.toLocaleString('ar-EG')} <span className="text-[10px]">ج.م</span>
                      </span>
                    </div>
                  </div>

                  {/* Permissions Pills */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-gray-400 font-medium block">الصلاحيات الممنوحة:</span>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {member.permissions?.canManageProjects && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          إدارة المشاريع
                        </span>
                      )}
                      {member.permissions?.canManageSales && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          إدارة المبيعات والسيستم
                        </span>
                      )}
                      {member.permissions?.canManagePackages && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          إدارة الباقات
                        </span>
                      )}
                      {member.permissions?.canManageTeam && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          إدارة الفريق والصلاحيات
                        </span>
                      )}
                      {member.permissions?.canViewReports && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-300 border border-gray-500/20">
                          التقارير
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Add/Edit Member & Permissions Form (5 cols) */}
        <div className="lg:col-span-5">
          <form
            ref={formRef}
            onSubmit={handleSaveMember}
            className="glass-card p-4 space-y-4 border border-[#FF7A1A]/30 sticky top-20"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF7A1A]" />
                {selectedMemberId === 'new' ? 'إضافة عضو جديد للفريق' : `تعديل صلاحيات: ${name}`}
              </h3>
              {selectedMemberId !== 'new' && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[10px] text-[#FF7A1A] hover:underline font-bold"
                >
                  + عضو جديد
                </button>
              )}
            </div>

            {statusMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                    : 'bg-red-500/20 border border-red-500/30 text-red-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">الاسم بالكامل *</label>
              <input
                type="text"
                required
                placeholder="مثال: م. أحمد مصطفى"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-semibold"
              />
            </div>

            {/* Role/Position Selector */}
            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">البوسيشن / الوظيفة الرئيسية *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as TeamMemberPosition)}
                className="glass-input w-full p-2.5 text-xs font-bold text-[#FF7A1A]"
              >
                <option value="owner">👑 صاحب المشروع ومطور (مدير عام)</option>
                <option value="engineer">💻 مهندس برمجيات</option>
                <option value="developer">⚡ مطور تطبيقات ونظم</option>
                <option value="sales">💼 مسؤول مبيعات (سيلز)</option>
                <option value="media_buyer">📢 ميديا مان / تسويق وإعلانات</option>
                <option value="custom">🛠️ وظيفة مخصصة أخرى</option>
              </select>
            </div>

            {position === 'custom' && (
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">عنوان الوظيفة المخصصة *</label>
                <input
                  type="text"
                  placeholder="مثال: مصمم واجهات UI/UX"
                  value={customPositionTitle}
                  onChange={(e) => setCustomPositionTitle(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-medium"
                />
              </div>
            )}

            {/* Account Credentials (Username & Password for employee login) */}
            <div className="grid grid-cols-2 gap-2.5 bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
              <div>
                <label className="text-[11px] font-bold text-amber-300 mb-1 block">اسم المستخدم للدخول</label>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs dir-ltr font-bold text-[#FF7A1A]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-amber-300 mb-1 block">كلمة المرور للدخول</label>
                <input
                  type="text"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs dir-ltr font-bold text-[#FF7A1A]"
                />
              </div>
            </div>

            {/* Email, Phone & WhatsApp */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="010..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs dir-ltr"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">رقم الواتساب المباشر</label>
                <input
                  type="text"
                  placeholder="010..."
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 mb-1 block">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full p-2.5 text-xs dir-ltr"
              />
            </div>

            {/* Default Commission & PIN */}
            <div className="grid grid-cols-2 gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">نسبة العمولة الافتراضية %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={defaultCommissionRate}
                  onChange={(e) => setDefaultCommissionRate(Number(e.target.value) || 0)}
                  className="glass-input w-full p-2.5 text-xs font-bold text-center text-[#FF7A1A]"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 mb-1 block">رمز PIN لدخول الحساب</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs font-bold text-center tracking-widest text-[#FF7A1A]"
                />
              </div>
            </div>

            {/* Allowed Screens Selector Section */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#FF7A1A] flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4" />
                  شاشات العرض المخصصة لهذا الموظف:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (allowedScreens.length === ALL_SCREENS_CONFIG.length) {
                      setAllowedScreens([]);
                    } else {
                      setAllowedScreens(ALL_SCREENS_CONFIG.map((s) => s.id));
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-white font-bold"
                >
                  {allowedScreens.length === ALL_SCREENS_CONFIG.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {ALL_SCREENS_CONFIG.map((sc) => {
                  const isChecked = allowedScreens.includes(sc.id);
                  return (
                    <label
                      key={sc.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#FF7A1A]/15 border-[#FF7A1A]/40 text-white font-bold'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleScreenPermission(sc.id)}
                        className="w-4 h-4 accent-[#FF7A1A] rounded"
                      />
                      <span className="text-[11px]">{sc.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Granular Permissions Section */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-gray-200 block">تحديد الصلاحيات المسموحة بالبرنامج:</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canManageProjects}
                    onChange={(e) => setCanManageProjects(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>📁 إدارة وتعديل معرض المشاريع والنماذج</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canManageSales}
                    onChange={(e) => setCanManageSales(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>💰 إنشاء وإدارة الفواتير والمبيعات</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canManagePackages}
                    onChange={(e) => setCanManagePackages(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>📦 إدارة الباقات والعروض والأسعار</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canViewExpenses}
                    onChange={(e) => setCanViewExpenses(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>💸 إضافة وإدارة المصروفات والتكاليف</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canManageTeam}
                    onChange={(e) => setCanManageTeam(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>👥 إدارة الفريق وتعيين الصلاحيات</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={canViewReports}
                    onChange={(e) => setCanViewReports(e.target.checked)}
                    className="w-4 h-4 accent-[#FF7A1A] rounded"
                  />
                  <span>📊 عرض التقارير والإحصائيات المالية</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-orange w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {selectedMemberId === 'new' ? 'إضافة العضو وتأكيد الصلاحيات' : 'حفظ الصلاحيات والتعديلات'}
            </button>

            {selectedMemberId !== 'new' && position !== 'owner' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDeleteMember(selectedMemberId, name)}
                className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف هذا العضو نهائياً من الفريق والقاعدة</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Switch PIN Verification Modal */}
      {switchTarget && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-5 space-y-4 border border-[#FF7A1A]/50 bg-[#0B1220] shadow-2xl animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#FF7A1A]/20 mx-auto flex items-center justify-center text-[#FF7A1A]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-white">تسجيل الدخول كـ: {switchTarget.name}</h3>
              <p className="text-xs text-gray-400">أدخل رمز PIN الخاص بهذا الحساب للتأكيد</p>
            </div>

            <form onSubmit={handleVerifySwitchPin} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="أدخل PIN..."
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="glass-input w-full p-3 text-center font-bold text-lg tracking-widest text-[#FF7A1A]"
              />

              {pinError && <p className="text-xs text-red-400 text-center font-bold">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-orange flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  تأكيد ودخول
                </button>
                <button
                  type="button"
                  onClick={() => setSwitchTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
