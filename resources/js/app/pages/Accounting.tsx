import { useState } from 'react';
import Layout from '../components/Layout';
import {
    BookOpen, DollarSign, List, BarChart2,
    TrendingUp, TrendingDown, Wallet,
    Edit2, Trash2, Plus, Download, ChevronLeft, ChevronRight,
    Receipt, X, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useForm, router } from '@inertiajs/react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";

// ---------- Types ----------
interface AccountingAccount { id: string; code: string; name: string; type: string; }
interface ExpenseCategory { id: string; code: string; name: string; }
interface Expense {
    id: string; expense_number: string; expense_date: string; description: string;
    amount: string; currency: string; payment_method: string | null; status: string;
    receipt_url: string | null;
    category?: { name: string; code: string };
    creator?: { first_name: string; last_name: string };
    patient?: { id: string; first_name: string; last_name: string; national_id: string };
}
interface EntryLine { debit: string; credit: string; account?: { code: string; name: string }; }
interface AccountingEntry {
    id: string; entry_number: string; entry_date: string; description: string; lines: EntryLine[];
}
interface CategoryTotal { category_name: string; category_code: string; total: string; }
interface Period { month: number; year: number; }

interface Props {
    accounts: AccountingAccount[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    entries: AccountingEntry[];
    monthlyIncome: number;
    monthlyExpenses: number;
    expensesByCategory: CategoryTotal[];
    period: Period;
    patients: any[];
}

// ---------- Helpers ----------
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio',
    revenue: 'Ingreso', expense: 'Egreso',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Efectivo (Bs.)', transfer: 'Transferencia bancaria',
    qr: 'QR / Tigo Money', check: 'Cheque', card: 'Tarjeta', other: 'Otro',
};

