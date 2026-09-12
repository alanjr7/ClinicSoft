import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
  Activity,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  User,
  Stethoscope,
  FileText,
  CheckCircle2,
  AlertTriangle,
  DoorClosed,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Building2,
  Syringe,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

export type SurgeryStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  national_id?: string | null;
  phone?: string | null;
  blood_type?: string | null;
}

interface StaffDoctor {
  id: string;
  name: string;
  role: string;
}

interface SurgeryListItem {
  id: string;
  patient_id: string;
  surgeon_name: string;
  anesthesiologist_name?: string | null;
  assistant_name?: string | null;
  nurse_name?: string | null;
  procedure_name: string;
  surgery_type?: string | null;
  operating_room?: string | null;
  scheduled_start_at: string;
  scheduled_end_at?: string | null;
  actual_start_at?: string | null;
  actual_end_at?: string | null;
  status: SurgeryStatus;
  pre_op_diagnosis?: string | null;
  post_op_diagnosis?: string | null;
  anesthesia_type?: string | null;
  surgical_protocol?: string | null;
  findings?: string | null;
  complications?: string | null;
  estimated_blood_loss?: string | null;
  pathology_samples?: string | null;
  implants_or_materials?: string | null;
  post_op_orders?: string | null;
  supplies_used?: any[] | null;
  estimated_cost?: number | string | null;
  notes?: string | null;
  created_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    national_id?: string | null;
    blood_type?: string | null;
    phone?: string | null;
  };
}

interface Props {
  surgeries: SurgeryListItem[];
  patients: PatientOption[];
  staffDoctors: StaffDoctor[];
  stats: {
    total_scheduled: number;
    in_progress?: number;
    completed_month: number;
    total_completed: number;
    active_rooms: number;
  };
  filters: {
    patient_id?: string;
    status?: string;
    operating_room?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
  };
}

