import { Link } from '@inertiajs/react';
import {
    TrendingUp, TrendingDown, DollarSign, Users, Calendar, Building2,
    ArrowUpRight, ArrowDownRight, ShieldCheck, Activity, ChevronRight
} from 'lucide-react';
import AreaLayout from '../../../components/AreaLayout';

interface MonthlyTrendItem {
    ym: string;
    month: string;
    income: number;
    expense: number;
    net: number;
}

interface ClinicSummary {
    id: string;
    name: string;
    city: string;
    phone: string;
    status: string;
    income: number;
    expense: number;
    net: number;
    patients: number;
    appointments: number;
}

interface Props {
    area: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
    kpis: {
        month_income: number;
        month_expenses: number;
        month_net: number;
        total_income: number;
        total_expenses: number;
        total_net: number;
        total_patients: number;
        total_appointments: number;
        month_appointments: number;
        total_clinics: number;
    };
    monthlyTrend: MonthlyTrendItem[];
    clinicsSummary: ClinicSummary[];
}

AreaDashboard.layout = (page: React.ReactNode) => <AreaLayout>{page}</AreaLayout>;

export default function AreaDashboard({ area, kpis, monthlyTrend, clinicsSummary }: Props) {
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
        }).format(amount).replace('BOB', 'Bs.');
    };

    const maxTrendValue = Math.max(
        ...monthlyTrend.map((t) => Math.max(t.income, t.expense, Math.abs(t.net))),
        1
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs uppercase tracking-wider">
                            Panel Corporativo
                        </span>
                        <span className="text-xs text-gray-400">• {kpis.total_clinics} Consultorios Asignados</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight mt-1">
                        {area.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8]">
                        Visión global y métricas consolidadas de tu red de clínicas dentales.
                    </p>
                </div>
                <Link
                    href="/area/clinics"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
                >
                    <Building2 className="w-4 h-4" />
                    <span>Ver Consultorios</span>
                </Link>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
                {/* Ingresos Mes */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ingresos Consolidados (Mes)</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {formatMoney(kpis.month_income)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                        <span>Total histórico:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(kpis.total_income)}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                {/* Egresos Mes */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Egresos Consolidados (Mes)</span>
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <ArrowDownRight className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {formatMoney(kpis.month_expenses)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                        <span>Total histórico:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(kpis.total_expenses)}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
                </div>

                {/* Margen Neto */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Beneficio Neto (Mes)</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            kpis.month_net >= 0
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold mt-2 ${
                        kpis.month_net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                        {formatMoney(kpis.month_net)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                        <span>Neto histórico:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(kpis.total_net)}</span>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${kpis.month_net >= 0 ? 'bg-teal-500' : 'bg-amber-500'}`} />
                </div>

                {/* Pacientes & Citas */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pacientes & Citas</span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                            {kpis.total_patients}
                        </p>
                        <span className="text-xs text-gray-500">pacientes activos</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                        <span>Citas este mes:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{kpis.month_appointments} citas</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white dark:bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-500" />
                            Evolución Consolidada (Últimos 6 Meses)
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Comparación de ingresos, egresos y neto agregados de toda la red.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Ingresos
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Egresos
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Neto
                        </span>
                    </div>
                </div>

                {/* Bars Visualizer */}
                <div className="grid grid-cols-6 gap-2 sm:gap-6 pt-6 pb-2 border-b border-gray-100 dark:border-white/5">
                    {monthlyTrend.map((item) => {
                        const incomeHeight = maxTrendValue > 0 ? (item.income / maxTrendValue) * 100 : 0;
                        const expenseHeight = maxTrendValue > 0 ? (item.expense / maxTrendValue) * 100 : 0;
                        const netHeight = maxTrendValue > 0 ? (Math.max(item.net, 0) / maxTrendValue) * 100 : 0;

                        return (
                            <div key={item.ym} className="flex flex-col items-center">
                                <div className="h-44 w-full flex items-end justify-center gap-1 sm:gap-2">
                                    {/* Income bar */}
                                    <div
                                        className="w-2.5 sm:w-4 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:opacity-80"
                                        style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                                        title={`Ingresos: ${formatMoney(item.income)}`}
                                    />
                                    {/* Expense bar */}
                                    <div
                                        className="w-2.5 sm:w-4 bg-red-500 rounded-t-sm transition-all duration-500 hover:opacity-80"
                                        style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                                        title={`Egresos: ${formatMoney(item.expense)}`}
                                    />
                                    {/* Net bar */}
                                    <div
                                        className="w-2.5 sm:w-4 bg-teal-500 rounded-t-sm transition-all duration-500 hover:opacity-80"
                                        style={{ height: `${Math.max(netHeight, 4)}%` }}
                                        title={`Neto: ${formatMoney(item.net)}`}
                                    />
                                </div>
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-2">
                                    {item.month}
                                </span>
                                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                    {formatMoney(item.net)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Clinics Quick Summary Table */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-teal-500" />
                            Resumen de Consultorios Asignados ({clinicsSummary.length})
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Rendimiento mensual individual por consultorio dental.
                        </p>
                    </div>
                    <Link
                        href="/area/clinics"
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                        Ver todos y acceder <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Consultorio</th>
                                <th className="py-3 px-4">Ciudad</th>
                                <th className="py-3 px-4 text-right">Ingresos (Mes)</th>
                                <th className="py-3 px-4 text-right">Egresos (Mes)</th>
                                <th className="py-3 px-4 text-right">Neto (Mes)</th>
                                <th className="py-3 px-4 text-center">Pacientes</th>
                                <th className="py-3 px-4 text-center">Citas (Mes)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {clinicsSummary.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                                {c.name.charAt(0)}
                                            </div>
                                            <span>{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-gray-500">{c.city}</td>
                                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                        {formatMoney(c.income)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-medium text-red-500 dark:text-red-400">
                                        {formatMoney(c.expense)}
                                    </td>
                                    <td className={`py-3.5 px-4 text-right font-bold ${
                                        c.net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-500'
                                    }`}>
                                        {formatMoney(c.net)}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-medium text-gray-700 dark:text-gray-300">
                                        {c.patients}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-medium text-indigo-600 dark:text-indigo-400">
                                        {c.appointments}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
