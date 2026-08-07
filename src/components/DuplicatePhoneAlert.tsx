import React from 'react';
import { AlertTriangle, Eye, ArrowLeft, Check, UserCheck } from 'lucide-react';
import { Client, Lead } from '../types';
import { PhoneCheckResult } from '../lib/phoneCheck';

interface DuplicatePhoneAlertProps {
  phoneDuplicate: PhoneCheckResult;
  clients: Client[];
  leads: Lead[];
  onViewEditRecord: (recordType: 'client' | 'lead', record: Client | Lead) => void;
  onSelectClientForPos?: (client: Client) => void;
  onContinueAnyway?: () => void;
  isDismissed?: boolean;
}

export const DuplicatePhoneAlert: React.FC<DuplicatePhoneAlertProps> = ({
  phoneDuplicate,
  clients,
  leads,
  onViewEditRecord,
  onSelectClientForPos,
  onContinueAnyway,
  isDismissed = false,
}) => {
  if (!phoneDuplicate.isDuplicate || isDismissed) return null;

  const matchedClient = phoneDuplicate.matchType === 'client' && phoneDuplicate.matchedId
    ? clients.find((c) => c.id === phoneDuplicate.matchedId)
    : null;

  const matchedLead = phoneDuplicate.matchType === 'lead' && phoneDuplicate.matchedId
    ? leads.find((l) => l.id === phoneDuplicate.matchedId)
    : null;

  const targetRecord = matchedClient || matchedLead;

  return (
    <div className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-orange-950/40 border-2 border-amber-500/60 text-amber-100 text-xs space-y-2.5 shadow-xl animate-fade-in backdrop-blur-sm">
      {/* Alert Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2 font-black text-amber-300 text-xs">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-400 animate-pulse" />
          <span>تنبيه: هذا الرقم مسجل بالفعل في النظام!</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/25 border border-amber-400/40 text-amber-200 shrink-0">
          {phoneDuplicate.matchType === 'client' ? 'عميل فعلي' : 'عميل محتمل (Lead)'}
        </span>
      </div>

      {/* Record Preview Box */}
      <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/30 space-y-1.5">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-300 font-semibold">الاسم المسجل:</span>
          <span className="font-extrabold text-white text-xs">{phoneDuplicate.matchedName}</span>
        </div>

        {matchedClient && (
          <>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-300 font-semibold">المحل / التجاري:</span>
              <span className="font-bold text-amber-200">{matchedClient.shopName || 'غير محدد'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-300 font-semibold">القطاع / القسم:</span>
              <span className="font-medium text-gray-200">{matchedClient.system} - {matchedClient.category}</span>
            </div>
          </>
        )}

        {matchedLead && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-300 font-semibold">القطاع والمهتم به:</span>
            <span className="font-medium text-gray-200">{matchedLead.system} - {matchedLead.category}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-gray-300 font-semibold">رقم الموبايل:</span>
          <span className="font-mono text-amber-300 font-bold dir-ltr">{phoneDuplicate.matchedPhone}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {targetRecord && (
          <button
            type="button"
            onClick={() => onViewEditRecord(phoneDuplicate.matchType!, targetRecord)}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>عرض وتعديل بيانات العميل</span>
          </button>
        )}

        {onSelectClientForPos && matchedClient && (
          <button
            type="button"
            onClick={() => onSelectClientForPos(matchedClient)}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>تعبئة بيانات الفاتورة</span>
          </button>
        )}

        {onContinueAnyway && (
          <button
            type="button"
            onClick={onContinueAnyway}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer"
          >
            <span>المتابعة رغم ذلك</span>
          </button>
        )}
      </div>
    </div>
  );
};
