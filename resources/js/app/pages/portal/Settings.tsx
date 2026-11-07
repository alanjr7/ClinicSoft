import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PatientPortalLayout from '../../components/PatientPortalLayout';
import {
    Settings as SettingsIcon, User, Lock, Bell, ShieldCheck, Save, Mail, Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';

interface Props {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    preferences: {
        email_notifications: boolean;
        whatsapp_notifications: boolean;
        privacy_policy_accepted: boolean;
    };
    errors?: Record<string, string>;
}

export default function Settings({ patient, user, preferences, errors }: Props) {
    const [form, setForm] = useState({
        first_name: user?.first_name || patient?.first_name || '',
        last_name: user?.last_name || patient?.last_name || '',
        email: user?.email || patient?.email || '',
        phone: user?.phone || patient?.phone || '',
        password: '',
        password_confirmation: '',
        email_notifications: Boolean(preferences?.email_notifications),
        whatsapp_notifications: Boolean(preferences?.whatsapp_notifications),
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.put('/portal/configuracion', form, {
            onFinish: () => {
                setSaving(false);
                setForm((prev) => ({ ...prev, password: '', password_confirmation: '' }));
            },
        });
    };

    return (
        <PatientPortalLayout>
            <Head title="Configuración — ClinicSoft" />

            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        Configuración de Mi Cuenta
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona tus datos personales de contacto, credenciales de acceso y preferencias de notificación.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sección 1: Datos Personales */}
                    <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="p-6 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-sky-500" />
                                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                    Datos Personales de Contacto
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-gray-500">
                                Estos datos se mantendrán sincronizados con tu ficha médica en la clínica.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nombres *
                                    </Label>
                                    <Input
                                        id="first_name"
                                        type="text"
                                        value={form.first_name}
                                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                        className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                        required
                                    />
                                    {errors?.first_name && (
                                        <p className="text-xs text-red-500">{errors.first_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Apellidos *
                                    </Label>
                                    <Input
                                        id="last_name"
                                        type="text"
                                        value={form.last_name}
                                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                        className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                        required
                                    />
                                    {errors?.last_name && (
                                        <p className="text-xs text-red-500">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Correo Electrónico (Usuario de acceso) *
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl pl-10"
                                            required
                                        />
                                        <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                    </div>
                                    {errors?.email && (
                                        <p className="text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Teléfono / Celular
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="phone"
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl pl-10"
                                            placeholder="+591 ..."
                                        />
                                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                                    </div>
                                    {errors?.phone && (
                                        <p className="text-xs text-red-500">{errors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección 2: Seguridad y Cambio de Contraseña */}
                    <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="p-6 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-amber-500" />
                                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                    Cambiar Contraseña
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-gray-500">
                                Deja estos campos en blanco si no deseas modificar tu contraseña actual.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nueva Contraseña
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                    />
                                    {errors?.password && (
                                        <p className="text-xs text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Confirmar Contraseña
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="Repite la contraseña"
                                        value={form.password_confirmation}
                                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                        className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sección 3: Preferencias de Notificaciones y Privacidad */}
                    <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="p-6 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-teal-500" />
                                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                    Notificaciones y Privacidad
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-gray-500">
                                Elige cómo y cuándo deseas recibir recordatorios de tus citas médicas.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Recordatorios por Correo Electrónico
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Recibe confirmaciones y avisos previos de tus citas por email.
                                    </p>
                                </div>
                                <Switch
                                    checked={form.email_notifications}
                                    onCheckedChange={(checked) => setForm({ ...form, email_notifications: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Recordatorios por WhatsApp
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Avisos automáticos de citas médicas a tu número de contacto.
                                    </p>
                                </div>
                                <Switch
                                    checked={form.whatsapp_notifications}
                                    onCheckedChange={(checked) => setForm({ ...form, whatsapp_notifications: checked })}
                                />
                            </div>

                            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex items-start gap-3 bg-gray-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                        Protección de Datos Médicos (Seguridad y Privacidad)
                                    </p>
                                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                                        Tu información médica y diagnósticos están protegidos y solo son accesibles por ti y el personal médico autorizado de la clínica.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botón de Guardado */}
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando Cambios...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </PatientPortalLayout>
    );
}

