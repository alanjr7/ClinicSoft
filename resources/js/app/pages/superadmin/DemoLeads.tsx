import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Sparkles, Phone, MessageSquare, Trash2, Search, Clock, Building2 } from 'lucide-react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { Input } from '../../components/ui/input';

interface DemoLead {
    id: string;
    full_name: string;
    whatsapp: string;
    company_name: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface Props {
    leads: DemoLead[];
}

DemoLeads.layout = (page: React.ReactNode) => <SuperAdminLayout>{page}</SuperAdminLayout>;

export default function DemoLeads({ leads = [] }: Props) {
    const [search, setSearch] = useState('');

    const filteredLeads = leads.filter((l) => {
        const query = search.toLowerCase();
        return (
            l.full_name.toLowerCase().includes(query) ||
            l.whatsapp.toLowerCase().includes(query) ||
            (l.company_name && l.company_name.toLowerCase().includes(query)) ||
            (l.ip_address && l.ip_address.includes(query))
        );
    });

    const formatWhatsAppUrl = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`Hola ${name}, te saludamos desde ClinicSoft. Vimos que iniciaste el modo prueba. ¿En qué podemos ayudarte para comenzar a usar la plataforma en tu clínica?`);
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

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`¿Eliminar el registro de demo de "${name}"?`)) return;
        router.delete(`/superadmin/demo-leads/${id}`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                            Leads y Registros de Modo Prueba
                        </h1>
                        <p className="text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm mt-0.5">
                            Base de datos de clientes potenciales que han accedido a la demo interactiva
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="px-4 py-2 bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl shadow-sm">
                        <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Total Leads: </span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{leads.length}</span>
                    </div>
                </div>
            </div>

            {/* Filter Search */}
            <div className="mb-6 max-w-md w-full relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                    placeholder="Buscar por nombre, WhatsApp o clínica..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 sm:h-11 rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-sm"
                />
            </div>

            {/* Leads Table */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[680px]">
                        <thead>
                            <tr className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B]">
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Prospecto</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">WhatsApp</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Empresa / Clínica</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">IP / Red</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Fecha y Hora</th>
                                <th className="text-right px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                            {filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280] dark:text-[#94A3B8]">
                                        <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                        {search ? 'No se encontraron prospectos con ese criterio de búsqueda' : 'Aún no se han registrado accesos en modo demo'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="px-5 sm:px-6 py-4 font-semibold text-[#111827] dark:text-[#F8FAFC]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {lead.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-[#111827] dark:text-[#F8FAFC]">{lead.full_name}</p>
                                                    <span className="text-[10px] text-gray-400 font-mono">ID: {lead.id.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 font-mono text-sm whitespace-nowrap">
                                            <a
                                                href={formatWhatsAppUrl(lead.whatsapp, lead.full_name)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 transition-colors"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {lead.whatsapp}
                                            </a>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-[#6B7280] dark:text-[#94A3B8]">
                                            {lead.company_name ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px] block">{lead.company_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No especificada</span>
                                            )}
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-xs font-mono text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">
                                            {lead.ip_address ?? '—'}
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-xs text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {formatDate(lead.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={formatWhatsAppUrl(lead.whatsapp, lead.full_name)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 bg-[#14B8A6] hover:bg-[#0F766E] text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
                                                >
                                                    <Phone className="w-3.5 h-3.5" /> WhatsApp
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(lead.id, lead.full_name)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
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

