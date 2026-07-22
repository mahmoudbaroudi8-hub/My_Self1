import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Calendar, CreditCard, Tag, FileSpreadsheet } from 'lucide-react';
import { Expense, SystemType } from '../types';
import { exportExpensesToExcel } from '../lib/excelExport';

interface ExpensesScreenProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<string>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('أجهزة ومستلزمات');
  const [system, setSystem] = useState<SystemType>('محلات');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      alert('رجاءً أدخل عنوان المصروف والمبلغ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddExpense({
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        category,
        system,
        notes: notes.trim(),
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });

      setTitle('');
      setAmount('');
      setNotes('');
      setShowAddModal(false);
      alert('تم تسجيل المصروف بنجاح!');
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('حدث خطأ أثناء حفظ المصروف.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">إدارة المشتريات والمصروفات</h2>
            <p className="text-[11px] text-gray-300">تكاليف التشغيل والأجهزة والزيارات</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExpensesToExcel(expenses)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            title="تصدير سجل المصروفات إلى Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-orange px-3 py-1.5 text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> إضافة مصروف
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-card p-4 bg-gradient-to-br from-[#121C30] to-[#0B1220] border-l-2 border-l-red-500 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-300 block">إجمالي المصاريف والمشتريات</span>
          <span className="text-xl font-extrabold text-white">
            {totalExpenses.toLocaleString('ar-EG')} <span className="text-xs text-gray-400">ج.م</span>
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
          {expenses.length} بند
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-gray-300 px-1">سجل التكاليف والمشتريات</h3>

        {expenses.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 text-xs">
            لا توجد مصروفات أو مشتريات مسجلة حتى الآن.
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="glass-card p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">{expense.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-gray-300">
                    {expense.category}
                  </span>
                  <span>• {expense.system || 'عام'}</span>
                  <span>• {expense.date}</span>
                </div>
                {expense.notes && <p className="text-[10px] text-gray-400 italic pt-0.5">{expense.notes}</p>}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-red-400">
                  {(expense.amount || 0).toLocaleString('ar-EG')} ج.م
                </span>
                <button
                  onClick={() => {
                    if (confirm('هل أنت تأكد من حذف هذا المصروف؟')) {
                      onDeleteExpense(expense.id);
                    }
                  }}
                  className="text-gray-500 hover:text-red-400 p-1"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-5 space-y-4 border border-[#FF7A1A]">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              تسجيل مصروف / مشتريات جديدة
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 mb-1 block">عنوان المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء طابعة باركود / بنزين زيارة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-300 mb-1 block">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs text-center font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 mb-1 block">التاريخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-300 mb-1 block">نوع المصروف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full p-2.5 text-xs"
                  >
                    <option value="أجهزة ومستلزمات">أجهزة ومستلزمات</option>
                    <option value="انتقالات وزيارات">انتقالات وزيارات</option>
                    <option value="برمجة واستضافة">برمجة واستضافة</option>
                    <option value="تسويق ودعاية">تسويق ودعاية</option>
                    <option value="مصاريف تشغيلية">مصاريف تشغيلية</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 mb-1 block">القطاع</label>
                  <select
                    value={system}
                    onChange={(e) => setSystem(e.target.value as SystemType)}
                    className="glass-input w-full p-2.5 text-xs"
                  >
                    <option value="محلات">محلات</option>
                    <option value="شركات">شركات</option>
                    <option value="صالات جيم">صالات جيم</option>
                    <option value="برامج">برامج</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 mb-1 block">ملاحظات إضافية</label>
                <input
                  type="text"
                  placeholder="ملاحظات تفصيلية إن وجدت..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input w-full p-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-orange flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المصروف'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="glass-button px-4 py-2.5 rounded-xl text-xs text-gray-300"
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
