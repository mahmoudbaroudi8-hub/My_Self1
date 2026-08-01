import React from 'react';
import { Plus } from 'lucide-react';
import { ScreenView, TeamMember } from '../types';
import { isScreenAllowedForUser } from '../lib/permissions';

interface QuickSaleButtonProps {
  currentScreen: ScreenView;
  onOpenPos: () => void;
  currentUser?: TeamMember | null;
}

export const QuickSaleButton: React.FC<QuickSaleButtonProps> = ({ currentScreen, onOpenPos, currentUser }) => {
  // Do not render on POS screen itself or if user is not authorized for POS
  if (currentScreen === 'pos' || !isScreenAllowedForUser(currentUser, 'pos')) {
    return null;
  }

  return (
    <div className="fixed bottom-[74px] left-0 right-0 z-[100] pointer-events-none">
      <div className="max-w-md mx-auto px-4 flex justify-end">
        <button
          onClick={onOpenPos}
          className="pointer-events-auto px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A1A] to-amber-500 text-white flex items-center gap-1.5 shadow-2xl shadow-[#FF7A1A]/50 active:scale-95 transition-all border-2 border-[#070D18] ring-2 ring-[#FF7A1A]/40 hover:scale-105 font-bold text-xs"
          title="بيع جديد (+)"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>بيع جديد</span>
        </button>
      </div>
    </div>
  );
};
