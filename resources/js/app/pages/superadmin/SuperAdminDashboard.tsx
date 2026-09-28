import { Link } from '@inertiajs/react';
import { Building2, Activity, TrendingUp, Sparkles, Phone, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';

interface Tenant {
    id: string;
    name: string;
    city: string | null;
    status: string;
    plan_name: string | null;
}

interface DemoLead {
    id: string;
    full_name: string;
    whatsapp: string;
    company_name: string | null;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    tenants: Tenant[];
    demoLeads: DemoLead[];
    totalDemoLeads: number;
}

SuperAdminDashboard.layout = (page: React.ReactNode) => <SuperAdminLayout>{page}</SuperAdminLayout>;

export default function SuperAdminDashboard({ tenants, demoLeads = [], totalDemoLeads = 0 }: Props) {
    const stats = {
        total:          tenants.length,
        active:         tenants.filter((t) => t.status === 'active').length,
        trial:          tenants.filter((t) => t.status === 'trial').length,
        demoLeadsCount: totalDemoLeads,
    };

    const statCards = [
        { label: 'Total Clínicas',       value: stats.total,          icon: Building2, color: 'text-[#14B8A6] dark:text-[#2DD4BF] bg-[#F0FDFA] dark:bg-[#14B8A6]/15' },
        { label: 'Clínicas Activas',     value: stats.active,         icon: Activity,  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
        { label: 'En Periodo de Prueba', value: stats.trial,          icon: TrendingUp,color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
        { label: 'Prospectos Demo',      value: stats.demoLeadsCount, icon: Sparkles,  color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40' },
    ];

    const formatWhatsAppUrl = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hola ${name}, vimos que ingresaste al modo prueba de DentalSoft. ¿Te gustaría agendar una demo guiada o tienes alguna consulta?`);
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                        Dashboard SuperAdmin
                    </h1>
                    <p className="text-[#6B7280] dark:text-[#94A3B8] mt-1 text-xs sm:text-sm">
                        Resumen general de la plataforma, clínicas activas y captación de leads
                    </p>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {statCards.map((card) => (
                    <div 
                        key={card.label} 
                        className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] font-medium">{card.label}</p>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ────────────────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN MODO PRUEBA / PROSPECTOS DEMO                                      */}
            {/* ────────────────────────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden mb-6 sm:mb-8">
                <div className="px-4 sm:px-6 py-4 border-b border-[#F3F4F6] dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm sm:text-base text-[#111827] dark:text-[#F8FAFC]">
                                Registros de Modo Prueba (Leads Demo)
                            </h2>
                            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                                Doctores y clínicas que ingresaron a probar la plataforma
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/superadmin/demo-leads"
                        className="text-xs font-semibold text-[#14B8A6] hover:text-[#0F766E] dark:hover:text-[#2DD4BF] flex items-center gap-1 self-start sm:self-auto px-2 py-1 rounded-lg hover:bg-[#14B8A6]/10 transition-colors"
                    >
                        Ver todos ({totalDemoLeads}) <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[650px]">
                        <thead>
                            <tr className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B]">
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Nombre Completo</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">WhatsApp</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Empresa / Clínica</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Fecha de Acceso</th>
                                <th className="text-right px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                            {demoLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-[#6B7280] dark:text-[#94A3B8]">
                                        <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                        Aún no hay registros de usuarios en modo prueba
                                    </td>
                                </tr>
                            ) : (
                                demoLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="px-5 sm:px-6 py-3.5 font-medium text-[#111827] dark:text-[#F8FAFC]">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {lead.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate max-w-[200px]">{lead.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-3.5 font-mono text-sm whitespace-nowrap">
                                            <a
                                                href={formatWhatsAppUrl(lead.whatsapp, lead.full_name)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 transition-colors"
                                                title="Contactar por WhatsApp"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {lead.whatsapp}
                                            </a>
                                        </td>
                                        <td className="px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8]">
                                            {lead.company_name ? (
                                                <span className="font-medium text-gray-800 dark:text-gray-200 truncate block max-w-[180px]">
                                                    {lead.company_name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">No especificada</span>
                                            )}
                                        </td>
                                        <td className="px-5 sm:px-6 py-3.5 text-xs text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {formatDate(lead.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-3.5 text-right whitespace-nowrap">
                                            <a
                                                href={formatWhatsAppUrl(lead.whatsapp, lead.full_name)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 bg-[#14B8A6] hover:bg-[#0F766E] text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
                                            >
                                                <Phone className="w-3.5 h-3.5" /> Contactar
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick clinic table */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-[#F3F4F6] dark:border-[#1E293B] flex items-center justify-between">
                    <h2 className="font-semibold text-sm sm:text-base text-[#111827] dark:text-[#F8FAFC]">Clínicas Registradas</h2>
                    <Link
                        href="/superadmin/clinics"
                        className="text-xs font-semibold text-[#14B8A6] hover:text-[#0F766E] dark:hover:text-[#2DD4BF] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#14B8A6]/10 transition-colors"
                    >
                        Ver todas <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                        <thead>
                            <tr className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B]">
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Nombre</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Plan</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Ciudad</th>
                                <th className="text-left px-5 sm:px-6 py-3 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                            {tenants.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-[#6B7280] dark:text-[#94A3B8]">No hay clínicas registradas aún</td></tr>
                            ) : (
                                tenants.slice(0, 10).map((t) => (
                                    <tr key={t.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="px-5 sm:px-6 py-3.5 font-medium text-[#111827] dark:text-[#F8FAFC]">{t.name}</td>
                                        <td className="px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">{t.plan_name ?? '—'}</td>
                                        <td className="px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8]">{t.city ?? '—'}</td>
                                        <td className="px-5 sm:px-6 py-3.5 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active:    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
        trial:     'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
        suspended: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300',
        cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        active: 'Activa', trial: 'Prueba', suspended: 'Suspendida', cancelled: 'Cancelada',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${styles[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {labels[status] ?? status}
        </span>
    );
}