const MONTH_NAMES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    paid:      { label: 'Pagado',    color: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300' },
    pending:   { label: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300' },
    cancelled: { label: 'Anulado',   color: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300' },
};

function fmt(amount: string | number) {
    return 'Bs. ' + Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
        const parts = clean.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            if (y && m && d) {
                const dateObj = new Date(y, m - 1, d);
                return dateObj.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
            }
        }
        const dObj = new Date(dateStr);
        return isNaN(dObj.getTime()) ? dateStr : dObj.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

// ---------- Component ----------
Accounting.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Accounting({
    accounts, expenses, expenseCategories, entries,
    monthlyIncome, monthlyExpenses, expensesByCategory, period, patients
}: Props) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'entries' | 'accounts'>('dashboard');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const netProfit = monthlyIncome - monthlyExpenses;

    // --- Period navigation ---
    const navigatePeriod = (direction: 'prev' | 'next') => {
        let { month, year } = period;
        if (direction === 'prev') { month--; if (month < 1)  { month = 12; year--; } }
        else                       { month++; if (month > 12) { month = 1;  year++; } }
        router.get('/accounting', { month, year }, { preserveState: false });
    };

    // --- Expense form ---
    const blankExpense = {
        expense_category_id: '', patient_id: '', expense_date: new Date().toISOString().split('T')[0],
        description: '', amount: '', currency: 'BOB', payment_method: 'cash', receipt_url: '',
    };
    const {
        data: expenseData, setData: setExpenseData,
        post: postExpense, put: putExpense,
        processing: processingExpense, reset: resetExpense,
        errors: expenseErrors,
    } = useForm(blankExpense);

    const openNewExpense = () => {
        setEditingExpense(null);
        resetExpense();
        setIsExpenseModalOpen(true);
    };
    const openEditExpense = (exp: Expense) => {
        setEditingExpense(exp);
        setExpenseData({
            expense_category_id: exp.category ? expenseCategories.find(c => c.name === exp.category?.name)?.id || '' : '',
            patient_id: exp.patient?.id || '',
            expense_date: exp.expense_date,
            description: exp.description,
            amount: exp.amount,
            currency: exp.currency,
            payment_method: exp.payment_method || 'cash',
            receipt_url: exp.receipt_url || '',
        });
        setIsExpenseModalOpen(true);
    };

    const submitExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExpense) {
            putExpense(`/accounting/expenses/${editingExpense.id}`, {
                onSuccess: () => { setIsExpenseModalOpen(false); setEditingExpense(null); }
            });
        } else {
            postExpense('/accounting/expenses', {
                onSuccess: () => { setIsExpenseModalOpen(false); resetExpense(); }
            });
        }
    };

    const confirmDelete = (id: string) => setDeleteConfirm(id);
    const handleDelete = () => {
        if (!deleteConfirm) return;
        router.delete(`/accounting/expenses/${deleteConfirm}`, {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    // --- Entry form ---
    const { data: entryData, setData: setEntryData, post: postEntry,
            processing: processingEntry, reset: resetEntry, errors: entryErrors } = useForm({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
            { accounting_account_id: '', debit: '', credit: '0' },
            { accounting_account_id: '', debit: '0', credit: '' },
        ],
    });

    const handleLineChange = (index: number, field: string, value: string) => {
        const newLines = [...entryData.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setEntryData('lines', newLines);
    };
    const addLine = () => setEntryData('lines', [...entryData.lines, { accounting_account_id: '', debit: '0', credit: '0' }]);
    const removeLine = (index: number) => {
        if (entryData.lines.length <= 2) return;
        setEntryData('lines', entryData.lines.filter((_, i) => i !== index));
    };

    const submitEntry = (e: React.FormEvent) => {
        e.preventDefault();
        postEntry('/accounting/entries', {
            onSuccess: () => { setIsEntryModalOpen(false); resetEntry(); }
        });
    };

    const totalDebe  = entryData.lines.reduce((a, b) => a + Number(b.debit  || 0), 0);
    const totalHaber = entryData.lines.reduce((a, b) => a + Number(b.credit || 0), 0);
    const cuadra = Math.abs(totalDebe - totalHaber) < 0.01;

    // --- Export CSV ---
    const exportExpensesCSV = () => {
        const header = ['Nº Gasto','Fecha','Descripción','Categoría','Método Pago','Monto','Estado'];
        const rows = expenses.map(e => [
            e.expense_number,
            e.expense_date,
            `"${e.description}"`,
            e.category?.name || '',
            PAYMENT_METHOD_LABELS[e.payment_method || ''] || e.payment_method || '',
            e.amount,
            STATUS_LABELS[e.status]?.label || e.status,
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gastos_${MONTH_NAMES[period.month - 1]}_${period.year}.csv`;
        link.click();
    };

    // --- Category bar chart ---
    const maxCatTotal = expensesByCategory.length > 0
        ? Math.max(...expensesByCategory.map(c => Number(c.total)))
        : 1;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-[#F9FAFB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1 flex items-center gap-3">
                        <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#14B8A6]" />
                        Contabilidad
                    </h1>
                    <p className="text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm">Control interno de ingresos, egresos y libros contables</p>
                </div>
                {/* Period navigator */}
                <div className="flex items-center gap-3 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-[#1E293B] rounded-2xl px-4 py-2 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                    <button onClick={() => navigatePeriod('prev')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors" aria-label="Mes anterior">
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className="font-semibold text-[#111827] dark:text-[#F8FAFC] text-sm min-w-[130px] text-center">
                        {MONTH_NAMES[period.month - 1]} {period.year}
                    </span>
                    <button onClick={() => navigatePeriod('next')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors" aria-label="Mes siguiente">
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-gray-200 dark:border-[#1E293B] mb-6 bg-white dark:bg-[#0F172A] rounded-2xl p-1.5 shadow-sm gap-1.5 w-full max-w-full">
                {([
                    ['dashboard', 'Dashboard P&G', BarChart2],
                    ['expenses',  'Control de Egresos', DollarSign],
                    ['entries',   'Libro Diario', List],
                    ['accounts',  'Plan de Cuentas', BookOpen],
                ] as [string, string, React.ElementType][]).map(([key, label, Icon]) => (
                    <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                        className={`w-full px-2 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                            activeTab === key
                                ? 'bg-teal-50 dark:bg-[#14B8A6]/10 text-[#14B8A6] dark:text-[#2DD4BF] font-semibold'
                                : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1E293B]'
                        }`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                    </button>
                ))}
            </div>

            {/* ===== DASHBOARD TAB ===== */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-teal-100 text-sm font-medium">Ingresos del Mes</span>
                                    <div className="bg-white/20 rounded-xl p-2">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold">{fmt(monthlyIncome)}</p>
                                <p className="text-teal-100 text-xs mt-1">Cobros registrados en pagos</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-rose-100 text-sm font-medium">Egresos del Mes</span>
                                    <div className="bg-white/20 rounded-xl p-2">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold">{fmt(monthlyExpenses)}</p>
                                <p className="text-rose-100 text-xs mt-1">{expenses.length} gastos registrados</p>
                            </CardContent>
                        </Card>
                        <Card className={`rounded-2xl border-0 shadow-sm text-white ${
                            netProfit >= 0
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
                                : 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700'
                        }`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-blue-100 text-sm font-medium">Utilidad Neta</span>
                                    <div className="bg-white/20 rounded-xl p-2">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold">{fmt(netProfit)}</p>
                                <p className="text-blue-100 text-xs mt-1">
                                    {netProfit >= 0 ? '✓ Resultado positivo' : '⚠ Resultado negativo'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Estado de Resultados simple */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-2xl border border-transparent dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#0F172A]">
                            <CardHeader>
                                <CardTitle className="text-base text-[#111827] dark:text-[#F8FAFC]">Estado de Resultados</CardTitle>
                                <CardDescription className="text-gray-500 dark:text-[#94A3B8]">{MONTH_NAMES[period.month - 1]} {period.year}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 dark:border-[#1E293B]">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Ingresos por cobros</span>
                                        <span className="font-semibold text-teal-600 dark:text-teal-400">{fmt(monthlyIncome)}</span>
                                    </div>
                                    {expensesByCategory.map(cat => (
                                        <div key={cat.category_code} className="flex justify-between items-center py-1">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-2">{cat.category_code}</span>
                                                {cat.category_name}
                                            </span>
                                            <span className="font-medium text-rose-500 dark:text-rose-400">-{fmt(cat.total)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 dark:border-[#334155] mt-2">
                                        <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">UTILIDAD NETA</span>
                                        <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {fmt(netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category chart */}
                        <Card className="rounded-2xl border border-transparent dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#0F172A]">
                            <CardHeader>
                                <CardTitle className="text-base text-[#111827] dark:text-[#F8FAFC]">Distribución de Egresos</CardTitle>
                                <CardDescription className="text-gray-500 dark:text-[#94A3B8]">Por categoría — {MONTH_NAMES[period.month - 1]}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {expensesByCategory.length === 0 ? (
                                    <p className="text-center text-gray-400 dark:text-gray-500 py-6 text-sm">No hay egresos en este período</p>
                                ) : (
                                    <div className="space-y-3">
                                        {expensesByCategory.map((cat, i) => {
                                            const pct = Math.round((Number(cat.total) / monthlyExpenses) * 100);
                                            const barWidth = Math.round((Number(cat.total) / maxCatTotal) * 100);
                                            const colors = ['bg-teal-500','bg-blue-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-emerald-500','bg-orange-500','bg-pink-500'];
                                            return (
                                                <div key={cat.category_code}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{cat.category_name}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{fmt(cat.total)} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 dark:bg-[#1E293B] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${colors[i % colors.length]}`}
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ===== EXPENSES TAB ===== */}
            {activeTab === 'expenses' && (
                <div className="space-y-5">
                    <Card className="rounded-2xl border border-transparent dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#0F172A]">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Control de Egresos</CardTitle>
                                <CardDescription className="text-gray-500 dark:text-[#94A3B8]">{MONTH_NAMES[period.month - 1]} {period.year} — {expenses.length} registros</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button onClick={exportExpensesCSV}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 border border-gray-200 dark:border-[#1E293B] text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors">
                                    <Download className="w-4 h-4" /> Exportar CSV
                                </button>
                                <button onClick={openNewExpense}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-[#14B8A6] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0F766E] transition-colors">
                                    <Plus className="w-4 h-4" /> Nuevo Gasto
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F8FAFC] dark:bg-[#111827] text-[#6B7280] dark:text-[#94A3B8] font-medium border-b border-[#E5E7EB] dark:border-[#1E293B]">
                                        <tr>
                                            <th className="px-5 py-3">Nº Gasto</th>
                                            <th className="px-5 py-3">Fecha</th>
                                            <th className="px-5 py-3">Descripción</th>
                                            <th className="px-5 py-3">Categoría</th>
                                            <th className="px-5 py-3">Método Pago</th>
                                            <th className="px-5 py-3">Estado</th>
                                            <th className="px-5 py-3 text-right">Monto</th>
                                            <th className="px-5 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                                        {expenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors">
                                                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#14B8A6] dark:text-[#2DD4BF]">
                                                    {exp.expense_number}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                                                    {formatDate(exp.expense_date)}
                                                </td>
                                                <td className="px-5 py-3.5 text-[#111827] dark:text-[#F8FAFC] max-w-[200px] truncate">{exp.description}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-lg text-xs font-medium">
                                                        {exp.category?.name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                                                    {PAYMENT_METHOD_LABELS[exp.payment_method || ''] || exp.payment_method || '—'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_LABELS[exp.status]?.color}`}>
                                                        {STATUS_LABELS[exp.status]?.label || exp.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                                                    {fmt(exp.amount)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEditExpense(exp)}
                                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-lg transition-colors" title="Editar">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => confirmDelete(exp.id)}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg transition-colors" title="Eliminar">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                                                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                    No hay gastos en {MONTH_NAMES[period.month - 1]} {period.year}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {expenses.length > 0 && (
                                        <tfoot className="bg-[#F8FAFC] dark:bg-[#111827] border-t-2 border-[#E5E7EB] dark:border-[#1E293B]">
                                            <tr>
                                                <td colSpan={6} className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-200">Total del período</td>
                                                <td className="px-5 py-3 text-right font-bold text-rose-600 dark:text-rose-400 text-base">{fmt(monthlyExpenses)}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== ENTRIES (Libro Diario) TAB ===== */}
            {activeTab === 'entries' && (
                <div className="space-y-5">
                    <Card className="rounded-2xl border border-transparent dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#0F172A]">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Libro Diario</CardTitle>
                                <CardDescription className="text-gray-500 dark:text-[#94A3B8]">Asientos contables de partida doble — {MONTH_NAMES[period.month - 1]} {period.year}</CardDescription>
                            </div>
                            <button onClick={() => setIsEntryModalOpen(true)}
                                className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#14B8A6] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0F766E] transition-colors">
                                <Plus className="w-4 h-4" /> Nuevo Asiento
                            </button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {entries.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                                    <List className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    No hay asientos en {MONTH_NAMES[period.month - 1]} {period.year}
                                </div>
                            ) : (
                                <div className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                                    {entries.map(ent => {
                                        const totalDebit = ent.lines?.reduce((acc, l) => acc + Number(l.debit), 0) || 0;
                                        return (
                                            <div key={ent.id} className="px-5 py-4 hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="font-mono text-xs font-bold text-[#14B8A6] dark:text-[#2DD4BF] mr-3">{ent.entry_number}</span>
                                                        <span className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">{ent.description}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-[#111827] dark:text-[#F8FAFC]">{fmt(totalDebit)}</div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                            {formatDate(ent.entry_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {ent.lines && ent.lines.length > 0 && (
                                                    <div className="ml-4 border-l-2 border-gray-100 dark:border-[#1E293B] pl-4 space-y-1">
                                                        <div className="grid grid-cols-3 text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">
                                                            <span>Cuenta</span><span className="text-right">Debe</span><span className="text-right">Haber</span>
                                                        </div>
                                                        {ent.lines.map((line, i) => (
                                                            <div key={i} className="grid grid-cols-3 text-xs text-gray-600 dark:text-gray-300">
                                                                <span>{line.account ? `${line.account.code} ${line.account.name}` : '—'}</span>
                                                                <span className="text-right">{Number(line.debit) > 0 ? fmt(line.debit) : '—'}</span>
                                                                <span className="text-right">{Number(line.credit) > 0 ? fmt(line.credit) : '—'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== ACCOUNTS (Plan de Cuentas) TAB ===== */}
            {activeTab === 'accounts' && (
                <div className="space-y-5">
                    <Card className="rounded-2xl border border-transparent dark:border-[#1E293B] shadow-sm bg-white dark:bg-[#0F172A]">
                        <CardHeader>
                            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Plan de Cuentas</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-[#94A3B8]">PGCE Simplificado Bolivia — {accounts.length} cuentas</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F8FAFC] dark:bg-[#111827] text-[#6B7280] dark:text-[#94A3B8] font-medium border-b border-[#E5E7EB] dark:border-[#1E293B]">
                                        <tr>
                                            <th className="px-5 py-3 w-24">Código</th>
                                            <th className="px-5 py-3">Nombre de la Cuenta</th>
                                            <th className="px-5 py-3">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                                        {accounts.map(acc => {
                                            const isGroup = acc.code.endsWith('00') || acc.code.length <= 4;
                                            const indent = acc.code.length > 4 ? 'pl-10' : acc.code.length > 1 ? 'pl-5' : '';
                                            return (
                                                <tr key={acc.id} className={`hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 ${isGroup ? 'bg-gray-50/50 dark:bg-[#111827]/40' : ''}`}>
                                                    <td className="px-5 py-3 font-mono text-xs font-bold text-gray-500 dark:text-gray-400">{acc.code}</td>
                                                    <td className={`px-5 py-3 ${indent} ${isGroup ? 'font-semibold text-[#111827] dark:text-[#F8FAFC]' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {acc.name}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                                            acc.type === 'asset'     ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'   :
                                                            acc.type === 'liability' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'     :
                                                            acc.type === 'equity'    ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' :
                                                            acc.type === 'revenue'   ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'  :
                                                                                       'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                                                        }`}>
                                                            {ACCOUNT_TYPE_LABELS[acc.type] || acc.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {accounts.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">No hay cuentas registradas.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== EXPENSE MODAL ===== */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-[520px] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">{editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitExpense} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Fecha *</label>
                                <input type="date"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={expenseData.expense_date}
                                    onChange={e => setExpenseData('expense_date', e.target.value)}
                                    required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Monto (Bs.) *</label>
                                <input type="number" step="0.01" min="0.01"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={expenseData.amount}
                                    onChange={e => setExpenseData('amount', e.target.value)}
                                    required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Descripción *</label>
                            <input type="text"
                                className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                value={expenseData.description}
                                onChange={e => setExpenseData('description', e.target.value)}
                                placeholder="Ej: Pago de alquiler consultorio - Julio"
                                required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Categoría *</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={expenseData.expense_category_id}
                                    onChange={e => setExpenseData('expense_category_id', e.target.value)}
                                    required>
                                    <option value="" disabled className="dark:bg-[#111827]">Seleccionar...</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id} className="dark:bg-[#111827]">{cat.code} — {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Paciente (Opcional)</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={expenseData.patient_id}
                                    onChange={e => setExpenseData('patient_id', e.target.value)}>
                                    <option value="" className="dark:bg-[#111827]">Ninguno</option>
                                    {patients?.map(p => (
                                        <option key={p.id} value={p.id} className="dark:bg-[#111827]">{p.first_name} {p.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Método de Pago *</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={expenseData.payment_method}
                                    onChange={e => setExpenseData('payment_method', e.target.value)}>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                                        <option key={val} value={val} className="dark:bg-[#111827]">{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Nº de Referencia / Comprobante
                            </label>
                            <input type="text"
                                className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                value={expenseData.receipt_url}
                                onChange={e => setExpenseData('receipt_url', e.target.value)}
                                placeholder="Ej: Factura #001, Recibo transferencia..." />
                        </div>
                        {expenseErrors.expense_category_id && (
                            <p className="text-xs text-red-500">{expenseErrors.expense_category_id}</p>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={processingExpense}
                                className="flex items-center gap-2 bg-[#14B8A6] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#0F766E] disabled:opacity-50 transition-colors">
                                <Save className="w-4 h-4" />
                                {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ===== DELETE CONFIRM MODAL ===== */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-[380px] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">¿Eliminar gasto?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 dark:text-gray-300 my-3">
                        Esta acción no se puede deshacer. El registro será eliminado permanentemente.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl">
                            Cancelar
                        </button>
                        <button onClick={handleDelete}
                            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700">
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ===== ENTRY MODAL ===== */}
            <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Registrar Asiento Contable</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEntry} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Fecha *</label>
                                <input type="date"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={entryData.entry_date}
                                    onChange={e => setEntryData('entry_date', e.target.value)}
                                    required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Glosa / Descripción *</label>
                                <input type="text"
                                    className="w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    value={entryData.description}
                                    onChange={e => setEntryData('description', e.target.value)}
                                    required />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Partidas (mín. 2)</label>
                                <button type="button" onClick={addLine}
                                    className="text-xs text-[#14B8A6] dark:text-[#2DD4BF] font-medium hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Agregar fila
                                </button>
                            </div>
                            <div className="rounded-xl border border-gray-200 dark:border-[#1E293B] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-[#111827] text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Cuenta Contable</th>
                                            <th className="px-3 py-2 text-right w-28">Debe</th>
                                            <th className="px-3 py-2 text-right w-28">Haber</th>
                                            <th className="px-3 py-2 w-8" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                                        {entryData.lines.map((line, index) => (
                                            <tr key={index}>
                                                <td className="px-2 py-2">
                                                    <select
                                                        className="w-full rounded-lg border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                                        value={line.accounting_account_id}
                                                        onChange={e => handleLineChange(index, 'accounting_account_id', e.target.value)}
                                                        required>
                                                        <option value="" disabled className="dark:bg-[#111827]">Seleccionar cuenta...</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id} className="dark:bg-[#111827]">{acc.code} — {acc.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                                        className="w-full rounded-lg border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                                        value={line.debit}
                                                        onChange={e => handleLineChange(index, 'debit', e.target.value)} />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                                        className="w-full rounded-lg border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                                        value={line.credit}
                                                        onChange={e => handleLineChange(index, 'credit', e.target.value)} />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <button type="button" onClick={() => removeLine(index)}
                                                        disabled={entryData.lines.length <= 2}
                                                        className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 dark:bg-[#111827] text-xs font-semibold border-t border-gray-200 dark:border-[#1E293B]">
                                        <tr>
                                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">TOTALES</td>
                                            <td className={`px-3 py-2 text-right ${cuadra ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>{fmt(totalDebe)}</td>
                                            <td className={`px-3 py-2 text-right ${cuadra ? 'text-teal-600 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}`}>{fmt(totalHaber)}</td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {!cuadra && (totalDebe > 0 || totalHaber > 0) && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                                    ⚠ El asiento no cuadra. Diferencia: {fmt(Math.abs(totalDebe - totalHaber))}
                                </p>
                            )}
                            {cuadra && totalDebe > 0 && (
                                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">✓ El asiento cuadra correctamente</p>
                            )}
                            {entryErrors.lines && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{entryErrors.lines}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsEntryModalOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl">
                                Cancelar
                            </button>
                            <button type="submit" disabled={processingEntry || !cuadra}
                                className="flex items-center gap-2 bg-[#14B8A6] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#0F766E] disabled:opacity-50 transition-colors">
                                <Save className="w-4 h-4" />
                                Guardar Asiento
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
