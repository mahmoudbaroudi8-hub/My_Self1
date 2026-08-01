import React, { useState } from 'react';
import {
  Store,
  Building2,
  Dumbbell,
  AppWindow,
  Layers,
  ShoppingBag,
  Pill,
  UtensilsCrossed,
  Shirt,
  ShoppingBasket,
  ChevronRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Plus
} from 'lucide-react';
import { Sale, Expense, Payment, Client, SystemType, CategoryType, ScreenView, getCategoriesForSystem } from '../types';

interface SectorScreenProps {
  sectorName: SystemType;
  sales: Sale[];
  expenses: Expense[];
  payments?: Payment[];
  clients: Client[];
  onNavigate: (screen: ScreenView, sector?: SystemType) => void;
}

export const SectorScreen: React.FC<SectorScreenProps> = ({
  sectorName,
  sales,
  expenses,
  payments = [],
  clients,
  onNavigate,
}) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState<CategoryType | 'الكل'>('الكل');

  // Filter sales & expenses for this sector
  const sectorSales = sales.filter((s) => s.system === sectorName);
  const sectorPaidSales = sectorSales.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  
  // Extra payments for clients in this sector
  const sectorClientIds = new Set(sectorSales.map((s) => s.clientId).filter(Boolean));
  const sectorPayments = payments
    .filter((p) => sectorClientIds.has(p.clientId))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const sectorRevenue = sectorPaidSales + sectorPayments;

  const sectorExpenses = expenses
    .filter((e) => e.system === sectorName)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const sectorInvoiced = sectorSales.reduce((acc, curr) => acc + (curr.finalInvoice || 0), 0);
  const sectorDebt = Math.max(0, sectorInvoiced - sectorRevenue);

  // Color and icon variants for dynamic sub-categories
  const colorVariants = [
    { bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/40', textColor: 'text-emerald-400', icon: <ShoppingBasket className="w-5 h-5 text-emerald-400" /> },
    { bgColor: 'bg-blue-500/15', borderColor: 'border-blue-500/40', textColor: 'text-blue-400', icon: <Building2 className="w-5 h-5 text-blue-400" /> },
    { bgColor: 'bg-purple-500/15', borderColor: 'border-purple-500/40', textColor: 'text-purple-400', icon: <AppWindow className="w-5 h-5 text-purple-400" /> },
    { bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/40', textColor: 'text-orange-400', icon: <UtensilsCrossed className="w-5 h-5 text-orange-400" /> },
    { bgColor: 'bg-red-500/15', borderColor: 'border-red-500/40', textColor: 'text-red-400', icon: <Pill className="w-5 h-5 text-red-400" /> },
    { bgColor: 'bg-amber-500/15', borderColor: 'border-amber-500/40', textColor: 'text-amber-400', icon: <Layers className="w-5 h-5 text-amber-400" /> },
  ];

  const categoryNames = getCategoriesForSystem(sectorName);
  const subCategories = categoryNames.map((catName, idx) => {
    const variant = colorVariants[idx % colorVariants.length];
    return {
      name: catName,
      ...variant,
    };
  });

  // Filtered sales list based on sub-category selection
  const displayedSales = sectorSales.filter((s) =>
    selectedSubCategory === 'الكل' ? true : s.category === selectedSubCategory
  );

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Sector Header */}
      <div className="glass-card p-4 flex items-center justify-between border-b-2 border-b-[#FF7A1A]">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-gray-300 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">قطاع {sectorName}</h2>
            <p className="text-[11px] text-gray-300">متابعة إيرادات ومبيعات قطاع {sectorName}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('packages')}
          className="glass-button px-3 py-1.5 text-xs text-[#FF7A1A] font-semibold"
        >
          الباقات
        </button>
      </div>

      {/* Sector Financial Summary */}
      <div className="glass-card p-4 bg-gradient-to-br from-[#121C30] to-[#0B1220] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">إجمالي إيرادات قطاع {sectorName}</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            مؤكد live
          </span>
        </div>
        <div className="text-2xl font-extrabold text-[#FF7A1A]">
          {sectorRevenue.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block">المصاريف التشغيلية</span>
            <span className="font-bold text-white">{sectorExpenses.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block">إجمالي الديون بالقطاع</span>
            <span className="font-bold text-amber-400">{sectorDebt.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </div>

      {/* Sub-categories Grid with Custom Distinct Colors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-300">الأقسام الفرعية بالقطاع</h3>
          {selectedSubCategory !== 'الكل' && (
            <button
              onClick={() => setSelectedSubCategory('الكل')}
              className="text-[11px] text-[#FF7A1A] hover:underline"
            >
              عرض الكل
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {subCategories.map((sub) => {
            const count = sectorSales.filter((s) => s.category === sub.name).length;
            const isSelected = selectedSubCategory === sub.name;

            return (
              <div
                key={sub.name}
                onClick={() => setSelectedSubCategory(isSelected ? 'الكل' : sub.name)}
                className={`glass-card p-3 cursor-pointer transition-all border ${
                  isSelected ? `${sub.borderColor} ${sub.bgColor} ring-2 ring-[#FF7A1A]` : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${sub.bgColor}`}>{sub.icon}</div>
                  <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-md">
                    {count} عميل
                  </span>
                </div>
                <h4 className={`text-xs font-bold ${sub.textColor}`}>{sub.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">اضغط لمشاهدة المبيعات</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales log for this sector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-gray-300">
            مبيعات {selectedSubCategory === 'الكل' ? `قطاع ${sectorName}` : `قسم ${selectedSubCategory}`}
          </h3>
          <span className="text-[10px] text-gray-400">{displayedSales.length} عملية</span>
        </div>

        <div className="space-y-2">
          {displayedSales.length === 0 ? (
            <div className="glass-card p-6 text-center text-gray-400 text-xs">
              لا توجد مبيعات في هذا القسم الفرعي حالياً.
            </div>
          ) : (
            displayedSales.map((sale) => (
              <div key={sale.id} className="glass-card p-3 flex items-center justify-between border-l-2 border-l-[#FF7A1A]">
                <div>
                  <h4 className="text-xs font-bold text-white">{sale.shopName}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    المالك: {sale.clientName} • {sale.packageName}
                  </p>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-[#FF7A1A] block">
                    {(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م
                  </span>
                  <span className="text-[9px] text-gray-400">{sale.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
