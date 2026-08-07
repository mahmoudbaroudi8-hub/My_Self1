import React from 'react';
import { BarChart3, ShoppingBag, Home, Users, Receipt, Target } from 'lucide-react';
import { ScreenView, TeamMember } from '../types';
import { isScreenAllowedForUser } from '../lib/permissions';

interface BottomNavProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  currentUser?: TeamMember | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, currentUser }) => {
  const isAllowed = (screen: ScreenView) => isScreenAllowedForUser(currentUser, screen);

  const showSales = isAllowed('sales');
  const showClients = isAllowed('clients');
  const showLeads = isAllowed('leads');
  const showHome = isAllowed('home');
  const showExpenses = isAllowed('expenses');
  const showReports = isAllowed('reports');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[#070D18]/95 backdrop-blur-2xl border-t-2 border-[#FF7A1A]/30 px-3 py-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-around relative px-2">
        {/* 1. المبيعات (Sales) */}
        {showSales && (
          <button
            onClick={() => onNavigate('sales')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentScreen === 'sales' ? 'text-[#FF7A1A] font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">المبيعات</span>
          </button>
        )}

        {/* 2. العملاء (Clients) or Leads */}
        {showClients ? (
          <button
            onClick={() => onNavigate('clients')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentScreen === 'clients' || currentScreen === 'leads' ? 'text-[#FF7A1A] font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">العملاء</span>
          </button>
        ) : showLeads ? (
          <button
            onClick={() => onNavigate('leads')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentScreen === 'leads' ? 'text-[#FF7A1A] font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">العملاء المحتملون</span>
          </button>
        ) : null}

        {/* 3. الرئيسية (Home) */}
        {showHome && (
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                currentScreen === 'home'
                  ? 'bg-[#FF7A1A] text-white shadow-[#FF7A1A]/50 ring-4 ring-[#070D18] scale-110'
                  : 'bg-[#FF7A1A]/90 text-white shadow-[#FF7A1A]/30 hover:bg-[#FF7A1A]'
              }`}
            >
              <Home className="w-6 h-6" />
            </div>
            <span
              className={`text-[10px] font-bold mt-0.5 ${
                currentScreen === 'home' ? 'text-[#FF7A1A]' : 'text-gray-300'
              }`}
            >
              الرئيسية
            </span>
          </button>
        )}

        {/* 4. المشتريات (Expenses) */}
        {showExpenses && (
          <button
            onClick={() => onNavigate('expenses')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentScreen === 'expenses' ? 'text-[#FF7A1A] font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">المشتريات</span>
          </button>
        )}

        {/* 5. التقارير (Reports) */}
        {showReports && (
          <button
            onClick={() => onNavigate('reports')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              currentScreen === 'reports' ? 'text-[#FF7A1A] font-bold scale-105' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">التقارير</span>
          </button>
        )}
      </div>
    </nav>
  );
};
