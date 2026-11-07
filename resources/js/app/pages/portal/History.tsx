import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PatientPortalLayout from '../../components/PatientPortalLayout';
import {
    Calendar, Clock, FileText, Download, CheckCircle2,
    AlertCircle, XCircle, Stethoscope, FileCheck, CalendarPlus, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface Appointment {
    id: string;
    start_at: string | null;
    end_at: string | null;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    reason: string;
    notes?: string;
    doctor_name: string;
    is_past: boolean;
}

interface ClinicalRecord {
    id: string;
    date: string;
    doctor_name: string;
    chief_complaint?: string;
    diagnosis?: string;
    treatment_plan?: string;
    prescription?: string;
    has_prescription: boolean;
}

interface PatientFile {
    id: string;
    name: string;
    file_type?: string;
    size?: number;
    created_at: string;
    url?: string;
}

interface Props {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    appointments: Appointment[];
    clinicalRecords: ClinicalRecord[];
    files: PatientFile[];
}

export default function History({ patient, appointments, clinicalRecords, files }: Props) {
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const upcomingAppointments = appointments.filter((a) => !a.is_past && a.status !== 'cancelled');
    const pastAppointments = appointments.filter((a) => a.is_past || a.status === 'cancelled');

    const handleCancelAppointment = (id: string) => {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
        setCancellingId(id);
        router.post(`/portal/citas/${id}/cancelar`, {}, {
            preserveScroll: true,
            onFinish: () => setCancellingId(null),
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">Confirmada</Badge>;
            case 'scheduled':
                return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-medium">Programada</Badge>;
            case 'completed':
                return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium">Completada</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-medium">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <PatientPortalLayout>
            <Head title="Mi Historial — ClinicSoft" />

            <div className="space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sky-600 to-teal-600 p-6 rounded-2xl text-white shadow-md">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mi Historial Clínico y Citas</h1>
                        <p className="text-sky-100 text-sm mt-1">
                            Consulta tus atenciones médicas, recetas y seguimiento de citas programadas.
                        </p>
                    </div>
                    <Link href="/portal/reservar-cita">
                        <Button className="bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-xs">
                            <CalendarPlus className="w-4 h-4 mr-2" />
                            Nueva Cita
                        </Button>
                    </Link>
                </div>

                {/* Section 1: Próximas Citas */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Próximas Citas Médicas</h2>
                    </div>

                    {upcomingAppointments.length === 0 ? (
                        <Card className="border-dashed border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
                            <CardContent className="py-8 text-center">
                                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-60" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    No tienes citas médicas programadas próximamente.
                                </p>
                                <Link href="/portal/reservar-cita" className="inline-block mt-3">
                                    <Button size="sm" variant="outline" className="text-sky-600 border-sky-300 dark:border-sky-800">
                                        Reservar una cita ahora
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingAppointments.map((apt) => (
                                <Card key={apt.id} className="border border-gray-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha y Hora</p>
                                                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                                                    {apt.start_at}
                                                </p>
                                            </div>
                                            {getStatusBadge(apt.status)}
                                        </div>

                                        <div className="space-y-1.5 border-t border-gray-100 dark:border-slate-800 pt-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <Stethoscope className="w-4 h-4 text-sky-500" />
                                                <span>{apt.doctor_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{apt.reason}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={cancellingId === apt.id}
                                                onClick={() => handleCancelAppointment(apt.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
                                            >
                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                {cancellingId === apt.id ? 'Cancelando...' : 'Cancelar Cita'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 2: Historial de Consultas y Atenciones Médicas */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Atenciones y Consultas Médicas</h2>
                    </div>

                    {clinicalRecords.length === 0 ? (
                        <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <CardContent className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                Aún no se registran atenciones clínicas registradas para tu perfil.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {clinicalRecords.map((rec) => (
                                <Card key={rec.id} className="border border-gray-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                                    <CardHeader className="p-5 pb-3 border-b border-gray-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                                Consulta Médica — {rec.date}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                                                Atendido por: <span className="font-medium text-gray-700 dark:text-gray-300">{rec.doctor_name}</span>
                                            </CardDescription>
                                        </div>

                                        {rec.has_prescription && (
                                            <a
                                                href={`/clinical-records/${rec.id}/prescription-pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Button size="sm" variant="outline" className="text-sky-600 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30">
                                                    <Download className="w-3.5 h-3.5 mr-1.5" />
                                                    Descargar Receta
                                                </Button>
                                            </a>
                                        )}
                                    </CardHeader>

                                    <CardContent className="p-5 space-y-3 text-sm">
                                        {rec.chief_complaint && (
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 block text-xs uppercase tracking-wider mb-0.5">
                                                    Motivo de Consulta:
                                                </span>
                                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                    {rec.chief_complaint}
                                                </p>
                                            </div>
                                        )}

                                        {rec.diagnosis && (
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 block text-xs uppercase tracking-wider mb-0.5">
                                                    Diagnóstico:
                                                </span>
                                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                    {rec.diagnosis}
                                                </p>
                                            </div>
                                        )}

                                        {rec.treatment_plan && (
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 block text-xs uppercase tracking-wider mb-0.5">
                                                    Tratamiento Indicado:
                                                </span>
                                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                    {rec.treatment_plan}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 3: Historial Pasado de Citas */}
                {pastAppointments.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Citas Pasadas</h2>
                        </div>

                        <Card className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="px-5 py-3">Fecha</th>
                                            <th className="px-5 py-3">Doctor</th>
                                            <th className="px-5 py-3">Motivo</th>
                                            <th className="px-5 py-3 text-right">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {pastAppointments.map((apt) => (
                                            <tr key={apt.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                                                    {apt.start_at}
                                                </td>
                                                <td className="px-5 py-3.5">{apt.doctor_name}</td>
                                                <td className="px-5 py-3.5">{apt.reason}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {getStatusBadge(apt.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </PatientPortalLayout>
    );
}

