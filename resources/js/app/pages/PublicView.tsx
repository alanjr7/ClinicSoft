import Layout from '../components/Layout';
import { Head, usePage, router } from '@inertiajs/react';
import { Globe, Upload, Link as LinkIcon, Copy, Check, Calendar, Settings as SettingsIcon, Tag, CheckCircle, XCircle, CreditCard, Image as ImageIcon, Plus, Trash2, Loader2, Paintbrush, Clock, ExternalLink, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';

interface DaySchedule {
    enabled: boolean;
    start: string;
    end: string;
    lunch_enabled?: boolean;
    lunch_start: string | null;
    lunch_end: string | null;
}

type WeekSchedule = Record<string, DaySchedule>;

const DAYS_CONFIG = [
    { key: 'monday',    label: 'Lunes',     short: 'Lun' },
    { key: 'tuesday',   label: 'Martes',    short: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
    { key: 'thursday',  label: 'Jueves',    short: 'Jue' },
    { key: 'friday',    label: 'Viernes',   short: 'Vie' },
    { key: 'saturday',  label: 'Sábado',    short: 'Sáb' },
    { key: 'sunday',    label: 'Domingo',   short: 'Dom' },
];

export default function PublicView({ tenant, appointments = [], treatments: initialTreatments = [], bookingSchedule: initialBookingSchedule, bookingHours: legacyBookingHours }: any) {
    const { props } = usePage();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(tenant.payment_qr_path ? `/storage/${tenant.payment_qr_path}` : null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Appearance state
    const [appearanceName, setAppearanceName] = useState(tenant.name || '');
    const [appearanceColor, setAppearanceColor] = useState(tenant.primary_color || '#0D9488');
    const [appearanceTextColor, setAppearanceTextColor] = useState(tenant.header_text_color || '#ffffff');
    const [appearanceLogo, setAppearanceLogo] = useState<File|null>(null);
    const [appearanceLogoPreview, setAppearanceLogoPreview] = useState(tenant.logo_url ? `/storage/${tenant.logo_url}` : null);
    const [processingAppearance, setProcessingAppearance] = useState(false);

    // Day-by-Day Schedule state
    const defaultSchedule: WeekSchedule = initialBookingSchedule || {
        monday:    { enabled: true,  start: '08:00', end: '19:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        tuesday:   { enabled: true,  start: '08:00', end: '19:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        wednesday: { enabled: true,  start: '08:00', end: '19:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        thursday:  { enabled: true,  start: '08:00', end: '19:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        friday:    { enabled: true,  start: '08:00', end: '19:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        saturday:  { enabled: true,  start: '08:00', end: '16:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
        sunday:    { enabled: true,  start: '08:00', end: '16:00', lunch_enabled: false, lunch_start: '', lunch_end: '' },
    };

    const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);
    const [processingBH, setProcessingBH] = useState(false);

    const updateDayField = (dayKey: string, field: keyof DaySchedule, value: any) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                [field]: value
            }
        }));
    };

    const copyMondayToWeekdays = () => {
        const mon = schedule.monday;
        setSchedule(prev => ({
            ...prev,
            tuesday:   { ...mon },
            wednesday: { ...mon },
            thursday:  { ...mon },
            friday:    { ...mon },
        }));
        toast.info('Horario de Lunes copiado a Martes-Viernes');
    };

    const handleSaveBookingHours = () => {
        // Validate open days
        for (const { key, label } of DAYS_CONFIG) {
            const d = schedule[key];
            if (d && d.enabled) {
                if (!d.start || !d.end) {
                    toast.error(`Define hora de inicio y cierre para el día ${label}`);
                    return;
                }
                if (d.lunch_enabled && (!d.lunch_start || !d.lunch_end)) {
                    toast.error(`Define hora de inicio y fin de almuerzo para el día ${label}`);
                    return;
                }
            }
        }

        setProcessingBH(true);
        router.post('/public-view/booking-hours', {
            days: schedule as any,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Horarios semanales guardados exitosamente'),
            onError: () => toast.error('Error al guardar los horarios'),
            onFinish: () => setProcessingBH(false),
        });
    };
    
    // Receipt Modal state
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

    // Treatments state
    const [treatments, setTreatments] = useState(initialTreatments);
    const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
    const [editPriceValue, setEditPriceValue] = useState<string>('');
    const [editDurationValue, setEditDurationValue] = useState<string>('');
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    // New Treatment Modal state
    const [newTreatmentModalOpen, setNewTreatmentModalOpen] = useState(false);
    const [newTreatmentName, setNewTreatmentName] = useState('');
    const [newTreatmentPrice, setNewTreatmentPrice] = useState('');
    const [newTreatmentDuration, setNewTreatmentDuration] = useState('30');
    const [newTreatmentActive, setNewTreatmentActive] = useState(true);

    // Effect to sync treatments from props
    useEffect(() => {
        setTreatments(initialTreatments);
    }, [initialTreatments]);

    const publicUrl = `${window.location.origin}/book/${tenant.slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(f);
        }
    };

    const handleSaveQr = () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('qr_image', file);

        router.post('/public-view/qr', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setFile(null);
                toast.success('Código QR guardado');
            }
        });
    };

    const viewReceipt = (appt: any) => {
        setSelectedApptId(appt.id);
        setSelectedReceipt(appt.payment_receipt_path ? `/storage/${appt.payment_receipt_path}` : null);
        setReceiptModalOpen(true);
    };

    const handleAcceptPayment = (id: string) => {
        if(!confirm('¿Estás seguro de aceptar este pago y confirmar la cita?')) return;
        router.post(`/public-view/appointments/${id}/accept`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pago aceptado y cita confirmada');
                setReceiptModalOpen(false);
            }
        });
    };

    const handleRejectPayment = (id: string) => {
        if(!confirm('¿Estás seguro de rechazar este pago?')) return;
        router.post(`/public-view/appointments/${id}/reject`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.error('Pago rechazado');
                setReceiptModalOpen(false);
            }
        });
    };

    const toggleTreatmentActive = (id: string, current: boolean) => {
        if (processingIds.includes(id)) return;
        setProcessingIds(prev => [...prev, id]);
        router.put(`/public-view/treatments/${id}`, { is_active: !current }, {
            preserveScroll: true,
            onSuccess: () => toast.success(current ? 'Tratamiento ocultado de la vista pública' : 'Tratamiento visible en la vista pública'),
            onError: () => toast.error('Error al actualizar'),
            onFinish: () => setProcessingIds(prev => prev.filter(pId => pId !== id))
        });
    };

    const saveTreatment = (id: string) => {
        const price = parseFloat(editPriceValue);
        const duration = parseInt(editDurationValue);
        if (isNaN(price) || price < 0 || isNaN(duration) || duration < 0) {
            toast.error('Datos inválidos');
            return;
        }
        router.put(`/public-view/treatments/${id}`, { 
            base_price: price,
            duration_minutes: duration
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingTreatmentId(null);
                toast.success('Tratamiento actualizado');
            },
            onError: () => toast.error('Error al actualizar')
        });
    };

    const handleDeleteTreatment = (id: string) => {
        if(!confirm('¿Estás seguro de eliminar este tratamiento?')) return;
        setProcessingIds(prev => [...prev, id]);
        router.delete(`/public-view/treatments/${id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Tratamiento eliminado'),
            onError: () => toast.error('Error al eliminar'),
            onFinish: () => setProcessingIds(prev => prev.filter(pId => pId !== id))
        });
    };

    const handleCreateTreatment = () => {
        const price = parseFloat(newTreatmentPrice);
        const duration = parseInt(newTreatmentDuration);
        if (!newTreatmentName.trim() || isNaN(price) || price < 0 || isNaN(duration) || duration < 0) {
            toast.error('Datos inválidos');
            return;
        }
        router.post('/public-view/treatments', {
            name: newTreatmentName,
            base_price: price,
            duration_minutes: duration,
            is_active: newTreatmentActive
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tratamiento creado');
                setNewTreatmentModalOpen(false);
                setNewTreatmentName('');
                setNewTreatmentPrice('');
                setNewTreatmentDuration('30');
                setNewTreatmentActive(true);
            },
            onError: () => toast.error('Error al crear tratamiento')
        });
    };

    const handleSaveAppearance = () => {
        setProcessingAppearance(true);
        router.post('/public-view/appearance', {
            name: appearanceName,
            primary_color: appearanceColor,
            header_text_color: appearanceTextColor,
            logo: appearanceLogo
        }, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => toast.success('Apariencia de la clínica guardada exitosamente'),
            onError: () => toast.error('Error al guardar apariencia'),
            onFinish: () => setProcessingAppearance(false)
        });
    };

    const selectedAppt = appointments.find((a: any) => a.id === selectedApptId);

    return (
        <Layout>
            <Head title="Gestión de Vista Pública" />
            
            <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-[#2DD4BF] border border-teal-200/60 dark:border-teal-800/60 rounded-full text-xs font-semibold mb-2">
                            <Building2 className="w-3.5 h-3.5" />
                            Clínica: {tenant?.name || 'Mi Clínica'}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Gestión de Vista Pública</h1>
                        <p className="text-sm sm:text-base text-[#6B7280] dark:text-[#94A3B8]">Configura los precios, horarios de atención y QR exclusivos para la página de reservas de tu clínica.</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-[#2DD4BF] rounded-xl flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                </div>

                {/* Banner de Enlace Público Exclusivo */}
                <div className="mb-6 p-4 sm:p-5 bg-white dark:bg-[#0F172A] border border-teal-100 dark:border-teal-900/40 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-[#F8FAFC]">
                            <LinkIcon className="w-4 h-4 text-teal-600 dark:text-[#2DD4BF]" />
                            Enlace público exclusivo para tus pacientes:
                        </div>
                        <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                            Este es el enlace único de tu clínica. Comparte este link en tus redes o WhatsApp para que tus pacientes agenden.
                        </p>
                        <span className="font-mono text-xs text-teal-700 dark:text-teal-300 font-medium break-all select-all">
                            {publicUrl}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                            className="border-teal-200 dark:border-teal-800 text-teal-700 dark:text-[#2DD4BF] hover:bg-teal-50 dark:hover:bg-teal-950/40"
                        >
                            {copied ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                            {copied ? '¡Copiado!' : 'Copiar Enlace'}
                        </Button>
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4 mr-1.5" />
                            Abrir Portal
                        </a>
                    </div>
                </div>

                <Tabs defaultValue="reservas">
                    <TabsList className="mb-6 bg-[#F3F4F6] dark:bg-[#111827] border dark:border-[#1E293B] rounded-xl p-1.5 grid grid-cols-2 sm:grid-cols-4 w-full max-w-full h-auto gap-1.5">
                        <TabsTrigger value="reservas" className="w-full justify-center rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:text-teal-600 dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm py-2.5 sm:py-2 px-2 text-center cursor-pointer transition-all">
                            <Calendar className="w-4 h-4 mr-1.5 shrink-0" />
                            <span className="truncate">Reservas y Pagos</span>
                        </TabsTrigger>
                        <TabsTrigger value="precios" className="w-full justify-center rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:text-teal-600 dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm py-2.5 sm:py-2 px-2 text-center cursor-pointer transition-all">
                            <Tag className="w-4 h-4 mr-1.5 shrink-0" />
                            <span className="truncate">Precios Públicos</span>
                        </TabsTrigger>
                        <TabsTrigger value="config" className="w-full justify-center rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:text-teal-600 dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm py-2.5 sm:py-2 px-2 text-center cursor-pointer transition-all">
                            <SettingsIcon className="w-4 h-4 mr-1.5 shrink-0" />
                            <span className="truncate">Configuración QR</span>
                        </TabsTrigger>
                        <TabsTrigger value="apariencia" className="w-full justify-center rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:text-teal-600 dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm py-2.5 sm:py-2 px-2 text-center cursor-pointer transition-all">
                            <Paintbrush className="w-4 h-4 mr-1.5 shrink-0" />
                            <span className="truncate">Apariencia</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* RESERVAS Y PAGOS */}
                    <TabsContent value="reservas" className="space-y-8">
                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1E293B] bg-gray-50 dark:bg-[#111827] flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-[#F8FAFC] flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-teal-600 dark:text-[#2DD4BF]" />
                                    Todas las Reservas y Pagos
                                </h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100 dark:border-[#1E293B] hover:bg-transparent">
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Fecha Cita</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Paciente</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Servicio / Consulta</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Monto Esperado</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Estado Pago</TableHead>
                                        <TableHead className="text-right text-[#111827] dark:text-[#F8FAFC] font-semibold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-[#94A3B8]">
                                                No hay reservas registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        appointments.map((appt: any) => (
                                            <TableRow key={appt.id} className="border-b border-gray-100 dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-colors">
                                                <TableCell className="font-medium text-[#111827] dark:text-[#F8FAFC]">
                                                    {new Date(appt.start_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                                </TableCell>
                                                <TableCell className="text-[#111827] dark:text-[#F8FAFC]">{appt.patient?.first_name} {appt.patient?.last_name}</TableCell>
                                                <TableCell className="text-[#6B7280] dark:text-[#94A3B8]">
                                                    {appt.treatments?.map((t: any) => t.name).join(', ') || 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-semibold text-teal-700 dark:text-[#2DD4BF]">
                                                    Bs. {appt.treatments?.reduce((acc: number, t: any) => acc + parseFloat(t.base_price), 0).toLocaleString('es-BO', {minimumFractionDigits:2})}
                                                </TableCell>
                                                <TableCell>
                                                    {appt.payment_status === 'pending' ? (
                                                        <span className="text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg text-xs font-medium">Pendiente</span>
                                                    ) : appt.payment_status === 'paid' ? (
                                                        <span className="text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/50 px-2.5 py-1 rounded-lg text-xs font-medium">Aceptado</span>
                                                    ) : (
                                                        <span className="text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 px-2.5 py-1 rounded-lg text-xs font-medium">Rechazado</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => viewReceipt(appt)} className="border-teal-200 dark:border-teal-800 text-teal-700 dark:text-[#2DD4BF] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer">
                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                        Ver Comprobante
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* PRECIOS Y SERVICIOS */}
                    <TabsContent value="precios">
                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B] overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F8FAFC]">Control Rápido de Precios</h2>
                                    <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Activa o desactiva los servicios y consultas que se muestran en el portal público y ajusta su precio base.</p>
                                </div>
                                <Button onClick={() => setNewTreatmentModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20">
                                    <Plus className="w-4 h-4" />
                                    Nuevo Servicio
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100 dark:border-[#1E293B] hover:bg-transparent">
                                        <TableHead className="w-16 text-[#111827] dark:text-[#F8FAFC] font-semibold">Foto</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Servicio / Especialidad</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Precio Público</TableHead>
                                        <TableHead className="text-[#111827] dark:text-[#F8FAFC] font-semibold">Duración (min)</TableHead>
                                        <TableHead className="text-center text-[#111827] dark:text-[#F8FAFC] font-semibold">Visible</TableHead>
                                        <TableHead className="text-right text-[#111827] dark:text-[#F8FAFC] font-semibold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {treatments.map((t: any) => (
                                        <TableRow key={t.id} className="border-b border-gray-100 dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-colors">
                                            <TableCell>
                                                <div className="relative group w-12 h-12 rounded-lg bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-[#1E293B] overflow-hidden cursor-pointer" onClick={() => document.getElementById(`upload-img-${t.id}`)?.click()}>
                                                    {t.image_path ? (
                                                        <img src={`/storage/${t.image_path}`} alt={t.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500">
                                                            <ImageIcon className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                                                        <Upload className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <input 
                                                    id={`upload-img-${t.id}`}
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const formData = new FormData();
                                                            formData.append('image', e.target.files[0]);
                                                            toast.loading('Subiendo imagen...', { id: `upload-${t.id}` });
                                                            router.post(`/public-view/treatments/${t.id}/image`, formData, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    toast.success('Imagen actualizada', { id: `upload-${t.id}` });
                                                                },
                                                                onError: () => {
                                                                    toast.error('Error al subir', { id: `upload-${t.id}` });
                                                                }
                                                            });
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900 dark:text-[#F8FAFC]">{t.name}</TableCell>
                                            <TableCell>
                                                {editingTreatmentId === t.id ? (
                                                    <Input 
                                                        type="number" 
                                                        value={editPriceValue} 
                                                        onChange={(e) => setEditPriceValue(e.target.value)} 
                                                        className="w-24 h-8 bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" 
                                                    />
                                                ) : (
                                                    <div 
                                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] px-2 py-1 rounded-md inline-block transition-colors"
                                                        onClick={() => { 
                                                            setEditingTreatmentId(t.id); 
                                                            setEditPriceValue(t.base_price.toString()); 
                                                            setEditDurationValue(t.duration_minutes?.toString() || '30'); 
                                                        }}
                                                        title="Click para editar"
                                                    >
                                                        Bs. {t.base_price.toLocaleString('es-BO', {minimumFractionDigits:2})}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingTreatmentId === t.id ? (
                                                    <Input 
                                                        type="number" 
                                                        value={editDurationValue} 
                                                        onChange={(e) => setEditDurationValue(e.target.value)} 
                                                        className="w-20 h-8 bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" 
                                                    />
                                                ) : (
                                                    <div 
                                                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] px-2 py-1 rounded-md inline-block transition-colors"
                                                        onClick={() => { 
                                                            setEditingTreatmentId(t.id); 
                                                            setEditPriceValue(t.base_price.toString()); 
                                                            setEditDurationValue(t.duration_minutes?.toString() || '30'); 
                                                        }}
                                                        title="Click para editar"
                                                    >
                                                        {t.duration_minutes ? `${t.duration_minutes} min` : 'N/A'}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <button onClick={() => toggleTreatmentActive(t.id, t.is_active)} disabled={processingIds.includes(t.id)} className="cursor-pointer">
                                                    {processingIds.includes(t.id) ? (
                                                        <Loader2 className="w-5 h-5 text-gray-400 mx-auto animate-spin" />
                                                    ) : t.is_active ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingTreatmentId === t.id ? (
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button size="sm" onClick={() => saveTreatment(t.id)} className="h-8 bg-teal-600 hover:bg-teal-700 text-white cursor-pointer">Guardar</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingTreatmentId(null)} className="h-8 cursor-pointer">X</Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTreatment(t.id)} disabled={processingIds.includes(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">
                                                        {processingIds.includes(t.id) ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* CONFIGURACIÓN QR */}
                    <TabsContent value="config" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B]">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
                                    Enlace de Reservas
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-4">
                                    Comparte este enlace en tus redes sociales para que los pacientes reserven directamente.
                                </p>
                                <div className="flex items-center gap-2 mt-4">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={publicUrl}
                                        className="flex-1 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1E293B] text-gray-800 dark:text-[#F8FAFC] text-sm rounded-xl px-4 py-3 focus:outline-none"
                                    />
                                    <button 
                                        onClick={handleCopy}
                                        className="bg-teal-600 text-white p-3 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center min-w-[3rem] cursor-pointer shadow-md shadow-teal-600/20"
                                        title="Copiar enlace"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#1E293B]">
                                    <a 
                                        href={publicUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-teal-600 dark:text-[#2DD4BF] font-medium hover:underline text-sm"
                                    >
                                        Abrir vista pública en nueva pestaña &rarr;
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B]">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
                                    Código QR de Pago
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-6">
                                    Sube la imagen del código QR que los pacientes escanearán para confirmar la reserva.
                                </p>
                                <div className="flex flex-col items-center gap-4">
                                    <div 
                                        className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-[#111827] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1E293B] transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {preview ? (
                                            <img src={preview} alt="QR Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center text-gray-500 dark:text-[#94A3B8]">
                                                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <span className="text-sm">Click para subir QR</span>
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    {file && (
                                        <button 
                                            onClick={handleSaveQr}
                                            className="bg-teal-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer shadow-md shadow-teal-600/20"
                                        >
                                            Guardar Nuevo QR
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ===== HORARIOS DE ATENCIÓN POR DÍA ===== */}
                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-[#1E293B]">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F8FAFC] flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-teal-600 dark:text-[#2DD4BF]" />
                                        Configuración de Horarios por Día
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">
                                        Personaliza los días de atención, horarios de inicio/cierre y pausas de almuerzo para cada día de la semana.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={copyMondayToWeekdays}
                                        className="text-xs text-teal-700 dark:text-[#2DD4BF] border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                                    >
                                        Copiar Lunes a Lun-Vie
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSchedule(prev => ({
                                                ...prev,
                                                saturday: { ...prev.saturday, enabled: true, start: '08:00', end: '16:00' },
                                                sunday:   { ...prev.sunday,   enabled: true, start: '08:00', end: '16:00' }
                                            }));
                                            toast.info('Sábados y Domingos fijados de 08:00 a 16:00');
                                        }}
                                        className="text-xs text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    >
                                        Sáb/Dom hasta 16:00
                                    </Button>
                                </div>
                            </div>

                            {/* Weekly schedule days */}
                            <div className="space-y-4">
                                {DAYS_CONFIG.map(({ key, label }) => {
                                    const day = schedule[key] || {
                                        enabled: true,
                                        start: '08:00',
                                        end: (key === 'saturday' || key === 'sunday') ? '16:00' : '19:00',
                                        lunch_enabled: false,
                                        lunch_start: '',
                                        lunch_end: ''
                                    };

                                    return (
                                        <div 
                                            key={key}
                                            className={`p-4 rounded-xl border transition-all ${
                                                day.enabled 
                                                    ? 'bg-[#F8FAFC] dark:bg-[#111827] border-gray-200 dark:border-[#1E293B]' 
                                                    : 'bg-gray-50/60 dark:bg-[#0B1120] border-dashed border-gray-200 dark:border-[#1E293B]/70 opacity-75'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                {/* Left: Day info & Toggle */}
                                                <div className="flex items-center gap-3 min-w-[180px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDayField(key, 'enabled', !day.enabled)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                                            day.enabled ? 'bg-teal-600 dark:bg-[#2DD4BF]' : 'bg-gray-300 dark:bg-gray-700'
                                                        }`}
                                                        title={day.enabled ? `Desactivar ${label}` : `Activar ${label}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                                            day.enabled ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                    </button>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 dark:text-[#F8FAFC] block">{label}</span>
                                                        <span className={`text-xs ${day.enabled ? 'text-teal-600 dark:text-[#2DD4BF] font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                                            {day.enabled ? 'Abierto' : 'Cerrado'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Center & Right: Hours Config */}
                                                {day.enabled ? (
                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Hora Inicio</label>
                                                            <Input
                                                                type="time"
                                                                value={day.start}
                                                                onChange={(e) => updateDayField(key, 'start', e.target.value)}
                                                                className="h-9 bg-white dark:bg-[#0F172A] border-gray-200 dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-mono text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Hora Cierre</label>
                                                            <Input
                                                                type="time"
                                                                value={day.end}
                                                                onChange={(e) => updateDayField(key, 'end', e.target.value)}
                                                                className="h-9 bg-white dark:bg-[#0F172A] border-gray-200 dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-mono text-xs"
                                                            />
                                                        </div>

                                                        {/* Lunch Pause */}
                                                        <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateDayField(key, 'lunch_enabled', !day.lunch_enabled)}
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                                                        day.lunch_enabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
                                                                    }`}
                                                                    title="Pausa de almuerzo"
                                                                >
                                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                                                        day.lunch_enabled ? 'translate-x-4' : 'translate-x-0.5'
                                                                    }`} />
                                                                </button>
                                                                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">Pausa</span>
                                                            </div>

                                                            {day.lunch_enabled ? (
                                                                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                                                    <Input
                                                                        type="time"
                                                                        value={day.lunch_start || ''}
                                                                        placeholder="Inicio"
                                                                        onChange={(e) => updateDayField(key, 'lunch_start', e.target.value)}
                                                                        className="h-9 w-24 bg-white dark:bg-[#0F172A] border-gray-200 dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-mono text-xs"
                                                                    />
                                                                    <span className="text-xs text-gray-400">a</span>
                                                                    <Input
                                                                        type="time"
                                                                        value={day.lunch_end || ''}
                                                                        placeholder="Fin"
                                                                        onChange={(e) => updateDayField(key, 'lunch_end', e.target.value)}
                                                                        className="h-9 w-24 bg-white dark:bg-[#0F172A] border-gray-200 dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-mono text-xs"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Jornada continua</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 text-sm text-gray-400 dark:text-gray-500 italic py-1">
                                                        No se permitirán reservas públicas los días {label}.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#1E293B] flex justify-end">
                                <Button
                                    onClick={handleSaveBookingHours}
                                    disabled={processingBH}
                                    className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-md shadow-teal-600/20"
                                >
                                    {processingBH ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Guardar Horario Semanal
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* APARIENCIA */}
                    <TabsContent value="apariencia" className="space-y-8">
                        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1E293B] p-4 sm:p-8">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-[#F8FAFC] mb-6 flex items-center gap-2">
                                <Paintbrush className="w-5 h-5 text-teal-600 dark:text-[#2DD4BF]" />
                                Personalización de la Clínica
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre Público de la Clínica</label>
                                        <Input value={appearanceName} onChange={(e) => setAppearanceName(e.target.value)} className="bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Color Principal (Fondo)</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={appearanceColor} onChange={(e) => setAppearanceColor(e.target.value)} className="w-10 h-10 rounded border-0 cursor-pointer" />
                                            <Input value={appearanceColor} onChange={(e) => setAppearanceColor(e.target.value)} className="font-mono uppercase bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Color del Texto (Header)</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={appearanceTextColor} onChange={(e) => setAppearanceTextColor(e.target.value)} className="w-10 h-10 rounded border-0 cursor-pointer" />
                                            <Input value={appearanceTextColor} onChange={(e) => setAppearanceTextColor(e.target.value)} className="font-mono uppercase bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Logo de la Clínica</label>
                                        <Input type="file" accept="image/*" onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setAppearanceLogo(e.target.files[0]);
                                                setAppearanceLogoPreview(URL.createObjectURL(e.target.files[0]));
                                            }
                                        }} className="bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]" />
                                    </div>
                                    <Button onClick={handleSaveAppearance} disabled={processingAppearance} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4 cursor-pointer shadow-md shadow-teal-600/20">
                                        {processingAppearance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Guardar Cambios
                                    </Button>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-[#1E293B] p-6 flex flex-col items-center justify-center">
                                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-4 font-medium uppercase tracking-wider">Vista Previa Logo</p>
                                    {appearanceLogoPreview ? (
                                        <img src={appearanceLogoPreview} alt="Logo" className="max-w-[200px] max-h-[200px] object-contain rounded-lg" />
                                    ) : (
                                        <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                            <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>

            {/* Modal para ver comprobante */}
            <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Comprobante de Pago</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-4 bg-gray-50 dark:bg-[#111827] rounded-xl border dark:border-[#1E293B]">
                        {selectedReceipt ? (
                            <img src={selectedReceipt} alt="Comprobante" className="max-w-full max-h-[60vh] object-contain rounded-md" />
                        ) : (
                            <div className="text-gray-500 dark:text-[#94A3B8] py-8">No se subió ningún comprobante o el archivo no existe.</div>
                        )}
                    </div>
                    {/* Solo mostramos botones de Aceptar/Rechazar si está pendiente */}
                    {selectedAppt && selectedAppt.payment_status === 'pending' && (
                        <DialogFooter className="mt-4 flex gap-3 sm:justify-between w-full">
                            <Button 
                                variant="outline" 
                                className="border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                onClick={() => selectedApptId && handleRejectPayment(selectedApptId)}
                            >
                                Rechazar
                            </Button>
                            <Button 
                                className="bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-md shadow-teal-600/20"
                                onClick={() => selectedApptId && handleAcceptPayment(selectedApptId)}
                            >
                                Aceptar y Confirmar
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal para Nuevo Servicio / Especialidad */}
            <Dialog open={newTreatmentModalOpen} onOpenChange={setNewTreatmentModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Nuevo Servicio Público</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre del Servicio o Consulta</label>
                            <Input 
                                value={newTreatmentName} 
                                onChange={(e) => setNewTreatmentName(e.target.value)} 
                                placeholder="Ej. Consulta Médica General, Pediatría..." 
                                className="bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Precio Base (Bs.)</label>
                            <Input 
                                type="number" 
                                value={newTreatmentPrice} 
                                onChange={(e) => setNewTreatmentPrice(e.target.value)} 
                                placeholder="Ej. 150" 
                                className="bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Duración (minutos)</label>
                            <Input 
                                type="number" 
                                value={newTreatmentDuration} 
                                onChange={(e) => setNewTreatmentDuration(e.target.value)} 
                                placeholder="Ej. 30" 
                                className="bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] border-gray-200 dark:border-[#1E293B]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="is_active" 
                                checked={newTreatmentActive} 
                                onChange={(e) => setNewTreatmentActive(e.target.checked)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-200">Visible en el portal público</label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewTreatmentModalOpen(false)} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
                        <Button className="bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer" onClick={handleCreateTreatment}>Guardar Servicio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
