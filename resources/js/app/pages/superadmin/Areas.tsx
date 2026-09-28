import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Search, Network, Building2, Key, Eye, EyeOff, Edit, Trash2, CheckCircle2, XCircle, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import SuperAdminLayout from '../../../components/SuperAdminLayout';

interface TenantItem {
    id: string;
    name: string;
    city: string | null;
    status: string;
}

interface AreaItem {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    is_active: boolean;
    created_at: string;
    plain_password: string | null;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
    } | null;
    tenants: TenantItem[];
    tenants_count: number;
}

interface Props {
    areas: AreaItem[];
    availableTenants: TenantItem[];
}

Areas.layout = (page: React.ReactNode) => <SuperAdminLayout>{page}</SuperAdminLayout>;

export default function Areas({ areas, availableTenants }: Props) {
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState<AreaItem | null>(null);
    const [showResetPassword, setShowResetPassword] = useState<AreaItem | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    // Create form state
    const [createForm, setCreateForm] = useState<{
        name: string;
        phone: string;
        email: string;
        password: string;
        tenant_ids: string[];
    }>({
        name: '',
        phone: '',
        email: '',
        password: '',
        tenant_ids: [],
    });

    // Edit form state
    const [editForm, setEditForm] = useState<{
        name: string;
        phone: string;
        email: string;
        is_active: boolean;
        tenant_ids: string[];
    }>({
        name: '',
        phone: '',
        email: '',
        is_active: true,
        tenant_ids: [],
    });

    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filtered = areas.filter(
        (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.email.toLowerCase().includes(search.toLowerCase()) ||
            (a.phone && a.phone.includes(search))
    );

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreate = () => {
        if (!createForm.name || !createForm.email || !createForm.password) {
            setError('El nombre, correo y contraseña son obligatorios.');
            return;
        }
        setIsSaving(true);
        setError(null);

        router.post('/superadmin/areas', createForm, {
            onSuccess: () => {
                setShowCreate(false);
                setCreateForm({ name: '', phone: '', email: '', password: '', tenant_ids: [] });
            },
            onError: (errs) => {
                setError(Object.values(errs)[0] as string || 'Error al crear el área.');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    const openEdit = (area: AreaItem) => {
        setShowEdit(area);
        setEditForm({
            name: area.name,
            phone: area.phone || '',
            email: area.email,
            is_active: area.is_active,
            tenant_ids: area.tenants.map((t) => t.id),
        });
        setError(null);
    };

    const handleUpdate = () => {
        if (!showEdit) return;
        if (!editForm.name || !editForm.email) {
            setError('El nombre y correo son obligatorios.');
            return;
        }
        setIsSaving(true);
        setError(null);

        router.put(`/superadmin/areas/${showEdit.id}`, editForm, {
            onSuccess: () => {
                setShowEdit(null);
            },
            onError: (errs) => {
                setError(Object.values(errs)[0] as string || 'Error al actualizar el área.');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    const handleResetPassword = () => {
        if (!showResetPassword) return;
        if (!newPassword || newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setIsSaving(true);
        setError(null);

        router.post(`/superadmin/areas/${showResetPassword.id}/password`, { new_password: newPassword }, {
            onSuccess: () => {
                setShowResetPassword(null);
                setNewPassword('');
            },
            onError: (errs) => {
                setError(Object.values(errs)[0] as string || 'Error al resetear la contraseña.');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    const handleToggleStatus = (id: string) => {
        router.patch(`/superadmin/areas/${id}/status`);
    };

    const handleDelete = (area: AreaItem) => {
        if (confirm(`¿Estás seguro de eliminar el Área "${area.name}"? Sus clínicas asignadas no se borrarán.`)) {
            router.delete(`/superadmin/areas/${area.id}`);
        }
    };

    const toggleTenantSelection = (tenantId: string, isEdit: boolean = false) => {
        if (isEdit) {
            setEditForm((prev) => ({
                ...prev,
                tenant_ids: prev.tenant_ids.includes(tenantId)
                    ? prev.tenant_ids.filter((id) => id !== tenantId)
                    : [...prev.tenant_ids, tenantId],
            }));
        } else {
            setCreateForm((prev) => ({
                ...prev,
                tenant_ids: prev.tenant_ids.includes(tenantId)
                    ? prev.tenant_ids.filter((id) => id !== tenantId)
                    : [...prev.tenant_ids, tenantId],
            }));
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            <Network className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">
                            Áreas / Redes de Clínicas
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                        Crea cuentas corporativas de Área y asígnales consultorios dentales existentes para análisis y supervisión consolidada.
                    </p>
                </div>
                <Button
                    onClick={() => { setShowCreate(true); setError(null); }}
                    className="bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl gap-2 text-xs sm:text-sm shadow-sm cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Nueva Área
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
                <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 rounded-xl bg-white dark:bg-[#1E293B] border-[#E5E7EB] dark:border-[#334155] text-xs sm:text-sm text-[#111827] dark:text-white"
                />
            </div>

            {/* Areas Cards / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((area) => {
                    const isPassVisible = Boolean(visiblePasswords[area.id]);
                    return (
                        <div
                            key={area.id}
                            className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                                            {area.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                                {area.name}
                                            </h2>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                                                area.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                                    : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                                            }`}>
                                                {area.is_active ? '● Activa' : '○ Inactiva'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(area)}
                                            className="p-1.5 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            title="Editar Área"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setShowResetPassword(area); setError(null); }}
                                            className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            title="Cambiar Contraseña"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(area)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            title="Eliminar Área"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 py-3 border-y border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 truncate">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="font-mono text-gray-800 dark:text-gray-200 truncate">{area.email}</span>
                                    </div>
                                    {area.phone && (
                                        <div className="flex items-center gap-2 truncate">
                                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{area.phone}</span>
                                        </div>
                                    )}

                                    {/* Password field indicator */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[11px] text-gray-400">Contraseña:</span>
                                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-white/10">
                                            <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                                                {area.plain_password
                                                    ? (isPassVisible ? area.plain_password : '••••••••')
                                                    : 'Encriptada'}
                                            </span>
                                            {area.plain_password && (
                                                <button
                                                    onClick={() => togglePasswordVisibility(area.id)}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                                                    title={isPassVisible ? 'Ocultar' : 'Mostrar'}
                                                >
                                                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Assigned Clinics List */}
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                            Clínicas Asignadas ({area.tenants_count})
                                        </span>
                                    </div>

                                    {area.tenants.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                            {area.tenants.map((t) => (
                                                <span
                                                    key={t.id}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs border border-teal-200/50 dark:border-teal-800/40 font-medium"
                                                >
                                                    <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                                                    <span className="truncate max-w-[140px]">{t.name}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                                            Sin clínicas asignadas todavía.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                                <span className="text-gray-400 text-[11px]">Creada: {area.created_at}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(area.id)}
                                    className="text-xs h-7 rounded-lg cursor-pointer"
                                >
                                    {area.is_active ? 'Desactivar' : 'Activar'}
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-white/10">
                        <Network className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No se encontraron Áreas</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            Comienza creando una nueva cuenta de Área para agrupar consultorios existentes.
                        </p>
                        <Button
                            onClick={() => { setShowCreate(true); setError(null); }}
                            className="mt-4 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl gap-2 text-xs"
                        >
                            <Plus className="w-4 h-4" /> Crear primera Área
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Area Modal */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg bg-white dark:bg-[#0F172A] border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Network className="w-5 h-5 text-teal-500" />
                            Nueva Área / Red de Clínicas
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Nombre del Área *
                            </Label>
                            <Input
                                placeholder="Ej. Red Dental Santa Cruz, Área Odontológica Central"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Celular / Teléfono
                                </Label>
                                <Input
                                    placeholder="+591 70000000"
                                    value={createForm.phone}
                                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Correo Electrónico (Login) *
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="area@dentalsoft.app"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Contraseña de Acceso *
                            </Label>
                            <Input
                                type="text"
                                placeholder="Mínimo 6 caracteres"
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                className="mt-1 text-xs font-mono"
                            />
                        </div>

                        {/* Clinic selector */}
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                Asignar Clínicas Existentes ({createForm.tenant_ids.length} seleccionadas)
                            </Label>
                            <p className="text-[11px] text-gray-500 mb-2">
                                Marca las clínicas dentales que pertenecerán a esta área:
                            </p>

                            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl p-2 space-y-1 bg-gray-50/50 dark:bg-white/5">
                                {availableTenants.map((t) => {
                                    const isSelected = createForm.tenant_ids.includes(t.id);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => toggleTenantSelection(t.id, false)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                                isSelected
                                                    ? 'bg-teal-500/15 border border-teal-500/30 text-teal-900 dark:text-teal-200 font-medium'
                                                    : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                                                <span className="truncate">{t.name}</span>
                                                {t.city && <span className="text-[10px] text-gray-400">({t.city})</span>}
                                            </div>
                                            {isSelected ? (
                                                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)} className="text-xs">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSaving}
                            className="bg-[#14B8A6] hover:bg-[#0F766E] text-white text-xs"
                        >
                            {isSaving ? 'Creando...' : 'Crear Área'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Area Modal */}
            <Dialog open={Boolean(showEdit)} onOpenChange={(open) => !open && setShowEdit(null)}>
                <DialogContent className="max-w-lg bg-white dark:bg-[#0F172A] border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-teal-500" />
                            Editar Área: {showEdit?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Nombre del Área *
                            </Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Celular / Teléfono
                                </Label>
                                <Input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Correo Electrónico *
                                </Label>
                                <Input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="mt-1 text-xs"
                                />
                            </div>
                        </div>

                        {/* Clinic selector */}
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                Clínicas Asignadas ({editForm.tenant_ids.length} seleccionadas)
                            </Label>

                            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl p-2 space-y-1 bg-gray-50/50 dark:bg-white/5">
                                {availableTenants.map((t) => {
                                    const isSelected = editForm.tenant_ids.includes(t.id);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => toggleTenantSelection(t.id, true)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                                isSelected
                                                    ? 'bg-teal-500/15 border border-teal-500/30 text-teal-900 dark:text-teal-200 font-medium'
                                                    : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                                                <span className="truncate">{t.name}</span>
                                                {t.city && <span className="text-[10px] text-gray-400">({t.city})</span>}
                                            </div>
                                            {isSelected ? (
                                                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEdit(null)} className="text-xs">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSaving}
                            className="bg-[#14B8A6] hover:bg-[#0F766E] text-white text-xs"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Modal */}
            <Dialog open={Boolean(showResetPassword)} onOpenChange={(open) => !open && setShowResetPassword(null)}>
                <DialogContent className="max-w-sm bg-white dark:bg-[#0F172A] border-gray-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-500" />
                            Cambiar Contraseña
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900">
                            {error}
                        </div>
                    )}

                    <div className="py-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                            Ingresa la nueva contraseña para el área <strong>{showResetPassword?.name}</strong>:
                        </p>
                        <Input
                            type="text"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="text-xs font-mono"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetPassword(null)} className="text-xs">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={isSaving}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        >
                            {isSaving ? 'Actualizando...' : 'Actualizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