const STATUS_CONFIG: Record<SurgeryStatus, { label: string; bg: string; text: string; border: string }> = {
  scheduled: {
    label: 'Programada (Cita)',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  confirmed: {
    label: 'Confirmada',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/50',
  },
  completed: {
    label: 'Cirugía Realizada',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  cancelled: {
    label: 'Cancelada',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
};

const OPERATING_ROOMS = [
  'Quirófano 1 (Central)',
  'Quirófano 2 (Cirugía Mayor)',
  'Quirófano 3 (Ambulatorio)',
  'Sala de Procedimientos',
  'Quirófano de Urgencias',
];

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SPANISH_WEEKDAYS_LONG = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];

const WEEK_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseLocalDateKey(val: string): string {
  if (!val) return '';
  if (val.includes(' ') && !val.includes('T')) {
    return val.split(' ')[0];
  }
  return toLocalDateKey(new Date(val));
}

function parseSurgeryDate(val: string): Date {
  if (!val) return new Date();
  if (val.includes(' ') && !val.includes('T')) {
    const [dPart, tPart] = val.split(' ');
    const [y, m, d] = (dPart || '').split('-').map(Number);
    const [hh, mm, ss] = (tPart || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  }
  return new Date(val);
}

Surgeries.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Surgeries({ surgeries, patients, staffDoctors, stats, filters }: Props) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'register'>('calendar');

  // Calendario State
  const today = useMemo(() => startOfDay(new Date()), []);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const selectedDateKey = toLocalDateKey(selectedDate);

  // Filtros de Agenda
  const [filterRoom, setFilterRoom] = useState('all');

  // Modal Ver Detalle Cirugía
  const [selectedSurgeryDetail, setSelectedSurgeryDetail] = useState<SurgeryListItem | null>(null);

  // Modo Edición / Registro
  const [editingSurgeryId, setEditingSurgeryId] = useState<string | null>(null);

  // Formulario de Registro / Edición de Cirugía
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [formPatientId, setFormPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientNationalId, setNewPatientNationalId] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  const [formProcedureName, setFormProcedureName] = useState('');
  const [formSurgeonName, setFormSurgeonName] = useState('');
  const [formInstrumentistName, setFormInstrumentistName] = useState('');
  const [formAnesthesiologistName, setFormAnesthesiologistName] = useState('');
  const [formOperatingRoom, setFormOperatingRoom] = useState('Quirófano 1 (Central)');
  
  const nowLocalDate = toLocalDateKey(new Date());
  const [formDate, setFormDate] = useState(nowLocalDate);
  const [formTime, setFormTime] = useState('09:00');
  const [formDurationMinutes, setFormDurationMinutes] = useState(60);
  const [formType, setFormType] = useState<'completed' | 'scheduled'>('completed');
  
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formAnesthesiaType, setFormAnesthesiaType] = useState('General');
  const [formSurgicalProtocol, setFormSurgicalProtocol] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCost, setFormCost] = useState('');

  const [saving, setSaving] = useState(false);

  // Navegación Calendario
  function prevMonth() {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function selectDay(day: number) {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(d);
  }

  // Cirugías del mes actual para puntos en el calendario
  const monthSurgeries = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    return surgeries.filter((s) => {
      const d = parseSurgeryDate(s.scheduled_start_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [surgeries, calendarMonth]);

  // Conteos por día en el mes
  const monthCountsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of monthSurgeries) {
      const k = parseLocalDateKey(s.scheduled_start_at);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [monthSurgeries]);

  // Cuadrícula del mes
  const monthDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offsetSundayBased = first.getDay();
    const leadingBlanks = offsetSundayBased === 0 ? 6 : offsetSundayBased - 1;
    return { daysInMonth, leadingBlanks };
  }, [calendarMonth]);

  // Cirugías filtradas para el día seleccionado
  const daySurgeries = useMemo(() => {
    return surgeries
      .filter((s) => parseLocalDateKey(s.scheduled_start_at) === selectedDateKey)
      .filter((s) => filterRoom === 'all' || s.operating_room === filterRoom)
      .sort((a, b) => a.scheduled_start_at.localeCompare(b.scheduled_start_at));
  }, [surgeries, selectedDateKey, filterRoom]);

  // Handler para resetear formulario
  const resetForm = () => {
    setEditingSurgeryId(null);
    setIsNewPatient(false);
    setFormPatientId(patients[0]?.id || '');
    setNewPatientName('');
    setNewPatientNationalId('');
    setNewPatientPhone('');
    setFormProcedureName('');
    setFormSurgeonName('');
    setFormInstrumentistName('');
    setFormAnesthesiologistName('');
    setFormOperatingRoom('Quirófano 1 (Central)');
    setFormDate(selectedDateKey || nowLocalDate);
    setFormTime('09:00');
    setFormDurationMinutes(60);
    setFormType('completed');
    setFormDiagnosis('');
    setFormAnesthesiaType('General');
    setFormSurgicalProtocol('');
    setFormNotes('');
    setFormCost('');
  };

  // Switch a tab de registro en modo crear
  const handleOpenRegisterWithDate = () => {
    resetForm();
    setFormDate(selectedDateKey);
    setActiveTab('register');
  };

  // Cargar datos de cirugía existente para editar
  const handleEditSurgery = (surg: SurgeryListItem) => {
    setEditingSurgeryId(surg.id);
    setIsNewPatient(false);
    setFormPatientId(surg.patient_id);
    setNewPatientName('');
    setNewPatientNationalId('');
    setNewPatientPhone('');
    setFormProcedureName(surg.procedure_name);
    setFormSurgeonName(surg.surgeon_name);
    setFormInstrumentistName(surg.assistant_name || '');
    setFormAnesthesiologistName(surg.anesthesiologist_name || '');
    setFormOperatingRoom(surg.operating_room || 'Quirófano 1 (Central)');
    
    // Parse fecha y hora
    const sDate = surg.scheduled_start_at ? parseSurgeryDate(surg.scheduled_start_at) : new Date();
    setFormDate(toLocalDateKey(sDate));
    const hh = String(sDate.getHours()).padStart(2, '0');
    const mm = String(sDate.getMinutes()).padStart(2, '0');
    setFormTime(`${hh}:${mm}`);
    
    // Duración
    if (surg.scheduled_end_at && surg.scheduled_start_at) {
      const eDate = parseSurgeryDate(surg.scheduled_end_at);
      const diffMins = Math.round((eDate.getTime() - sDate.getTime()) / 60000);
      setFormDurationMinutes(diffMins > 0 ? diffMins : 60);
    } else {
      setFormDurationMinutes(60);
    }

    setFormType(surg.status === 'completed' ? 'completed' : 'scheduled');
    setFormDiagnosis(surg.pre_op_diagnosis || '');
    setFormAnesthesiaType(surg.anesthesia_type || 'General');
    setFormSurgicalProtocol(surg.surgical_protocol || '');
    setFormNotes(surg.notes || '');
    setFormCost(surg.estimated_cost ? String(surg.estimated_cost) : '');

    setSelectedSurgeryDetail(null);
    setActiveTab('register');
  };

  // Marcar como Realizada directamente
  const handleMarkAsCompleted = (surgeryId: string) => {
    router.put(`/surgeries/${surgeryId}`, {
      status: 'completed',
      actual_start_at: new Date().toISOString(),
      actual_end_at: new Date().toISOString(),
    }, {
      onSuccess: () => {
        toast.success('¡Cirugía marcada como Realizada!');
        setSelectedSurgeryDetail(null);
      },
      onError: () => {
        toast.error('Error al actualizar el estado de la cirugía.');
      }
    });
  };

  // Submit Guardar / Actualizar Cirugía
  const handleSubmitSurgery = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSurgeryId && isNewPatient) {
      if (!newPatientName.trim()) {
        toast.error('Por favor escribe el nombre del paciente.');
        return;
      }
    } else {
      if (!formPatientId) {
        toast.error('Por favor selecciona un paciente o marca "Nuevo Paciente".');
        return;
      }
    }

    if (!formProcedureName.trim()) {
      toast.error('Por favor escribe el nombre de la cirugía / procedimiento.');
      return;
    }
    if (!formSurgeonName.trim()) {
      toast.error('Por favor indica el nombre del Cirujano.');
      return;
    }
    if (!formDate || !formTime) {
      toast.error('Por favor define la fecha y hora.');
      return;
    }

    const startDateTime = `${formDate} ${formTime}:00`;
    const startDateObj = new Date(`${formDate}T${formTime}:00`);
    const endDateObj = new Date(startDateObj.getTime() + formDurationMinutes * 60000);
    const endHours = String(endDateObj.getHours()).padStart(2, '0');
    const endMins = String(endDateObj.getMinutes()).padStart(2, '0');
    const endDateTime = `${toLocalDateKey(endDateObj)} ${endHours}:${endMins}:00`;

    const payload: any = {
      create_quick_patient: !editingSurgeryId && isNewPatient,
      patient_id: (!editingSurgeryId && isNewPatient) ? null : formPatientId,
      new_patient_name: newPatientName.trim(),
      new_patient_national_id: newPatientNationalId.trim() || null,
      new_patient_phone: newPatientPhone.trim() || null,

      procedure_name: formProcedureName.trim(),
      surgeon_name: formSurgeonName.trim(),
      assistant_name: formInstrumentistName.trim() || null,
      anesthesiologist_name: formAnesthesiologistName.trim() || null,
      operating_room: formOperatingRoom,
      scheduled_start_at: startDateTime,
      scheduled_end_at: endDateTime,
      actual_start_at: formType === 'completed' ? startDateTime : null,
      actual_end_at: formType === 'completed' ? endDateTime : null,
      status: formType === 'completed' ? 'completed' : 'scheduled',

      pre_op_diagnosis: formDiagnosis.trim() || null,
      anesthesia_type: formAnesthesiaType.trim() || null,
      surgical_protocol: formSurgicalProtocol.trim() || null,
      notes: formNotes.trim() || null,
      estimated_cost: formCost ? Number(formCost) : 0,
    };

    setSaving(true);
    if (editingSurgeryId) {
      router.put(`/surgeries/${editingSurgeryId}`, payload, {
        onSuccess: () => {
          toast.success('Cirugía actualizada exitosamente.');
          setSelectedDate(startOfDay(startDateObj));
          setCalendarMonth(new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1));
          setActiveTab('calendar');
          resetForm();
        },
        onError: (errors) => {
          const firstErr = Object.values(errors)[0] as string;
          toast.error(firstErr || 'Ocurrió un error al actualizar la cirugía.');
        },
        onFinish: () => setSaving(false),
      });
    } else {
      router.post('/surgeries', payload, {
        onSuccess: () => {
          toast.success(formType === 'completed' ? 'Cirugía registrada exitosamente.' : 'Cirugía programada exitosamente.');
          setSelectedDate(startOfDay(startDateObj));
          setCalendarMonth(new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1));
          setActiveTab('calendar');
          resetForm();
        },
        onError: (errors) => {
          const firstErr = Object.values(errors)[0] as string;
          toast.error(firstErr || 'Ocurrió un error al registrar la cirugía.');
        },
        onFinish: () => setSaving(false),
      });
    }
  };

  // Eliminar Cirugía
  const handleDeleteSurgery = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro quirúrgico?')) return;
    router.delete(`/surgeries/${id}`, {
      onSuccess: () => {
        toast.success('Cirugía eliminada.');
        if (selectedSurgeryDetail?.id === id) setSelectedSurgeryDetail(null);
      },
    });
  };

  const headerDateLabel = `${SPANISH_WEEKDAYS_LONG[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${SPANISH_MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const calendarHeaderLabel = `${SPANISH_MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const todayKey = toLocalDateKey(today);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Cirugías y Quirófanos
              </h1>
             
            </div>
          </div>
        </div>

        {/* Botón Switch Rápido */}
        <div className="flex items-center gap-3">
          {activeTab === 'calendar' ? (
            <Button
              onClick={handleOpenRegisterWithDate}
              className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 shadow-md shadow-sky-500/20 cursor-pointer flex items-center gap-2 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cirugía</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                resetForm();
                setActiveTab('calendar');
              }}
              variant="outline"
              className="rounded-xl border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center gap-2 font-semibold"
            >
              <CalendarIcon className="w-4 h-4 text-sky-600" />
              <span>Ver Calendario</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards / Mini Dashboard de Quirófano */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Programadas</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats?.total_scheduled ?? 0}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">En agenda quirúrgica</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/40">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Realizadas (Mes)</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.completed_month ?? 0}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{stats?.total_completed ?? 0} histórico total</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Total Cirugías</p>
              <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{surgeries.length}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Registros en el sistema</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800/40">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Salas Disponibles</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{OPERATING_ROOMS.length}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Quirófanos configurados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/40">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principales */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-white dark:bg-[#0F172A] p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 inline-flex shadow-sm">
          <TabsTrigger
            value="calendar"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>1. Agenda y Calendario Mensual</span>
            <span className="ml-1.5 px-2 py-0.2 rounded-full text-xs bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 data-[state=active]:bg-white/20 data-[state=active]:text-white">
              {surgeries.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="register"
            onClick={resetForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingSurgeryId ? '2. Editar Cirugía' : '2. Registrar Cirugía'}</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: CALENDARIO MENSUAL Y LISTADO DEL DÍA                              */}
        {/* ========================================================================= */}
        <TabsContent value="calendar" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Calendario Mensual */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white font-bold text-base">
                      {calendarHeaderLabel}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevMonth}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextMonth}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {WEEK_HEADERS.map((day, i) => (
                      <div key={i} className="text-xs text-gray-400 font-semibold py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {Array.from({ length: monthDays.leadingBlanks }, (_, i) => (
                      <div key={`pad-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: monthDays.daysInMonth }, (_, i) => i + 1).map((day) => {
                      const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const key = toLocalDateKey(d);
                      const isSelected = key === selectedDateKey;
                      const isToday = key === todayKey;
                      const count = monthCountsByKey.get(key) ?? 0;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`relative aspect-square rounded-xl text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25 font-bold'
                              : isToday
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium'
                          }`}
                        >
                          <span className="leading-none">{day}</span>
                          {count > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-sky-500 dark:bg-sky-400'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha: Cirugías del Día */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-5 border-b border-gray-100 dark:border-gray-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Cirugías del Día:</span>
                        <span className="text-sky-600 dark:text-sky-400 font-semibold text-base">{headerDateLabel}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-0.5">
                        Intervenciones realizadas y cirugías agendadas para esta fecha.
                      </CardDescription>
                    </div>

                    {/* Filtro Rápido */}
                    <div className="flex items-center gap-2">
                      <Select value={filterRoom} onValueChange={setFilterRoom}>
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                          <SelectValue placeholder="Quirófano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las salas</SelectItem>
                          {OPERATING_ROOMS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  {daySurgeries.length === 0 ? (
                    <div className="text-center py-14 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-100 dark:border-sky-900">
                        <Activity className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
                        No hay cirugías registradas para este día
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Puedes añadir cirugías ya ejecutadas o programar una intervención haciendo clic en registrar.
                      </p>
                      <Button
                        onClick={handleOpenRegisterWithDate}
                        className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Registrar Cirugía en este Día
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySurgeries.map((surg) => {
                        const statusInfo = STATUS_CONFIG[surg.status] || STATUS_CONFIG.completed;
                        const isScheduled = surg.status === 'scheduled' || surg.status === 'confirmed';
                        const timeStr = surg.scheduled_start_at
                          ? new Date(surg.scheduled_start_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';

                        return (
                          <div
                            key={surg.id}
                            onClick={() => setSelectedSurgeryDetail(surg)}
                            className="p-4 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-gray-800 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer shadow-sm group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Info Paciente y Procedimiento */}
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-base text-gray-900 dark:text-white">
                                    {surg.patient?.first_name} {surg.patient?.last_name}
                                  </span>
                                  {surg.patient?.national_id && (
                                    <span className="text-[11px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                      CI: {surg.patient.national_id}
                                    </span>
                                  )}
                                  <Badge className={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} border text-[11px] font-semibold`}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>

                                <h5 className="text-sm font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                                  <Activity className="w-4 h-4 text-sky-500" />
                                  {surg.procedure_name}
                                </h5>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {timeStr}
                                  </span>
                                  <span>•</span>
                                  <span>{surg.operating_room || 'Quirófano 1'}</span>
                                  <span>•</span>
                                  <span><strong>Cirujano:</strong> {surg.surgeon_name}</span>
                                </div>
                              </div>

                              {/* Acciones Rápidas */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {isScheduled && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsCompleted(surg.id);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 px-3 cursor-pointer shadow-sm flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Marcar Realizada</span>
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSurgery(surg);
                                  }}
                                  className="h-8 w-8 p-0 text-sky-600 hover:text-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-lg cursor-pointer"
                                  title="Editar Cirugía"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSurgery(surg.id);
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: REGISTRAR / EDITAR CIRUGÍA (FORMULARIO SENCILLO Y DIRECTO)         */}
        {/* ========================================================================= */}
        <TabsContent value="register" className="outline-none">
          <form onSubmit={handleSubmitSurgery} className="space-y-6 max-w-4xl mx-auto">
            
            {editingSurgeryId && (
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-sky-600" />
                  <span className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                    Estás editando un registro quirúrgico existente
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-xl"
                >
                  Cancelar Edición (Crear Nueva)
                </Button>
              </div>
            )}

            {/* Tarjeta 1: Paciente */}
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                      1. Datos del Paciente
                    </CardTitle>
                  </div>

                  {!editingSurgeryId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewPatient(!isNewPatient)}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl cursor-pointer"
                    >
                      {isNewPatient ? (
                        <span>Buscar en Pacientes Existentes</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          + Paciente Nuevo (Rápido)
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {!isNewPatient ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Seleccionar Paciente <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={formPatientId} onValueChange={setFormPatientId}>
                      <SelectTrigger className="rounded-xl h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Selecciona el paciente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} {p.national_id ? `(CI: ${p.national_id})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/50">
                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Nombre Completo <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="Ej. Juan Pérez"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        className="rounded-xl h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Carnet / C.I. (Opcional)
                      </Label>
                      <Input
                        placeholder="Ej. 7894561 LP"
                        value={newPatientNationalId}
                        onChange={(e) => setNewPatientNationalId(e.target.value)}
                        className="rounded-xl h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Teléfono (Opcional)
                      </Label>
                      <Input
                        placeholder="Ej. 70012345"
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value)}
                        className="rounded-xl h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tarjeta 2: Equipo Quirúrgico (Texto de Referencia) */}
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                      2. Personal Quirúrgico
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Nombres de referencia para el reporte (no requieren ser usuarios del sistema).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Cirujano Principal <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ej. Dr. Mario Vargas"
                    value={formSurgeonName}
                    onChange={(e) => setFormSurgeonName(e.target.value)}
                    className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Instrumentista / Asistente
                  </Label>
                  <Input
                    placeholder="Ej. Lic. Andrea Suárez"
                    value={formInstrumentistName}
                    onChange={(e) => setFormInstrumentistName(e.target.value)}
                    className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Anestesiólogo
                  </Label>
                  <Input
                    placeholder="Ej. Dr. Carlos Medina"
                    value={formAnesthesiologistName}
                    onChange={(e) => setFormAnesthesiologistName(e.target.value)}
                    className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta 3: Detalles de la Cirugía y Horarios */}
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                    3. Cirugía, Quirófano y Fecha
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-1">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Nombre de la Cirugía / Procedimiento <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. Apendicectomía, Rinoplastia, Cirugía Molar..."
                      value={formProcedureName}
                      onChange={(e) => setFormProcedureName(e.target.value)}
                      className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-1">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Quirófano / Sala
                    </Label>
                    <Select value={formOperatingRoom} onValueChange={setFormOperatingRoom}>
                      <SelectTrigger className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATING_ROOMS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Fecha <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Hora Inicio <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Duración estimada
                    </Label>
                    <Select
                      value={String(formDurationMinutes)}
                      onValueChange={(v) => setFormDurationMinutes(Number(v))}
                    >
                      <SelectTrigger className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1h 30 min</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="180">3 horas</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Tipo de Registro
                    </Label>
                    <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                      <SelectTrigger className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Cirugía ya Realizada</SelectItem>
                        <SelectItem value="scheduled">Programar como Cita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta 4: Protocolo Quirúrgico y Notas (Simple) */}
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                    4. Protocolo Quirúrgico y Observaciones
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Diagnóstico Pre-operatorio / Indicación
                    </Label>
                    <Input
                      placeholder="Ej. Apendicitis aguda grado II"
                      value={formDiagnosis}
                      onChange={(e) => setFormDiagnosis(e.target.value)}
                      className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Tipo de Anestesia
                    </Label>
                    <Input
                      placeholder="Ej. General, Local + Sedación, Raquídea"
                      value={formAnesthesiaType}
                      onChange={(e) => setFormAnesthesiaType(e.target.value)}
                      className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Descripción del Acto Quirúrgico / Técnica
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Descripción resumida del procedimiento realizado, hallazgos o técnica aplicada..."
                    value={formSurgicalProtocol}
                    onChange={(e) => setFormSurgicalProtocol(e.target.value)}
                    className="rounded-xl resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Notas adicionales / Indicaciones
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Indicaciones post-quirúrgicas o notas adicionales..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="rounded-xl resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setActiveTab('calendar');
                }}
                className="rounded-xl border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-8 shadow-md shadow-sky-500/20 cursor-pointer font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingSurgeryId ? 'Actualizar Cirugía' : 'Guardar Cirugía'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE CIRUGÍA                                                  */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedSurgeryDetail} onOpenChange={(open) => !open && setSelectedSurgeryDetail(null)}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-2xl p-0 overflow-hidden bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800">
          {selectedSurgeryDetail && (
            <>
              <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedSurgeryDetail.procedure_name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-gray-500 mt-0.5">
                        Paciente: {selectedSurgeryDetail.patient?.first_name} {selectedSurgeryDetail.patient?.last_name}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className={`${STATUS_CONFIG[selectedSurgeryDetail.status]?.bg || ''} ${STATUS_CONFIG[selectedSurgeryDetail.status]?.text || ''} border text-xs`}>
                    {STATUS_CONFIG[selectedSurgeryDetail.status]?.label || selectedSurgeryDetail.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
                {/* Equipo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-gray-400 block text-xs">Cirujano:</span>
                    <strong className="text-gray-800 dark:text-gray-200">{selectedSurgeryDetail.surgeon_name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Instrumentista:</span>
                    <strong className="text-gray-800 dark:text-gray-200">{selectedSurgeryDetail.assistant_name || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Anestesiólogo:</span>
                    <strong className="text-gray-800 dark:text-gray-200">{selectedSurgeryDetail.anesthesiologist_name || '—'}</strong>
                  </div>
                </div>

                {/* Fecha y Sala */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                    <span className="text-gray-400 block text-xs">Fecha y Hora:</span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      {new Date(selectedSurgeryDetail.scheduled_start_at).toLocaleString('es-ES', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </strong>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
                    <span className="text-gray-400 block text-xs">Quirófano:</span>
                    <strong className="text-gray-800 dark:text-gray-200">{selectedSurgeryDetail.operating_room || 'Quirófano 1'}</strong>
                  </div>
                </div>

                {/* Diagnóstico */}
                {selectedSurgeryDetail.pre_op_diagnosis && (
                  <div>
                    <span className="text-gray-400 font-semibold block mb-1">Diagnóstico Pre-operatorio:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-gray-700 dark:text-gray-300">
                      {selectedSurgeryDetail.pre_op_diagnosis}
                    </p>
                  </div>
                )}

                {/* Protocolo Quirúrgico */}
                {selectedSurgeryDetail.surgical_protocol && (
                  <div>
                    <span className="text-gray-400 font-semibold block mb-1">Protocolo Quirúrgico / Técnica:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedSurgeryDetail.surgical_protocol}
                    </p>
                  </div>
                )}

                {/* Notas */}
                {selectedSurgeryDetail.notes && (
                  <div>
                    <span className="text-gray-400 font-semibold block mb-1">Notas / Observaciones:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-gray-700 dark:text-gray-300">
                      {selectedSurgeryDetail.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSurgery(selectedSurgeryDetail.id)}
                    className="rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Eliminar
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {(selectedSurgeryDetail.status === 'scheduled' || selectedSurgeryDetail.status === 'confirmed') && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsCompleted(selectedSurgeryDetail.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Realizada
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSurgery(selectedSurgeryDetail)}
                    className="border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar Datos
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSurgeryDetail(null)}
                    className="rounded-xl cursor-pointer text-gray-500"
                  >
                    Cerrar
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
