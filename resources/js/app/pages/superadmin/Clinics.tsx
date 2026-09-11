import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Search, Building2, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import SuperAdminLayout from '../../../components/SuperAdminLayout';

interface Tenant {
    id: string;
    name: string;
    email: string;
    city: string | null;
    status: string;
    plan_name: string | null;
    plan_id: string | null;
}

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
}

interface Props {
    tenants: Tenant[];
    plans: Plan[];
}

Clinics.layout = (page: React.ReactNode) => <SuperAdminLayout>{page}</SuperAdminLayout>;

export default function Clinics({ tenants, plans }: Props) {
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filtered = tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        if (!form.name || !form.slug || !form.email || !form.plan_id) {
            setError('Nombre, slug, email y plan son obligatorios');
            return;
        }
        setIsSaving(true);
        setError(null);
        router.post('/superadmin/clinics', form, {
            onSuccess: () => { setShowCreate(false); setForm({}); },
            onError: () => setError('Error al crear la clínica'),
            onFinish: () => setIsSaving(false),
        });
    };

    const handleStatusToggle = (tenant: Tenant) => {
        const next = tenant.status === 'active' ? 'suspended' : 'active';
        router.patch(`/superadmin/clinics/${tenant.id}/status`, { status: next });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                        Clínicas Registradas
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Gestiona las clínicas dentales activas y en periodo de prueba en la plataforma
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl gap-2 text-xs sm:text-sm shadow-sm cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Nueva clínica
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                <Input
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 sm:h-11 rounded-xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-sm"
                />
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[620px]">
                        <thead>
                            <tr className="border-b border-[#F3F4F6] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]">
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Clínica</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Plan</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Ciudad</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Estado</th>
                                <th className="text-right px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280] dark:text-[#94A3B8]">
                                        <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-sm">No hay clínicas registradas que coincidan</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="px-5 sm:px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-sm text-[#111827] dark:text-[#F8FAFC]">{t.name}</p>
                                                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{t.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-6 py-4 text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">{t.plan_name ?? '—'}</td>
                                        <td className="px-5 sm:px-6 py-4 text-[#6B7280] dark:text-[#94A3B8]">{t.city ?? '—'}</td>
                                        <td className="px-5 sm:px-6 py-4 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                                        <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => router.visit(`/superadmin/clinics/${t.id}`)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#075985] dark:hover:text-[#38BDF8] hover:underline cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(t)}
                                                    className={`text-xs font-semibold hover:underline cursor-pointer ${
                                                        t.status === 'active' 
                                                            ? 'text-red-500 hover:text-red-600 dark:text-red-400' 
                                                            : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {t.status === 'active' ? 'Suspender' : 'Activar'}
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

            {/* Modal crear clínica */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Nueva clínica</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Nombre *</Label>
                                <Input 
                                    placeholder="Clínica Smile" 
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Slug * (subdominio)</Label>
                                <Input 
                                    placeholder="clinica-smile" 
                                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Email *</Label>
                            <Input 
                                type="email" 
                                placeholder="admin@clinica.com" 
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Teléfono</Label>
                                <Input 
                                    placeholder="+591 70000000" 
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Ciudad</Label>
                                <Input 
                                    placeholder="Santa Cruz" 
                                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Plan *</Label>
                            <select
                                className="w-full h-10 border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                                onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
                                defaultValue=""
                            >
                                <option value="" disabled>Selecciona un plan</option>
                                {plans.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} — Bs. {p.price_monthly}/mes</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancelar</Button>
                        <Button
                            disabled={isSaving}
                            className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl"
                            onClick={handleCreate}
                        >
                            {isSaving ? 'Guardando...' : 'Crear clínica'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        active:    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
        trial:     'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
        suspended: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300',
        cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        active: 'Activa', trial: 'Prueba', suspended: 'Suspendida', cancelled: 'Cancelada',
    };
    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
            {labels[status] ?? status}
        </span>
    );
}

