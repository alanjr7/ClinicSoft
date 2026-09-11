import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { 
    ArrowLeft, Plus, UserCheck, UserX, KeyRound, Eye, EyeOff, 
    Pencil, Trash2, Copy, Check, Shield, Lock, AlertCircle 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../../components/ui/dialog';
import SuperAdminLayout from '../../../components/SuperAdminLayout';

interface Tenant {
    id: string;
    name: string;
    email: string;
    city: string | null;
    country: string | null;
    status: string;
    plan_name: string | null;
    default_tax_rate: number;
}

interface ClinicUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    joined_at: string;
    plain_password?: string | null;
}

interface Props {
    tenant: Tenant;
    users: ClinicUser[];
}

ClinicDetail.layout = (page: React.ReactNode) => <SuperAdminLayout>{page}</SuperAdminLayout>;

export default function ClinicDetail({ tenant, users }: Props) {
    // Modal states
    const [showAddUser, setShowAddUser] = useState(false);
    const [showEditUser, setShowEditUser] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Selected user for actions
    const [selectedUser, setSelectedUser] = useState<ClinicUser | null>(null);

    // Form states
    const [form, setForm] = useState<Record<string, any>>({ role: 'admin' });
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Visibility of passwords in table
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const roleLabel: Record<string, string> = {
        admin:   'Administrador',
        owner:   'Propietario / Director',
        dentist: 'Odontólogo / Dentista',
        staff:   'Asistente / Staff',
    };

    const togglePasswordVisibility = (userId: string) => {
        setVisiblePasswords((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    const copyToClipboard = (userId: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(userId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // ── Create User ──────────────────────────────────────────────────────────
    const handleAddUser = () => {
        if (!form.email || !form.password || !form.first_name || !form.last_name) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        setIsSaving(true);
        setError(null);
        router.post(`/superadmin/clinics/${tenant.id}/users`, { ...form, role: form.role || 'admin' }, {
            onSuccess: () => { 
                setShowAddUser(false); 
                setForm({ role: 'admin' }); 
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                setError(msg || 'Error al crear el usuario');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    // ── Edit User (Role, Name, Status) ───────────────────────────────────────
    const openEditModal = (user: ClinicUser) => {
        setSelectedUser(user);
        setForm({
            first_name: user.first_name,
            last_name:  user.last_name,
            email:      user.email,
            role:       user.role,
            is_active:  user.is_active,
        });
        setError(null);
        setShowEditUser(true);
    };

    const handleUpdateUser = () => {
        if (!selectedUser) return;
        if (!form.first_name || !form.last_name || !form.email || !form.role) {
            setError('Todos los campos marcados con * son obligatorios.');
            return;
        }
        setIsSaving(true);
        setError(null);
        router.put(`/superadmin/clinics/${tenant.id}/users/${selectedUser.id}`, form, {
            onSuccess: () => {
                setShowEditUser(false);
                setSelectedUser(null);
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                setError(msg || 'Error al actualizar el usuario.');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    // ── Reset Password ───────────────────────────────────────────────────────
    const openPasswordModal = (user: ClinicUser) => {
        setSelectedUser(user);
        setNewPassword('');
        setError(null);
        setShowPasswordModal(true);
    };

    const handleResetPassword = () => {
        if (!selectedUser) return;
        if (!newPassword || newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setIsSaving(true);
        setError(null);
        router.post(`/superadmin/clinics/${tenant.id}/users/${selectedUser.id}/password`, { new_password: newPassword }, {
            onSuccess: () => {
                setShowPasswordModal(false);
                setSelectedUser(null);
                setNewPassword('');
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                setError(msg || 'Error al cambiar la contraseña.');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    // ── Delete User ──────────────────────────────────────────────────────────
    const openDeleteModal = (user: ClinicUser) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = () => {
        if (!selectedUser) return;
        setIsSaving(true);
        router.delete(`/superadmin/clinics/${tenant.id}/users/${selectedUser.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedUser(null);
            },
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-start gap-3 min-w-0">
                    <Link
                        href="/superadmin/clinics"
                        className="p-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors mt-0.5 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight truncate">
                            {tenant.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5 truncate">
                            {tenant.email} · {tenant.city ?? 'Sin ciudad'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                        tenant.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                        tenant.status === 'trial' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                        'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300'
                    }`}>
                        {{ active: 'Activa', trial: 'En prueba', suspended: 'Suspendida', cancelled: 'Cancelada' }[tenant.status] ?? tenant.status}
                    </span>
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <InfoCard label="Plan contratado" value={tenant.plan_name ?? '—'} />
                <InfoCard label="País" value={tenant.country ?? '—'} />
                <InfoCard label="IVA configurado" value={`${((tenant.default_tax_rate ?? 0) * 100).toFixed(0)}%`} />
            </div>

            {/* Users section */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
                    <div>
                        <h2 className="font-bold text-sm sm:text-base text-[#111827] dark:text-[#F8FAFC]">Usuarios de la clínica</h2>
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Gestiona los roles, accesos y credenciales del equipo</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => { setForm({ role: 'admin' }); setShowAddUser(true); setError(null); }}
                        className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl gap-1 text-xs self-start sm:self-auto shadow-sm cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Agregar usuario / admin
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                        <thead>
                            <tr className="border-b border-[#F3F4F6] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]">
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Usuario</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Rol</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Contraseña</th>
                                <th className="text-left px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Estado</th>
                                <th className="text-right px-5 sm:px-6 py-3.5 text-[#6B7280] dark:text-[#94A3B8] font-semibold text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-[#6B7280] dark:text-[#94A3B8]">
                                        Sin usuarios asignados. Agrega un usuario administrador para la clínica.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => {
                                    const isVisible = visiblePasswords[u.id];
                                    const isCopied = copiedId === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                                            {/* Name & Email */}
                                            <td className="px-5 sm:px-6 py-4">
                                                <p className="font-semibold text-sm text-[#111827] dark:text-[#F8FAFC]">{u.first_name} {u.last_name}</p>
                                                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{u.email}</p>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                    u.role === 'admin' || u.role === 'owner' 
                                                        ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-[#38BDF8] border border-sky-200/50 dark:border-sky-900/50' 
                                                        : u.role === 'dentist' 
                                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50' 
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                                }`}>
                                                    {roleLabel[u.role] ?? u.role}
                                                </span>
                                            </td>

                                            {/* Password view/copy */}
                                            <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                                                {u.plain_password ? (
                                                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1E293B] rounded-lg px-2.5 py-1 w-fit">
                                                        <Lock className="w-3 h-3 text-[#6B7280] dark:text-[#94A3B8]" />
                                                        <span className="font-mono text-xs text-[#111827] dark:text-[#F8FAFC]">
                                                            {isVisible ? u.plain_password : '••••••••'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePasswordVisibility(u.id)}
                                                            className="p-1 text-[#6B7280] hover:text-[#111827] dark:text-[#94A3B8] dark:hover:text-white transition-colors"
                                                            title={isVisible ? "Ocultar" : "Mostrar contraseña"}
                                                        >
                                                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(u.id, u.plain_password!)}
                                                            className="p-1 text-[#6B7280] hover:text-[#0284C7] dark:text-[#94A3B8] dark:hover:text-[#38BDF8] transition-colors"
                                                            title="Copiar contraseña"
                                                        >
                                                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPasswordModal(u)}
                                                        className="text-xs text-[#0284C7] hover:underline font-medium flex items-center gap-1"
                                                    >
                                                        <KeyRound className="w-3 h-3" /> Asignar clave
                                                    </button>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                        <UserCheck className="w-3.5 h-3.5" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-medium">
                                                        <UserX className="w-3.5 h-3.5" /> Inactivo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Edit / Change Role */}
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        title="Editar datos y rol"
                                                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    {/* Reset Password */}
                                                    <button
                                                        onClick={() => openPasswordModal(u)}
                                                        title="Cambiar contraseña"
                                                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#6B7280] dark:text-[#94A3B8] hover:text-amber-500 transition-colors"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete User */}
                                                    <button
                                                        onClick={() => openDeleteModal(u)}
                                                        title="Eliminar de la clínica"
                                                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-[#6B7280] dark:text-[#94A3B8] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal 1: Agregar Usuario ── */}
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Agregar usuario a {tenant.name}</DialogTitle>
                        <DialogDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Crea un nuevo usuario con credenciales y asígnale un rol.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Nombre *</Label>
                                <Input 
                                    placeholder="Carlos" 
                                    value={form.first_name || ''}
                                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Apellido *</Label>
                                <Input 
                                    placeholder="Martínez" 
                                    value={form.last_name || ''}
                                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Rol en la clínica *</Label>
                            <select
                                className="w-full h-10 border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                                value={form.role || 'admin'}
                                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                            >
                                <option value="admin">Administrador (Control total del consultorio)</option>
                                <option value="owner">Propietario / Director</option>
                                <option value="dentist">Odontólogo / Dentista</option>
                                <option value="staff">Personal / Asistente</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Email de acceso *</Label>
                            <Input 
                                type="email" 
                                placeholder="admin@clinica.com" 
                                value={form.email || ''}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Contraseña temporal *</Label>
                            <Input 
                                type="password" 
                                placeholder="Mínimo 6 caracteres" 
                                value={form.password || ''}
                                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowAddUser(false)} className="rounded-xl">Cancelar</Button>
                        <Button
                            disabled={isSaving}
                            className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl"
                            onClick={handleAddUser}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar usuario'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Modal 2: Editar Usuario y Cambiar Rol ── */}
            <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
                <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Editar usuario y cambiar rol</DialogTitle>
                        <DialogDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Modifica los datos personales y el nivel de acceso en la clínica.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Nombre *</Label>
                                <Input 
                                    value={form.first_name || ''}
                                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Apellido *</Label>
                                <Input 
                                    value={form.last_name || ''}
                                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                                    className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Rol en la clínica *</Label>
                            <select
                                className="w-full h-10 border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                                value={form.role || 'admin'}
                                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                            >
                                <option value="admin">Administrador (Control total del consultorio)</option>
                                <option value="owner">Propietario / Director</option>
                                <option value="dentist">Odontólogo / Dentista</option>
                                <option value="staff">Personal / Asistente</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Email *</Label>
                            <Input 
                                type="email" 
                                value={form.email || ''}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Estado de la cuenta</Label>
                            <select
                                className="w-full h-10 border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                                value={form.is_active ? '1' : '0'}
                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === '1' }))}
                            >
                                <option value="1">Activo (Puede iniciar sesión)</option>
                                <option value="0">Inactivo (Acceso deshabilitado)</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowEditUser(false)} className="rounded-xl">Cancelar</Button>
                        <Button
                            disabled={isSaving}
                            className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl"
                            onClick={handleUpdateUser}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Modal 3: Cambiar Contraseña ── */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                            Cambiar contraseña de {selectedUser?.first_name} {selectedUser?.last_name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            Ingresa una nueva contraseña para este usuario. Podrás verla y copiarla en cualquier momento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#374151] dark:text-[#E2E8F0]">Nueva contraseña *</Label>
                            <Input 
                                type="text"
                                placeholder="Ej. dental2026*" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B]" 
                            />
                            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8]">Mínimo 6 caracteres.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="rounded-xl">Cancelar</Button>
                        <Button
                            disabled={isSaving}
                            className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl"
                            onClick={handleResetPassword}
                        >
                            {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Modal 4: Confirmar Eliminación ── */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600 dark:text-red-400">
                            ¿Eliminar usuario de la clínica?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            Esta acción desvinculará a <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong> ({selectedUser?.email}) de la clínica <strong>{tenant.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="rounded-xl">Cancelar</Button>
                        <Button
                            disabled={isSaving}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            onClick={handleDeleteUser}
                        >
                            {isSaving ? 'Eliminando...' : 'Sí, eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] p-5 shadow-sm">
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-1 font-medium">{label}</p>
            <p className="font-bold text-base sm:text-lg text-[#111827] dark:text-[#F8FAFC] tracking-tight">{value}</p>
        </div>
    );
}
