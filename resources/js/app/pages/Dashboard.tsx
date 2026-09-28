import { Link } from '@inertiajs/react';
import {
    Calendar, Users, DollarSign, AlertCircle, Clock,
    ShieldAlert, Settings as SettingsIcon, Stethoscope, Activity, Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Layout from '../components/Layout';
import { useAuth } from '../../hooks/useAuth';

interface TodayAppointment {
    id: string;
    patient: string;
    time: string;
    treatment: string;
    status: string;
}

interface Stats {
    today_appointments: number;
    total_patients: number;
    month_income: number;
    pending_amount: number;
}

interface Props {
    stats: Stats;
    today_appointments: TodayAppointment[];
}

Dashboard.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Dashboard({ stats, today_appointments }: Props) {
    const { user, hasModule } = useAuth();

    const isFullAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.global_role === 'superadmin';
    const canAppointments = hasModule('appointments');
    const canPatients = hasModule('patients');
    const canPayments = hasModule('payments');
    const canClinical = hasModule('clinical');
    const canSurgeries = hasModule('surgeries');
    const canInventory = hasModule('inventory');

    const hasAnyModule = isFullAdmin || Boolean(user?.permissions && user.permissions.length > 0);

    const formatCurrency = (n: number) =>
        'Bs. ' + (n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 0 });

    const allStatCards = [
        {
            module: 'appointments' as const,
            title: 'Citas de Hoy',
            value: stats.today_appointments,
            icon: Calendar,
            textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
            bgLight: 'bg-[#F0F9FF] dark:bg-[#0284C7]/10',
            change: `${stats.today_appointments} programadas`,
            visible: canAppointments,
        },
        {
            module: 'patients' as const,
            title: 'Pacientes Registrados',
            value: stats.total_patients,
            icon: Users,
            textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
            bgLight: 'bg-[#E0F2FE] dark:bg-sky-950/40',
            change: 'pacientes activos',
            visible: canPatients,
        },
        {
            module: 'payments' as const,
            title: 'Ingresos del Mes',
            value: formatCurrency(stats.month_income),
            icon: DollarSign,
            textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
            bgLight: 'bg-[#F0F9FF] dark:bg-[#0284C7]/10',
            change: 'mes actual',
            visible: canPayments,
        },
        {
            module: 'payments' as const,
            title: 'Pagos Pendientes',
            value: formatCurrency(stats.pending_amount),
            icon: AlertCircle,
            textColor: 'text-[#F59E0B] dark:text-amber-400',
            bgLight: 'bg-[#FEF3C7] dark:bg-amber-950/40',
            change: 'facturas abiertas',
            visible: canPayments,
        },
    ];

    const visibleStatCards = allStatCards.filter(c => c.visible);

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Dashboard</h1>
                <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm capitalize">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* If the user has NO active modules assigned */}
            {!hasAnyModule ? (
                <Card className="rounded-3xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center mx-auto mb-4 text-[#F59E0B]">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-2">
                        Sin Módulos Asignados
                    </h2>
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-relaxed mb-6">
                        Hola <strong>{user?.first_name} {user?.last_name}</strong>. Tu cuenta de <strong>{user?.role === 'doctor' ? 'Doctor' : 'Asistente'}</strong> se encuentra activa, pero el administrador de la clínica aún no te ha habilitado acceso a ningún módulo de trabajo.
                    </p>
                    <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-300 max-w-md mx-auto mb-6">
                        Para comenzar a operar, solicita al Administrador de la clínica que active los módulos correspondientes en tu usuario desde la sección de Configuración.
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/settings"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white text-sm font-medium transition-colors cursor-pointer"
                        >
                            <SettingsIcon className="w-4 h-4" /> Mi Perfil y Contraseña
                        </Link>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Stats Cards (Filtered by user permissions) */}
                    {visibleStatCards.length > 0 && (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(visibleStatCards.length, 4)} gap-6 mb-8`}>
                            {visibleStatCards.map((stat) => (
                                <Card key={stat.title} className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl ${stat.bgLight} flex items-center justify-center`}>
                                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                            </div>
                                        </div>
                                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">{stat.title}</p>
                                        <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-2">{stat.value}</p>
                                        <p className={`text-xs font-medium ${stat.textColor}`}>{stat.change}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions + Today's Appointments */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {canAppointments && (
                            <Card className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Próximas Citas de Hoy</CardTitle>
                                    <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">{stats.today_appointments} citas programadas</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {today_appointments.length === 0 ? (
                                            <p className="text-[#6B7280] dark:text-[#94A3B8] text-center py-8 text-sm">No hay citas para hoy</p>
                                        ) : (
                                            today_appointments.map((appt) => (
                                                <div
                                                    key={appt.id}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 transition-colors border border-transparent hover:border-[#BAE6FD] dark:hover:border-[#0284C7]/30"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#0284C7] flex items-center justify-center shrink-0">
                                                            <Clock className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{appt.patient}</p>
                                                            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{appt.treatment}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[#111827] dark:text-[#F8FAFC] font-medium text-sm">{appt.time}</span>
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                                            appt.status === 'confirmed'
                                                                ? 'bg-[#F0F9FF] dark:bg-[#0284C7]/20 text-[#0284C7] dark:text-[#38BDF8]'
                                                                : 'bg-[#FEF3C7] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400'
                                                        }`}>
                                                            {appt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions (only enabled modules) */}
                        <Card className={`${canAppointments ? 'lg:col-span-1' : 'lg:col-span-3'} rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm`}>
                            <CardHeader>
                                <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Accesos Rápidos</CardTitle>
                                <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">Acciones habilitadas para tu perfil</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {canAppointments && (
                                    <Link
                                        href="/appointments"
                                        className="flex items-center justify-center gap-2 w-full bg-[#0284C7] hover:bg-[#0369A1] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <Calendar className="w-4 h-4" /> Nueva Cita
                                    </Link>
                                )}
                                {canPatients && (
                                    <Link
                                        href="/patients"
                                        className="flex items-center justify-center gap-2 w-full bg-[#0369A1] hover:bg-[#075985] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <Users className="w-4 h-4" /> Pacientes
                                    </Link>
                                )}
                                {canClinical && (
                                    <Link
                                        href="/clinical-history"
                                        className="flex items-center justify-center gap-2 w-full bg-[#0284C7] hover:bg-[#075985] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <Stethoscope className="w-4 h-4" /> Consultas Médicas
                                    </Link>
                                )}
                                {canSurgeries && (
                                    <Link
                                        href="/surgeries"
                                        className="flex items-center justify-center gap-2 w-full bg-[#075985] hover:bg-[#0C4A6E] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <Activity className="w-4 h-4" /> Cirugías
                                    </Link>
                                )}
                                {canPayments && (
                                    <Link
                                        href="/payments"
                                        className="flex items-center justify-center gap-2 w-full bg-[#075985] hover:bg-[#0C4A6E] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <DollarSign className="w-4 h-4" /> Registrar Pago
                                    </Link>
                                )}
                                {canInventory && (
                                    <Link
                                        href="/inventory"
                                        className="flex items-center justify-center gap-2 w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center font-medium text-sm"
                                    >
                                        <Package className="w-4 h-4" /> Farmacia e Insumos
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
