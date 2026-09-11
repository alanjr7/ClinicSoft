import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Building2, Search, ArrowRight, Key, Eye, EyeOff, Mail, Phone,
    MapPin, CheckCircle2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight,
    ExternalLink, Users, Calendar
} from 'lucide-react';
import AreaLayout from '../../../components/AreaLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface ClinicUser {
    id: string;
    name: string;
    email: string;
    role: string;
    plain_password: string | null;
}

interface ClinicItem {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    status: string;
    plan_name: string | null;
    currency: string;
    month_income: number;
    month_expense: number;
    month_net: number;
    total_income: number;
    total_expense: number;
    total_net: number;
    total_patients: number;
    total_appointments: number;
    users: ClinicUser[];
}

interface Props {
    area: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
    clinics: ClinicItem[];
}

AreaClinics.layout = (page: React.ReactNode) => <AreaLayout>{page}</AreaLayout>;

export default function AreaClinics({ area, clinics }: Props) {
    const [search, setSearch] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [isEntering, setIsEntering] = useState<string | null>(null);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
        }).format(amount).replace('BOB', 'Bs.');
    };

    const filtered = clinics.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
    );

    const togglePassword = (key: string) => {
        setVisiblePasswords((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleImpersonate = (clinic: ClinicItem) => {
        setIsEntering(clinic.id);
        router.post(`/area/clinics/${clinic.id}/impersonate`, {}, {
            onFinish: () => setIsEntering(null),
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
                        <Building2 className="w-7 h-7 text-sky-500" />
                        Consultorios Asignados ({clinics.length})
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Supervisa el estado contable de cada consultorio e ingresa a su ERP con un solo clic.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                <Input
                    placeholder="Buscar consultorio por nombre, ciudad o correo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] text-xs sm:text-sm"
                />
            </div>

            {/* Clinics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((clinic) => {
                    const primaryUser = clinic.users[0] || null;
                    const passKey = `user-${primaryUser?.id || clinic.id}`;
                    const isPassVisible = Boolean(visiblePasswords[passKey]);

                    return (
                        <div
                            key={clinic.id}
                            className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                                            {clinic.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                                {clinic.name}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {clinic.city && (
                                                    <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        {clinic.city}
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                                                    clinic.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                }`}>
                                                    {clinic.status === 'active' ? '● Activa' : '○ En Prueba'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Snapshot (Accounting) */}
                                <div className="my-3 p-3 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                                        <span>Contabilidad (Mes en Curso)</span>
                                        <DollarSign className="w-3.5 h-3.5 text-sky-500" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                        <div className="bg-white dark:bg-[#0B1120] p-2 rounded-lg border border-gray-100 dark:border-white/5">
                                            <span className="text-[10px] text-gray-500 block">Ingresos</span>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                {formatMoney(clinic.month_income)}
                                            </span>
                                        </div>

                                        <div className="bg-white dark:bg-[#0B1120] p-2 rounded-lg border border-gray-100 dark:border-white/5">
                                            <span className="text-[10px] text-gray-500 block">Egresos</span>
                                            <span className="text-xs font-bold text-red-500 dark:text-red-400 font-mono">
                                                {formatMoney(clinic.month_expense)}
                                            </span>
                                        </div>

                                        <div className="bg-white dark:bg-[#0B1120] p-2 rounded-lg border border-gray-100 dark:border-white/5">
                                            <span className="text-[10px] text-gray-500 block">Neto</span>
                                            <span className={`text-xs font-bold font-mono ${
                                                clinic.month_net >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-500'
                                            }`}>
                                                {formatMoney(clinic.month_net)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-200/40 dark:border-white/5">
                                        <span>Pacientes: <strong>{clinic.total_patients}</strong></span>
                                        <span>Citas Totales: <strong>{clinic.total_appointments}</strong></span>
                                    </div>
                                </div>

                                {/* Credentials Info */}
                                {primaryUser && (
                                    <div className="text-xs space-y-1.5 py-2 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-gray-400">Usuario Administrador:</span>
                                            <span className="font-mono text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                                                {primaryUser.email}
                                            </span>
                                        </div>

                                        {primaryUser.plain_password && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400">Contraseña:</span>
                                                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-white/10">
                                                    <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                                                        {isPassVisible ? primaryUser.plain_password : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePassword(passKey)}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                                                        title={isPassVisible ? 'Ocultar' : 'Mostrar'}
                                                    >
                                                        {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Button: Impersonate */}
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                <Button
                                    onClick={() => handleImpersonate(clinic)}
                                    disabled={isEntering === clinic.id}
                                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl gap-2 text-xs font-semibold py-2.5 shadow-sm transition-all cursor-pointer"
                                >
                                    <Key className="w-3.5 h-3.5" />
                                    <span>{isEntering === clinic.id ? 'Ingresando...' : 'Ingresar a esta Clínica'}</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-white/10">
                        <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No se encontraron consultorios</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            No hay consultorios asignados a esta área que coincidan con la búsqueda.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
