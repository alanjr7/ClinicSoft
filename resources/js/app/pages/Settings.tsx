import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  User as UserIcon, Lock, KeyRound, Eye, EyeOff, ShieldCheck, Users, Plus,
  Settings2, Trash2, ToggleLeft, ToggleRight, Sun, Moon, Laptop, Palette,
  Check, Loader2, Building2, Phone, Mail, Edit, Shield, Copy, CheckCheck, MapPin, DollarSign, Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import Layout from '../components/Layout';

type AppModule = 'patients' | 'appointments' | 'surgeries' | 'clinical' | 'budgets' | 'payments' | 'inventory' | 'reports' | 'accounting';

type ModulePermission = {
  module: AppModule;
  is_enabled: boolean;
};

interface ClinicUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  plain_password?: string | null;
  permissions?: { module: AppModule; is_enabled: boolean }[];
}

interface TenantInfo {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  currency?: string | null;
  plan?: {
    id: string;
    name: string;
    tier: string;
    price_monthly: number;
  } | null;
}

interface Props {
  users: ClinicUser[];
  tenant?: TenantInfo | null;
}

const MODULE_LABELS: Record<AppModule, string> = {
  patients:     'Pacientes',
  appointments: 'Agenda y Citas',
  surgeries:    'Cirugías y Quirófano',
  clinical:     'Consultas y Evoluciones Médicas',
  budgets:      'Presupuestos',
  payments:     'Finanzas y Pagos',
  inventory:    'Farmacia e Insumos',
  accounting:   'Contabilidad',
  reports:      'Reportes',
};

const ALL_MODULES = Object.keys(MODULE_LABELS) as AppModule[];

const roleLabel: Record<string, string> = {
  doctor: 'Doctor',
  admin: 'Administrador',
  owner: 'Director Médico / Propietario',
  staff: 'Asistente',
};

