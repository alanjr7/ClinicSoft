import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    BarChart3, Calendar, Filter, TrendingUp, DollarSign,
    Users, ArrowUpRight, ArrowDownRight, Award, Layers
} from 'lucide-react';
import AreaLayout from '../../../components/AreaLayout';
import { Button } from '../../components/ui/button';

interface ClinicComparison {
    id: string;
    name: string;
    city: string;
    income: number;
    expense: number;
    net: number;
    margin: number;
    appointments: number;
    patients: number;
    new_patients: number;
}

interface Props {
    area: {
        id: string;
        name: string;
    };
    period: {
        month: number;
        year: number;
    };
    clinicComparisons: ClinicComparison[];
    summary: {
        total_income: number;
        total_expenses: number;
        total_net: number;
        total_appointments: number;
        total_new_patients: number;
    };
}

const MONTHS = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
];

AreaReports.layout = (page: React.ReactNode) => <AreaLayout>{page}</AreaLayout>;

export default function AreaReports({ area, period, clinicComparisons, summary }: Props) {
    const [selectedMonth, setSelectedMonth] = useState(period.month);
    const [selectedYear, setSelectedYear] = useState(period.year);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
        }).format(amount).replace('BOB', 'Bs.');
    };

    const handleFilter = () => {
        router.get('/area/reports', { month: selectedMonth, year: selectedYear }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const maxIncome = Math.max(...clinicComparisons.map((c) => c.income), 1);
    const topIncomeClinic = [...clinicComparisons].sort((a, b) => b.income - a.income)[0];
    const topMarginClinic = [...clinicComparisons].sort((a, b) => b.margin - a.margin)[0];

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header & Period Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
                        <BarChart3 className="w-7 h-7 text-teal-500" />
                        Reportes & KPIs Comparativos
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Compara el rendimiento financiero, volumen de citas y captación de pacientes entre todas las clínicas del área.
                    </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2 bg-white dark:bg-[#0F172A] p-2 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
                    <Calendar className="w-4 h-4 text-teal-600 ml-2 shrink-0" />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent border-0 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer"
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900">
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent border-0 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer"
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y} className="bg-white dark:bg-slate-900">
                                {y}
                            </option>
                        ))}
                    </select>

                    <Button
                        onClick={handleFilter}
                        size="sm"
                        className="bg-[#14B8A6] hover:bg-[#0F766E] text-white text-xs rounded-xl h-8 px-3"
                    >
                        <Filter className="w-3.5 h-3.5 mr-1" /> Filtrar
                    </Button>
                </div>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">Ingresos Totales del Período</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatMoney(summary.total_income)}
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">Egresos Totales del Período</span>
                    <p className="text-xl font-bold text-red-500 dark:text-red-400 mt-1">
                        {formatMoney(summary.total_expenses)}
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">Margen Neto Global</span>
                    <p className={`text-xl font-bold mt-1 ${summary.total_net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-500'}`}>
                        {formatMoney(summary.total_net)}
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">Citas & Nuevos Pacientes</span>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {summary.total_appointments} citas <span className="text-xs font-normal text-gray-400">({summary.total_new_patients} nuevos)</span>
                    </p>
                </div>
            </div>

            {/* Comparative Visual Bars (Income per Clinic) */}
            <div className="bg-white dark:bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-500" />
                            Comparativa de Ingresos por Consultorio
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Distribución de recaudación en {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                        </p>
                    </div>

                    {topIncomeClinic && (
                        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 font-medium">
                            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Mayor recaudación: <strong>{topIncomeClinic.name}</strong></span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {clinicComparisons.map((c) => {
                        const percent = maxIncome > 0 ? (c.income / maxIncome) * 100 : 0;
                        return (
                            <div key={c.id} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                                        {c.name} {c.city && <span className="text-[11px] text-gray-400 font-normal">({c.city})</span>}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-[11px]">Neto: {formatMoney(c.net)}</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {formatMoney(c.income)}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(percent, 2)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {clinicComparisons.length === 0 && (
                        <p className="text-xs text-gray-500 py-6 text-center">No hay consultorios asignados en esta área.</p>
                    )}
                </div>
            </div>

            {/* Detailed Comparative Table */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Tabla Comparativa Detallada
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Métricas de desempeño financiero y operativo por consultorio dental.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="py-3 px-4">Consultorio</th>
                                <th className="py-3 px-4 text-right">Ingresos</th>
                                <th className="py-3 px-4 text-right">Egresos</th>
                                <th className="py-3 px-4 text-right">Neto</th>
                                <th className="py-3 px-4 text-right">Margen (%)</th>
                                <th className="py-3 px-4 text-center">Citas</th>
                                <th className="py-3 px-4 text-center">Pacientes Totales</th>
                                <th className="py-3 px-4 text-center">Nuevos Pacientes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {clinicComparisons.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                                        <div>
                                            <span>{c.name}</span>
                                            {c.city && <p className="text-[10px] text-gray-400 font-normal">{c.city}</p>}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatMoney(c.income)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-medium text-red-500 dark:text-red-400 font-mono">
                                        {formatMoney(c.expense)}
                                    </td>
                                    <td className={`py-3.5 px-4 text-right font-bold font-mono ${
                                        c.net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-500'
                                    }`}>
                                        {formatMoney(c.net)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                            c.margin >= 30
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : c.margin >= 0
                                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                                                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                        }`}>
                                            {c.margin}%
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-medium text-indigo-600 dark:text-indigo-400">
                                        {c.appointments}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-medium text-gray-700 dark:text-gray-300">
                                        {c.patients}
                                    </td>
                                    <td className="py-3.5 px-4 text-center font-medium text-teal-600 dark:text-teal-400">
                                        +{c.new_patients}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50/80 dark:bg-white/10 font-bold text-gray-900 dark:text-white border-t-2 border-gray-200 dark:border-white/10">
                            <tr>
                                <td className="py-3.5 px-4">TOTALES CONSOLIDADOS</td>
                                <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                    {formatMoney(summary.total_income)}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono text-red-500 dark:text-red-400">
                                    {formatMoney(summary.total_expenses)}
                                </td>
                                <td className={`py-3.5 px-4 text-right font-mono ${
                                    summary.total_net >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-500'
                                }`}>
                                    {formatMoney(summary.total_net)}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                    {summary.total_income > 0
                                        ? `${roundMargin((summary.total_net / summary.total_income) * 100)}%`
                                        : '0%'}
                                </td>
                                <td className="py-3.5 px-4 text-center text-indigo-600 dark:text-indigo-400">
                                    {summary.total_appointments}
                                </td>
                                <td className="py-3.5 px-4 text-center">-</td>
                                <td className="py-3.5 px-4 text-center text-teal-600 dark:text-teal-400">
                                    +{summary.total_new_patients}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

function roundMargin(num: number) {
    return Math.round(num * 10) / 10;
}
