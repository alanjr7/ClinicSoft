import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PatientPortalLayout from '../../components/PatientPortalLayout';
import {
    CalendarPlus, User, Clock, FileText, CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface Doctor {
    id: string;
    first_name: string;
    last_name: string;
}

interface Treatment {
    id: string;
    name: string;
    price?: number;
    duration_minutes?: number;
}

interface Props {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
    };
    doctors: Doctor[];
    treatments: Treatment[];
    clinicName: string;
    errors?: Record<string, string>;
}

const DEFAULT_HOURS = [
    '08:30', '09:15', '10:00', '10:45', '11:30',
    '14:00', '14:45', '15:30', '16:15', '17:00', '17:45'
];

export default function BookAppointment({ patient, doctors, treatments, clinicName, errors }: Props) {
    // Tomorrow as minimum default or today
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        dentist_id: doctors[0]?.id || '',
        date: today,
        time: DEFAULT_HOURS[0] || '09:00',
        reason: '',
        notes: '',
    });

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post('/portal/reservar-cita', form, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <PatientPortalLayout>
            <Head title="Reservar Cita Médica — ClinicSoft" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarPlus className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        Reservar Cita Médica
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Selecciona el profesional médico y el horario de tu preferencia en <span className="font-medium text-gray-700 dark:text-gray-300">{clinicName}</span>.
                    </p>
                </div>

                <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="p-6 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Formulario de Reserva
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            La cita quedará agendada en tu historial de inmediato.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="dentist_id" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Médico o Especialista *
                                </Label>
                                <select
                                    id="dentist_id"
                                    value={form.dentist_id}
                                    onChange={(e) => setForm({ ...form, dentist_id: e.target.value })}
                                    className="w-full h-11 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white"
                                    required
                                >
                                    {doctors.length === 0 ? (
                                        <option value="">No hay médicos disponibles temporalmente</option>
                                    ) : (
                                        doctors.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                Dr(a). {doc.first_name} {doc.last_name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {errors?.dentist_id && (
                                    <p className="text-xs text-red-500">{errors.dentist_id}</p>
                                )}
                            </div>

                            {/* Date and Time Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Fecha de la Cita *
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        min={today}
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                        required
                                    />
                                    {errors?.date && (
                                        <p className="text-xs text-red-500">{errors.date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Horario Disponible *
                                    </Label>
                                    <select
                                        id="time"
                                        value={form.time}
                                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                                        className="w-full h-11 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white"
                                        required
                                    >
                                        {DEFAULT_HOURS.map((hr) => (
                                            <option key={hr} value={hr}>
                                                {hr} hrs
                                            </option>
                                        ))}
                                    </select>
                                    {errors?.time && (
                                        <p className="text-xs text-red-500">{errors.time}</p>
                                    )}
                                </div>
                            </div>

                            {/* Motivo de Consulta */}
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Motivo de la Consulta *
                                </Label>
                                <Input
                                    id="reason"
                                    type="text"
                                    placeholder="Ej: Revisión general, dolor o molestia, limpieza..."
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    className="h-11 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl"
                                    required
                                />
                                {errors?.reason && (
                                    <p className="text-xs text-red-500">{errors.reason}</p>
                                )}
                            </div>

                            {/* Tratamiento de referencia si existe */}
                            {treatments.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="treatment_id" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Servicio / Tratamiento (Opcional)
                                    </Label>
                                    <select
                                        id="treatment_id"
                                        value=""
                                        onChange={(e) => {
                                            const selected = treatments.find((t) => t.id === e.target.value);
                                            if (selected) {
                                                setForm({ ...form, reason: selected.name });
                                            }
                                        }}
                                        className="w-full h-11 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Selecciona un servicio sugerido...</option>
                                        {treatments.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} {t.price ? `(Bs. ${t.price})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Additional Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Notas Adicionales o Síntomas (Opcional)
                                </Label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    placeholder="Describe brevemente tus síntomas o detalles relevantes..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 dark:text-white resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md"
                                >
                                    {submitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Cita'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PatientPortalLayout>
    );
}