Settings.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Settings({ users, tenant }: Props) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'appearance' | 'clinic'>('profile');

  // ── Password visibility state per user for Admin ──
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyToClipboard = (userId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ── Profile Form State ──
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name ?? '',
    email:      user?.email ?? '',
    phone:      user?.phone ?? '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name ?? '',
        last_name:  user.last_name ?? '',
        email:      user.email ?? '',
        phone:      user.phone ?? '',
      });
    }
  }, [user]);

  // ── Clinic Form State ──
  const [clinicForm, setClinicForm] = useState({
    name:     tenant?.name ?? user?.tenant_name ?? '',
    email:    tenant?.email ?? '',
    phone:    tenant?.phone ?? '',
    address:  tenant?.address ?? '',
    city:     tenant?.city ?? '',
    currency: tenant?.currency ?? 'Bs.',
  });
  const [savingClinic, setSavingClinic] = useState(false);
  const [clinicSuccess, setClinicSuccess] = useState<string | null>(null);
  const [clinicError, setClinicError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setClinicForm({
        name:     tenant.name ?? user?.tenant_name ?? '',
        email:    tenant.email ?? '',
        phone:    tenant.phone ?? '',
        address:  tenant.address ?? '',
        city:     tenant.city ?? '',
        currency: tenant.currency ?? 'Bs.',
      });
    }
  }, [tenant, user?.tenant_name]);

  // ── Password Change State ──
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Create User Modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'doctor',
    password: '',
  });
  const [showCreatePw, setShowCreatePw] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // ── Edit User Modal ──
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    is_active: true,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  // ── Admin Reset Password for Team Member Modal ──
  const [resetUser, setResetUser] = useState<ClinicUser | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPw, setShowAdminNewPw] = useState(true);
  const [showCurrentModalPw, setShowCurrentModalPw] = useState(false);
  const [isSavingResetPw, setIsSavingResetPw] = useState(false);
  const [resetPwError, setResetPwError] = useState<string | null>(null);

  // ── Permissions Modal ──
  const [permUser, setPermUser] = useState<ClinicUser | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const isClinicAdmin = user?.role === 'admin' || user?.role === 'owner';

  // ── Handlers: Profile & Password ──
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    router.post('/settings/profile', profileForm, {
      onSuccess: () => {
        setProfileSuccess('Tus datos de perfil han sido actualizados correctamente.');
        setTimeout(() => setProfileSuccess(null), 4000);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al actualizar el perfil.';
        setProfileError(msg);
      },
      onFinish: () => setSavingProfile(false),
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setSavingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    router.post('/settings/password', passwordForm, {
      onSuccess: () => {
        setPasswordSuccess('Tu contraseña se ha cambiado exitosamente.');
        setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        setTimeout(() => setPasswordSuccess(null), 4000);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al cambiar la contraseña.';
        setPasswordError(msg);
      },
      onFinish: () => setSavingPassword(false),
    });
  };

  // ── Handlers: Clinic Information ──
  const handleUpdateClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicForm.name.trim()) {
      setClinicError('El nombre de la clínica no puede estar vacío.');
      return;
    }
    setSavingClinic(true);
    setClinicSuccess(null);
    setClinicError(null);

    router.post('/settings/clinic', clinicForm, {
      onSuccess: () => {
        setClinicSuccess('Nombre e información de la clínica actualizados en cascada exitosamente.');
        setTimeout(() => setClinicSuccess(null), 4000);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al actualizar la clínica.';
        setClinicError(msg);
      },
      onFinish: () => setSavingClinic(false),
    });
  };

  // ── Handlers: Team Management ──
  const handleCreateUser = () => {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.first_name || !createUserForm.last_name) {
      setCreateUserError('Nombre, apellido, email y contraseña son obligatorios.');
      return;
    }
    setIsSavingUser(true);
    setCreateUserError(null);
    router.post('/settings/users', createUserForm, {
      onSuccess: () => {
        setShowCreate(false);
        setCreateUserForm({ first_name: '', last_name: '', email: '', phone: '', role: 'doctor', password: '' });
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al crear el usuario.';
        setCreateUserError(msg);
      },
      onFinish: () => setIsSavingUser(false),
    });
  };

  const openEditUser = (u: ClinicUser) => {
    setEditingUser(u);
    setEditUserForm({
      first_name: u.first_name,
      last_name:  u.last_name,
      phone:      u.phone ?? '',
      role:       u.role,
      is_active:  u.is_active,
    });
    setEditUserError(null);
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    setEditUserError(null);
    router.put(`/settings/users/${editingUser.id}`, editUserForm, {
      onSuccess: () => setEditingUser(null),
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al actualizar el usuario.';
        setEditUserError(msg);
      },
      onFinish: () => setIsSavingEdit(false),
    });
  };

  const openResetPasswordModal = (u: ClinicUser) => {
    setResetUser(u);
    setAdminNewPassword('');
    setShowAdminNewPw(true);
    setShowCurrentModalPw(false);
    setResetPwError(null);
  };

  const handleAdminResetPassword = () => {
    if (!resetUser || !adminNewPassword.trim()) {
      setResetPwError('Debes ingresar la nueva contraseña.');
      return;
    }
    if (adminNewPassword.length < 6) {
      setResetPwError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsSavingResetPw(true);
    setResetPwError(null);
    router.post(`/settings/users/${resetUser.id}/reset-password`, {
      new_password: adminNewPassword,
    }, {
      onSuccess: () => setResetUser(null),
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al cambiar la contraseña.';
        setResetPwError(msg);
      },
      onFinish: () => setIsSavingResetPw(false),
    });
  };

  const handleToggleActive = (u: ClinicUser) => {
    const action = u.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} a ${u.first_name} ${u.last_name}?`)) return;
    router.put(`/settings/users/${u.id}`, { is_active: !u.is_active });
  };

  const openPermissions = (u: ClinicUser) => {
    setPermUser(u);
    const userPerms = u.permissions ?? [];
    setPermissions(
      ALL_MODULES.map((m) => {
        const found = userPerms.find((p) => p.module === m);
        return {
          module: m,
          is_enabled: found ? Boolean(found.is_enabled) : false,
        };
      })
    );
  };

  const toggleModule = (module: AppModule) => {
    setPermissions((prev) =>
      prev.map((p) => p.module === module ? { ...p, is_enabled: !p.is_enabled } : p)
    );
  };

  const savePermissions = () => {
    if (!permUser) return;
    setIsSavingPerms(true);
    router.post(`/settings/users/${permUser.id}/permissions`, { permissions }, {
      onSuccess: () => setPermUser(null),
      onFinish: () => setIsSavingPerms(false),
    });
  };

  const themeOptions: { value: Theme; title: string; desc: string; icon: React.ElementType }[] = [
    { value: 'light',  title: 'Tema Claro',           desc: 'Ideal para ambientes con buena iluminación', icon: Sun },
    { value: 'dark',   title: 'Tema Oscuro',          desc: 'Reduce la fatiga visual en entornos oscuros', icon: Moon },
    { value: 'system', title: 'Sistema (Automático)', desc: 'Se adapta a la preferencia de tu dispositivo', icon: Laptop },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen text-[#111827] dark:text-[#F8FAFC]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">Configuración</h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-1">
          Administración de tu perfil, seguridad de acceso, equipo de trabajo, clínica y preferencias
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-[#E5E7EB] dark:border-[#1E293B]">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#0284C7] text-white shadow-sm shadow-[#0284C7]/30'
              : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1E293B]'
          }`}
        >
          <UserIcon className="w-4 h-4" /> Mi Perfil y Seguridad
        </button>

        {isClinicAdmin && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#0284C7] text-white shadow-sm shadow-[#0284C7]/30'
                : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1E293B]'
            }`}
          >
            <Users className="w-4 h-4" /> Equipo de Trabajo ({users.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('clinic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'clinic'
              ? 'bg-[#0284C7] text-white shadow-sm shadow-[#0284C7]/30'
              : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1E293B]'
          }`}
        >
          <Building2 className="w-4 h-4" /> Clínica
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-[#0284C7] text-white shadow-sm shadow-[#0284C7]/30'
              : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1E293B]'
          }`}
        >
          <Palette className="w-4 h-4" /> Apariencia y Tema
        </button>
      </div>

     {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Datos Personales */}
          <Card className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
            <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Datos Personales</CardTitle>
                  <CardDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Actualiza tu nombre, correo y número de contacto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileSuccess && (
                  <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/40">
                    <Check className="w-4 h-4 flex-shrink-0" /> {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 p-3.5 rounded-xl border border-red-200 dark:border-red-800/40">
                    {profileError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nombre *</Label>
                    <Input
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(f => ({ ...f, first_name: e.target.value }))}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Apellido *</Label>
                    <Input
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(f => ({ ...f, last_name: e.target.value }))}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Correo Electrónico *</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Teléfono / WhatsApp</Label>
                    <Input
                      placeholder="Ej. +591 70000000"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl h-11 px-6 shadow-md shadow-[#0284C7]/20 font-medium cursor-pointer"
                  >
                    {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</> : 'Guardar Cambios de Perfil'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Cambiar mi Contraseña */}
          <Card className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
            <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Cambiar Mi Contraseña</CardTitle>
                  <CardDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Actualiza tu clave de acceso personal con cifrado seguro</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/40">
                    <Check className="w-4 h-4 flex-shrink-0" /> {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 p-3.5 rounded-xl border border-red-200 dark:border-red-800/40">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Contraseña Actual *</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="Tu contraseña actual"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                      className="rounded-xl h-11 pr-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nueva Contraseña *</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={passwordForm.password}
                        onChange={(e) => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                        className="rounded-xl h-11 pr-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                      />
                      
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Confirmar Nueva Contraseña *</Label>
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="Repite la nueva contraseña"
                      value={passwordForm.password_confirmation}
                      onChange={(e) => setPasswordForm(f => ({ ...f, password_confirmation: e.target.value }))}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword || !passwordForm.current_password || !passwordForm.password}
                    className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl h-11 px-6 shadow-md shadow-[#0284C7]/20 font-medium cursor-pointer"
                  >
                    {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Actualizando...</> : 'Actualizar Contraseña'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: EQUIPO DE TRABAJO (Solo Admin/Owner)  dasdf                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'team' && isClinicAdmin && (
        <div className="space-y-6">
          {/* Security Note for Admins */}
          <Card className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Miembros del Equipo</CardTitle>
                  <CardDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Doctores, asistentes y personal de la clínica</CardDescription>
                </div>
              </div>
              {isClinicAdmin && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl shadow-md shadow-[#0284C7]/20 px-4 h-10 gap-2 cursor-pointer font-medium text-xs"
                >
                  <Plus className="w-4 h-4" /> Nuevo Miembro
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-[#F3F4F6] dark:divide-[#1E293B]">
                {users.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-[#D1D5DB] dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Aún no has agregado miembros a la clínica</p>
                  </div>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isVisible = visiblePasswords[u.id] ?? false;
                    const hasPassword = Boolean(u.plain_password);

                    return (
                      <div key={u.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:px-6 gap-4 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 dark:bg-[#0284C7]/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#0284C7] dark:text-[#38BDF8]">
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] text-sm">
                                {u.first_name} {u.last_name}
                              </p>
                              {isSelf && (
                                <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 text-[10px] px-1.5 py-0">Tú</Badge>
                              )}
                              <Badge className={u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-0 text-[11px]' : 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300 border-0 text-[11px]'}>
                                {u.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                              {u.email} {u.phone ? `· 📞 ${u.phone}` : ''} · <span className="font-semibold text-gray-700 dark:text-gray-300">{roleLabel[u.role] ?? u.role}</span>
                            </p>
                          </div>
                        </div>

                        {/* Password Pill & Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Admin Password Visualizer (Exclusive for Clinic Admin) */}
                          {isClinicAdmin && hasPassword && (
                            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs">
                              <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              <span className="font-mono text-gray-800 dark:text-gray-200 select-all font-medium">
                                {isVisible ? u.plain_password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors ml-1 cursor-pointer"
                                title={isVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.id, u.plain_password!)}
                                className="p-1 text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                title="Copiar contraseña"
                              >
                                {copiedId === u.id ? <CheckCheck className="w-3.5 h-3.5 text-sky-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}

                          {isClinicAdmin && (
                            <>
                              {/* Admin Reset Password button */}
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                                title="Cambiar / Resetear contraseña"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Edit User details button */}
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                title="Editar datos del usuario"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Module permissions button (for doctor and staff) */}
                              {isClinicAdmin && (u.role === 'doctor' || u.role === 'staff') && (
                                <button
                                  onClick={() => openPermissions(u)}
                                  className="p-2 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] hover:bg-sky-100 dark:hover:bg-[#0284C7]/30 transition-colors cursor-pointer"
                                  title="Gestionar permisos de módulos"
                                >
                                  <Settings2 className="w-4 h-4" />
                                </button>
                              )}

                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                    u.is_active
                                      ? 'bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100'
                                      : 'bg-green-50 dark:bg-green-950/40 text-green-600 hover:bg-green-100'
                                  }`}
                                  title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INFORMACIÓN DE LA CLÍNICA                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'clinic' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
            <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Detalles de la Clínica (SaaS)</CardTitle>
                  <CardDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    Información corporativa, nombre comercial y datos de contacto de tu organización
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isClinicAdmin ? (
                <form onSubmit={handleUpdateClinic} className="space-y-5">
                  {clinicSuccess && (
                    <div className="flex items-center gap-2 text-sm text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/40">
                      <Check className="w-4 h-4 flex-shrink-0" /> {clinicSuccess}
                    </div>
                  )}
                  {clinicError && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 p-3.5 rounded-xl border border-red-200 dark:border-red-800/40">
                      {clinicError}
                    </div>
                  )}

                  {/* Informative Cascade Banner */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/40 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
                    <p className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
                      El <strong>Nombre de la Clínica</strong> se actualiza en cascada en tiempo real en la barra lateral, recibos, presupuestos PDF, historias clínicas y en el portal web de reservas públicas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                        Nombre de la Clínica *
                      </Label>
                      <Input
                        value={clinicForm.name}
                        onChange={(e) => setClinicForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ej. Clínica Dental Sonrisas"
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-base font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                        Correo de Contacto / Notificaciones
                      </Label>
                      <Input
                        type="email"
                        value={clinicForm.email}
                        onChange={(e) => setClinicForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="contacto@clinicadental.com"
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                        Teléfono / WhatsApp Clínica
                      </Label>
                      <Input
                        value={clinicForm.phone}
                        onChange={(e) => setClinicForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Ej. +591 70000000"
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                        Dirección Física
                      </Label>
                      <Input
                        value={clinicForm.address}
                        onChange={(e) => setClinicForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Ej. Av. Principal #123, Edificio Dental 2do Piso"
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                          Ciudad
                        </Label>
                        <Input
                          value={clinicForm.city}
                          onChange={(e) => setClinicForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="Ej. Santa Cruz"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                          Moneda Principal
                        </Label>
                        <Input
                          value={clinicForm.currency}
                          onChange={(e) => setClinicForm(f => ({ ...f, currency: e.target.value }))}
                          placeholder="Bs."
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button
                      type="submit"
                      disabled={savingClinic}
                      className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl h-11 px-6 shadow-md shadow-[#0284C7]/20 font-medium cursor-pointer"
                    >
                      {savingClinic ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</> : 'Guardar Información de la Clínica'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Read only for Non-Admins */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]">
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Nombre de la Clínica</p>
                      <p className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5">{tenant?.name ?? user?.tenant_name ?? '—'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]">
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Tu Rol Asignado</p>
                      <p className="text-base font-bold text-[#111827] dark:text-[#F8FAFC] mt-0.5">{roleLabel[user?.role ?? ''] ?? user?.role ?? '—'}</p>
                    </div>
                    {tenant?.email && (
                      <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]">
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Correo</p>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] mt-0.5">{tenant.email}</p>
                      </div>
                    )}
                    {tenant?.phone && (
                      <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B]">
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Teléfono</p>
                        <p className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] mt-0.5">{tenant.phone}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] italic">
                    * Solo el Administrador de la clínica puede editar los datos corporativos de la clínica.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: APARIENCIA Y TEMA                                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <Card className="rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
          <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">Apariencia y Tema Visual</CardTitle>
                <CardDescription className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Personaliza el modo de color de la plataforma</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map(({ value, title, desc, icon: Icon }) => {
              const isSelected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#0284C7] bg-[#F0F9FF]/50 dark:bg-[#0284C7]/10 ring-2 ring-[#0284C7]/20'
                      : 'border-[#E5E7EB] dark:border-[#1E293B] hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#111827]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#0284C7] text-white' : 'bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] mb-1">{title}</p>
                  <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{desc}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADMIN RESET PASSWORD PARA UN MIEMBRO DEL EQUIPO                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="w-5 h-5 text-[#F59E0B]" />
              Establecer Contraseña para {resetUser?.first_name} {resetUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              Como administrador, puedes asignar una nueva clave de acceso directamente para que el usuario pueda iniciar sesión en <strong>{resetUser?.email}</strong>.
            </p>

            {/* Current Password Preview in Modal */}
            {resetUser?.plain_password && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Contraseña actual:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {showCurrentModalPw ? resetUser.plain_password : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentModalPw(!showCurrentModalPw)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title={showCurrentModalPw ? 'Ocultar' : 'Ver'}
                  >
                    {showCurrentModalPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {resetPwError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl p-3 border border-red-200 dark:border-red-800/40">
                {resetPwError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nueva Contraseña *</Label>
              <div className="relative">
                <Input
                  type={showAdminNewPw ? 'text' : 'password'}
                  placeholder="Escribe la nueva contraseña..."
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="rounded-xl h-11 pr-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminNewPw(!showAdminNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {showAdminNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)} className="rounded-xl">Cancelar</Button>
            <Button
              disabled={isSavingResetPw || !adminNewPassword.trim()}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl cursor-pointer"
              onClick={handleAdminResetPassword}
            >
              {isSavingResetPw ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</> : 'Guardar Nueva Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: EDITAR USUARIO (Datos y Rol)                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Editar Miembro del Equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editUserError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl p-3 border border-red-200 dark:border-red-800/40">
                {editUserError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={editUserForm.first_name}
                  onChange={(e) => setEditUserForm(f => ({ ...f, first_name: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  value={editUserForm.last_name}
                  onChange={(e) => setEditUserForm(f => ({ ...f, last_name: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono / WhatsApp</Label>
              <Input
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol en la Clínica *</Label>
              <select
                value={editUserForm.role}
                onChange={(e) => setEditUserForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-11 rounded-xl border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-3 text-sm text-[#111827] dark:text-[#F8FAFC]"
              >
                <option value="doctor">Doctor</option>
                <option value="staff">Asistente</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl">Cancelar</Button>
            <Button
              disabled={isSavingEdit}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl cursor-pointer"
              onClick={handleSaveEditUser}
            >
              {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREAR USUARIO                                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nuevo Miembro del Equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createUserError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl p-3 border border-red-200 dark:border-red-800/40">
                {createUserError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej. Laura"
                  value={createUserForm.first_name}
                  onChange={(e) => setCreateUserForm(f => ({ ...f, first_name: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Ej. López"
                  value={createUserForm.last_name}
                  onChange={(e) => setCreateUserForm(f => ({ ...f, last_name: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email (Acceso) *</Label>
                <Input
                  type="email"
                  placeholder="laura@clinica.com"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(f => ({ ...f, email: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rol en Clínica *</Label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] px-3 text-sm text-[#111827] dark:text-[#F8FAFC]"
                >
                  <option value="doctor">Doctor</option>
                  <option value="staff">Asistente</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono / WhatsApp</Label>
              <Input
                placeholder="Ej. +591 70000000"
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña Inicial *</Label>
              <div className="relative">
                <Input
                  type={showCreatePw ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(f => ({ ...f, password: e.target.value }))}
                  className="rounded-xl h-11 pr-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827]"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePw(!showCreatePw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {showCreatePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancelar</Button>
            <Button
              disabled={isSavingUser}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl cursor-pointer"
              onClick={handleCreateUser}
            >
              {isSavingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Crear Miembro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PERMISOS POR MÓDULO                                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!permUser} onOpenChange={(open) => !open && setPermUser(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Módulos Habilitados para {permUser?.first_name} {permUser?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-3">
              Activa o desactiva las secciones a las que este miembro tendrá acceso al iniciar sesión:
            </p>
            {ALL_MODULES.map((module) => {
              const perm = permissions.find((p) => p.module === module);
              const isEnabled = perm?.is_enabled ?? false;
              return (
                <div
                  key={module}
                  onClick={() => toggleModule(module)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] cursor-pointer transition-colors select-none"
                >
                  <span className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC]">{MODULE_LABELS[module]}</span>
                  {isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-[#0284C7]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-[#D1D5DB] dark:text-gray-600" />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermUser(null)} className="rounded-xl">Cancelar</Button>
            <Button
              disabled={isSavingPerms}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl cursor-pointer"
              onClick={savePermissions}
            >
              {isSavingPerms ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Guardar Permisos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <br></br>
    </div>
  );
}
