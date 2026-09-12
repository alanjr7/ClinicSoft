import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Loader2,
  UserPlus,
  X,
  Phone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import Layout from '../components/Layout';

type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

interface AppointmentListItem {
  id: string;
  patient_id: string;
  dentist_id: string;
  start_at: string;
  end_at: string | null;
  status: AppointmentStatus;
  notes: string | null;
  patient?: { id: string; first_name: string; last_name: string; national_id?: string | null };
  dentist?: { id: string; first_name: string; last_name: string };
}

interface PatientOption { id: string; first_name: string; last_name: string; national_id?: string | null; }
interface DentistOption  { id: string; name: string; }
interface TreatmentOption { id: string; name: string; base_price: number; duration_minutes: number | null; }



interface Props {
  appointments: AppointmentListItem[];
  patients: PatientOption[];
  dentists: DentistOption[];
  treatments: TreatmentOption[];
}

Appointments.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; border: string; label: string }> = {
  scheduled:   { bg: "bg-[#FEF3C7] dark:bg-amber-950/40", text: "text-[#B45309] dark:text-amber-300", border: "border-[#F59E0B] dark:border-amber-700/50", label: "Programada" },
  confirmed:   { bg: "bg-[#F0F9FF] dark:bg-sky-950/40", text: "text-[#075985] dark:text-sky-300", border: "border-[#0284C7] dark:border-sky-700/50", label: "Confirmada" },
  in_progress: { bg: "bg-[#EDE9FE] dark:bg-purple-950/40", text: "text-[#6D28D9] dark:text-purple-300", border: "border-[#8B5CF6] dark:border-purple-700/50", label: "En curso" },
  completed:   { bg: "bg-[#DBEAFE] dark:bg-blue-950/40", text: "text-[#1D4ED8] dark:text-blue-300", border: "border-[#3B82F6] dark:border-blue-700/50", label: "Completada" },
  cancelled:   { bg: "bg-[#FEE2E2] dark:bg-red-950/40", text: "text-[#B91C1C] dark:text-red-300", border: "border-[#EF4444] dark:border-red-700/50", label: "Cancelada" },
  no_show:     { bg: "bg-[#F3F4F6] dark:bg-gray-800", text: "text-[#374151] dark:text-gray-300", border: "border-[#9CA3AF] dark:border-gray-700", label: "No asistió" },
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const SPANISH_MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SPANISH_WEEKDAYS_LONG = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const WEEK_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseLocalDateKey(val: string): string {
  if (!val) return '';
  if (val.includes(' ') && !val.includes('T')) {
    return val.split(' ')[0];
  }
  return toLocalDateKey(new Date(val));
}

function parseApptDate(val: string): Date {
  if (!val) return new Date();
  if (val.includes(' ') && !val.includes('T')) {
    const [dPart, tPart] = val.split(' ');
    const [y, m, d] = (dPart || '').split('-').map(Number);
    const [hh, mm, ss] = (tPart || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  }
  return new Date(val);
}

function formatTime(val: string): string {
  if (!val) return '';
  if (val.includes(' ') && !val.includes('T')) {
    const parts = val.split(' ')[1];
    return parts ? parts.substring(0, 5) : val;
  }
  const d = new Date(val);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function durationLabel(startVal: string, endVal: string): string {
  if (!startVal || !endVal) return '';
  const s = parseApptDate(startVal).getTime();
  const e = parseApptDate(endVal).getTime();
  const ms = e - s;
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function initials(first: string, last: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function combineDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

interface NewApptForm {
  patient_id: string;
  dentist_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  treatment_id: string;
  reason: string;
  notes: string;
}

function emptyForm(date: string): NewApptForm {
  return {
    patient_id: "",
    dentist_id: "",
    date,
    start_time: "09:00",
    duration_minutes: 30,
    treatment_id: "",
    reason: "",
    notes: "",
  };
}

const SELECTED_DATE_KEY = "dentalsoft:appointments:selectedDate";

function readPersistedDate(fallback: Date): Date {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(SELECTED_DATE_KEY);
  if (!raw) return fallback;
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return fallback;
  return new Date(y, m - 1, d);
}

export default function Appointments({ appointments: initialAppointments, patients, dentists, treatments }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const initialSelectedDate = useMemo(() => readPersistedDate(today), [today]);

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date(initialSelectedDate);
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(initialSelectedDate));

  // All appointments come from server; filter client-side by selected date
  const [appointments, setAppointments] = useState<AppointmentListItem[]>(initialAppointments);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewApptForm>(() => emptyForm(toLocalDateKey(today)));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const selectedDateKey = toLocalDateKey(selectedDate);

  // Persist selected date in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SELECTED_DATE_KEY, selectedDateKey);
  }, [selectedDateKey]);

  // Patients list state (synced with props and augmented by quick patient creation)
  const [patientList, setPatientList] = useState<PatientOption[]>(patients);

  useEffect(() => {
    setPatientList(patients);
  }, [patients]);

  // Patient creation toggle mode & fields
  const [isNewPatientMode, setIsNewPatientMode] = useState(false);
  const [quickFullName, setQuickFullName] = useState('');
  const [quickNationalId, setQuickNationalId] = useState('');

  // Filter by selected date client-side:
  const patientOpts = patientList;
  const dentistOpts = dentists;
  const treatmentOpts = treatments;

  // ── Navegación de calendario ───────────────────────────────────────────────
  function prevMonth() {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function selectDay(day: number) {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(d);
    setWeekStart(startOfWeekMonday(d));
  }

  // ── Crear cita ─────────────────────────────────────────────────────────────
  function openNew() {
    setForm(emptyForm(selectedDateKey));
    setSaveError(null);
    setIsNewPatientMode(false);
    setQuickFullName('');
    setQuickNationalId('');
    setShowModal(true);
  }
  function closeNew() {
    setShowModal(false);
    setSaveError(null);
    setIsNewPatientMode(false);
    setQuickFullName('');
    setQuickNationalId('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    let finalPatientId = form.patient_id;

    // Si está en modo nuevo paciente, crearlo primero vía /patients/quick
    if (isNewPatientMode) {
      if (!quickFullName.trim()) {
        setSaveError("Ingresa el nombre completo del nuevo paciente.");
        return;
      }
      setSaving(true);
      try {
        const metaCsrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        const cookieCsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1];
        const csrfToken = metaCsrf || (cookieCsrf ? decodeURIComponent(cookieCsrf) : '');

        const res = await fetch('/patients/quick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            full_name: quickFullName.trim(),
            national_id: quickNationalId.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Error al registrar el paciente.');
        }

        finalPatientId = data.patient.id;
        const newP: PatientOption = {
          id: data.patient.id,
          first_name: data.patient.first_name,
          last_name: data.patient.last_name || '',
          national_id: data.patient.national_id || null,
        };
        setPatientList((prev) => [newP, ...prev.filter((p) => p.id !== newP.id)]);
        setForm((f) => ({ ...f, patient_id: finalPatientId }));
      } catch (err: any) {
        setSaving(false);
        setSaveError(err.message || 'Error al registrar el paciente.');
        return;
      }
    } else {
      if (!finalPatientId) {
        setSaveError("Selecciona un paciente.");
        return;
      }
    }

    if (!form.dentist_id) {
      setSaving(false);
      setSaveError("Selecciona un médico / especialista.");
      return;
    }

    const start = combineDateTime(form.date, form.start_time);
    const end = new Date(start.getTime() + form.duration_minutes * 60_000);
    const endHours = String(end.getHours()).padStart(2, '0');
    const endMinutes = String(end.getMinutes()).padStart(2, '0');
    const startFormatted = `${form.date} ${form.start_time}:00`;
    const endFormatted = `${toLocalDateKey(end)} ${endHours}:${endMinutes}:00`;

    setSaving(true);
    router.post('/appointments', {
      patient_id: finalPatientId,
      dentist_id: form.dentist_id,
      start_at: startFormatted,
      end_at: endFormatted,
      notes: form.notes.trim() || null,
      treatment_ids: form.treatment_id ? [form.treatment_id] : [],
    }, {
      onSuccess: () => {
        if (toLocalDateKey(start) !== selectedDateKey) {
          setSelectedDate(startOfDay(start));
          setCalendarMonth(new Date(start.getFullYear(), start.getMonth(), 1));
          setWeekStart(startOfWeekMonday(start));
        }
        setShowModal(false);
      },
      onError: () => setSaveError('No se pudo crear la cita. Verifica los datos.'),
      onFinish: () => setSaving(false),
    });
  }

  // ── Cambiar estado / eliminar ──────────────────────────────────────────────
  function handleStatusChange(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    router.put(`/appointments/${id}`, { status }, {
      onSuccess: () => setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a))),
      onFinish: () => setUpdatingId(null),
    });
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cita?')) return;
    setUpdatingId(id);
    router.delete(`/appointments/${id}`, {
      onSuccess: () => setAppointments((prev) => prev.filter((a) => a.id !== id)),
      onFinish: () => setUpdatingId(null),
    });
  }

  // ── Datos derivados ────────────────────────────────────────────────────────
  // Appointments filtered for the selected day
  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => parseLocalDateKey(a.start_at) === selectedDateKey)
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [appointments, selectedDateKey]
  );
  const confirmed = useMemo(() => dayAppointments.filter((a) => a.status === "confirmed"), [dayAppointments]);
  const pending   = useMemo(() => dayAppointments.filter((a) => a.status === "scheduled"), [dayAppointments]);

  // Appointments filtered for the current calendar month (for dot indicators)
  const monthAppointments = useMemo(() => {
    const year  = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    return appointments.filter((a) => {
      const d = parseApptDate(a.start_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [appointments, calendarMonth]);

  // Appointments filtered for the current week (for week summary)
  const weekAppointments = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return appointments.filter((a) => {
      const d = parseApptDate(a.start_at);
      return d >= weekStart && d < weekEnd;
    });
  }, [appointments, weekStart]);

  const monthDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offsetSundayBased = first.getDay();
    const leadingBlanks = offsetSundayBased === 0 ? 6 : offsetSundayBased - 1;
    return { daysInMonth, leadingBlanks };
  }, [calendarMonth]);

  const monthCountsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of monthAppointments) {
      const k = parseLocalDateKey(a.start_at);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [monthAppointments]);

  const weekCountsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of weekAppointments) {
      const k = parseLocalDateKey(a.start_at);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [weekAppointments]);

  const weekDaysSummary = useMemo(() => {
    const items: { date: Date; label: string; count: number; isSelected: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const label = `${SPANISH_WEEKDAYS_LONG[d.getDay()].slice(0, 3)} ${String(d.getDate()).padStart(2, "0")}`;
      items.push({
        date: d,
        label,
        count: weekCountsByKey.get(toLocalDateKey(d)) ?? 0,
        isSelected: toLocalDateKey(d) === selectedDateKey,
      });
    }
    return items;
  }, [weekStart, weekCountsByKey, selectedDateKey]);

  const headerDateLabel = `${SPANISH_WEEKDAYS_LONG[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${SPANISH_MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const calendarHeaderLabel = `${SPANISH_MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const todayKey = toLocalDateKey(today);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Agenda de Citas</h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Gestiona las citas de tus pacientes</p>
        </div>
        <Button
          onClick={openNew}
          className="h-12 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl shadow-lg shadow-[#0284C7]/20 px-6 cursor-pointer transition-colors duration-200 font-medium text-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar + week */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-base">{calendarHeaderLabel}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevMonth}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextMonth}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {WEEK_HEADERS.map((day, i) => (
                  <div key={i} className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-medium py-1">
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
                  const apptCount = monthCountsByKey.get(key) ?? 0;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      title={apptCount > 0 ? `${apptCount} ${apptCount === 1 ? "cita" : "citas"}` : undefined}
                      className={`relative aspect-square rounded-lg text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-[#0284C7] text-white shadow-lg shadow-[#0284C7]/20 font-bold"
                          : isToday
                          ? "bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#075985] dark:text-[#38BDF8] border border-[#BAE6FD] dark:border-[#0284C7]/30 font-semibold"
                          : "hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]"
                      }`}
                    >
                      <span className="leading-none">{day}</span>
                      {apptCount > 0 && (
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-[#0284C7] dark:bg-[#38BDF8]"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-base">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekDaysSummary.map((day) => (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => setSelectedDate(startOfDay(day.date))}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    day.isSelected
                      ? "bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-[#0284C7]/30"
                      : "bg-[#F8FAFC] dark:bg-[#111827] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-transparent"
                  }`}
                >
                  <span className={`text-sm ${day.isSelected ? "text-[#075985] dark:text-[#38BDF8] font-semibold" : "text-[#111827] dark:text-[#F8FAFC]"}`}>
                    {day.label}
                  </span>
                  <Badge
                    className={`border-0 ${
                      day.count > 0
                        ? "bg-[#0284C7] text-white hover:bg-[#0284C7]"
                        : "bg-[#E5E7EB] dark:bg-[#1E293B] text-[#6B7280] dark:text-gray-400 hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {day.count} {day.count === 1 ? "cita" : "citas"}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Appointments list */}
        <Card className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-base">Citas del Día</CardTitle>
              <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <CalendarIcon className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                {headerDateLabel}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="bg-[#F8FAFC] dark:bg-[#111827] border border-[#F3F4F6] dark:border-[#1E293B] p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm text-[#6B7280] dark:text-[#94A3B8] dark:data-[state=active]:text-[#F8FAFC] cursor-pointer">
                  Todas ({dayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm text-[#6B7280] dark:text-[#94A3B8] dark:data-[state=active]:text-[#F8FAFC] cursor-pointer">
                  Confirmadas ({confirmed.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm text-[#6B7280] dark:text-[#94A3B8] dark:data-[state=active]:text-[#F8FAFC] cursor-pointer">
                  Pendientes ({pending.length})
                </TabsTrigger>
              </TabsList>

              <AppointmentTab
                items={dayAppointments}
                value="all"
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNew={openNew}
                emptyLabel="No hay citas para este día."
              />
              <AppointmentTab
                items={confirmed}
                value="confirmed"
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNew={openNew}
                emptyLabel="Sin citas confirmadas."
              />
              <AppointmentTab
                items={pending}
                value="pending"
                updatingId={updatingId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNew={openNew}
                emptyLabel="Sin citas pendientes."
              />
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────── New appointment modal ─────────────── */}
      <Dialog open={showModal} onOpenChange={(open) => (open ? setShowModal(true) : closeNew())}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-2xl p-0 overflow-hidden bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center shadow-md shadow-[#0284C7]/20">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">Nueva Cita</DialogTitle>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Selecciona paciente, dentista y horario para agendar.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form id="new-appointment-form" onSubmit={handleCreate} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* 1. Datos del Paciente */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0284C7]" />
                  <span className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">
                    1. Datos del Paciente
                  </span>
                </div>
                {isNewPatientMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPatientMode(false);
                      setSaveError(null);
                    }}
                    className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    Buscar en Pacientes Existentes
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPatientMode(true);
                      setSaveError(null);
                    }}
                    className="text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:text-[#0369A1] dark:hover:text-[#7DD3FC] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Paciente Nuevo (Rápido)</span>
                  </button>
                )}
              </div>

              <Separator className="dark:bg-[#1E293B]" />

              {isNewPatientMode ? (
                /* Modo Paciente Nuevo: 2 inputs (Nombre completo y Carnet/CI opcional) */
                <div className="p-4 rounded-xl bg-[#F0F9FF]/60 dark:bg-sky-950/20 border border-[#BAE6FD] dark:border-sky-900/40 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                        Nombre Completo <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        autoFocus
                        placeholder="Ej. Juan Pérez"
                        value={quickFullName}
                        onChange={(e) => setQuickFullName(e.target.value)}
                        className="h-10 text-sm rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                        Carnet / C.I. <span className="text-[#9CA3AF] font-normal">(Opcional)</span>
                      </Label>
                      <Input
                        placeholder="Ej. 7894561 LP"
                        value={quickNationalId}
                        onChange={(e) => setQuickNationalId(e.target.value)}
                        className="h-10 text-sm rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo Paciente Existente: Selector simple */
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                    Seleccionar Paciente <span className="text-[#EF4444]">*</span>
                  </Label>
                  <Select
                    value={form.patient_id}
                    onValueChange={(v) => {
                      if (v === '__new_quick__') {
                        setIsNewPatientMode(true);
                      } else {
                        setForm((f) => ({ ...f, patient_id: v }));
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                      <SelectValue placeholder="Selecciona el paciente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] max-h-60">
                      {patientOpts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} {p.national_id ? `(CI: ${p.national_id})` : ''}
                        </SelectItem>
                      ))}
                      <div
                        onClick={() => setIsNewPatientMode(true)}
                        className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-md cursor-pointer mt-1 border-t border-[#F3F4F6] dark:border-[#1E293B]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Registrar nuevo paciente rápido</span>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator className="dark:bg-[#1E293B]" />

            {/* 2. Médico / Especialista */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#0284C7]" />
                Médico / Especialista <span className="text-[#EF4444]">*</span>
              </Label>
              <Select
                value={form.dentist_id}
                onValueChange={(v) => setForm((f) => ({ ...f, dentist_id: v }))}
              >
                <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                  <SelectValue placeholder={dentistOpts.length ? "Seleccionar médico..." : "Sin médicos asignados"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                  {dentistOpts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Dr. {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="dark:bg-[#1E293B]" />

            {/* Fecha + hora + duración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#374151] dark:text-gray-200">Fecha</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#374151] dark:text-gray-200">Hora inicio</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#374151] dark:text-gray-200">Duración</Label>
                <Select
                  value={String(form.duration_minutes)}
                  onValueChange={(v) => setForm((f) => ({ ...f, duration_minutes: Number(v) }))}
                >
                  <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    {[15, 30, 45, 60, 90, 120].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m < 60 ? `${m} min` : m === 60 ? "1 h" : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="dark:bg-[#1E293B]" />

            {/* Tratamiento + motivo */}
            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Tratamiento principal
              </Label>
              <Select
                value={form.treatment_id}
                onValueChange={(v) => {
                  const t = treatmentOpts.find((x) => x.id === v);
                  setForm((f) => ({
                    ...f,
                    treatment_id: v,
                    duration_minutes: t?.duration_minutes ?? f.duration_minutes,
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                  <SelectValue placeholder={treatmentOpts.length ? "Sin tratamiento específico" : "Sin tratamientos"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                  {treatmentOpts.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.duration_minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#9CA3AF]">
                Al elegir un tratamiento, la duración se ajusta automáticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151] dark:text-gray-200">Motivo de la consulta</Label>
              <Input
                placeholder="Ej. Revisión general, dolor en muela..."
                className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-[#374151] dark:text-gray-200">Notas internas</Label>
              <Textarea
                rows={3}
                placeholder="Información adicional para el equipo..."
                className="rounded-xl resize-none border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>

          {saveError && (
            <div className="px-6 pb-2">
              <p className="text-sm text-[#EF4444] bg-[#FEF2F2] dark:bg-red-950/40 border border-[#FECACA] dark:border-red-900/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </p>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t border-[#F3F4F6] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-[#9CA3AF]">
                Campos con <span className="text-[#EF4444]">*</span> son obligatorios
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeNew}
                  className="rounded-xl border-[#D1D5DB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="new-appointment-form"
                  disabled={saving}
                  className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl px-6 shadow-md shadow-[#0284C7]/20 cursor-pointer transition-colors duration-200"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {saving ? "Guardando..." : "Agendar Cita"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Subcomponente: tab con la lista de citas ───────────────────────────────
interface AppointmentTabProps {
  value: string;
  items: AppointmentListItem[];
  updatingId: string | null;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  emptyLabel: string;
}

function AppointmentTab({
  value,
  items,
  updatingId,
  onStatusChange,
  onDelete,
  onNew,
  emptyLabel,
}: AppointmentTabProps) {
  return (
    <TabsContent value={value} className="space-y-3">
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#1E293B] rounded-xl py-12 flex flex-col items-center gap-3 text-[#9CA3AF]">
          <CalendarIcon className="w-10 h-10 text-[#D1D5DB] dark:text-gray-600" />
          <p className="text-sm">{emptyLabel}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNew}
            className="text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1" /> Agendar cita
          </Button>
        </div>
      ) : (
        items.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            isUpdating={updatingId === a.id}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))
      )}
    </TabsContent>
  );
}

interface AppointmentCardProps {
  appointment: AppointmentListItem;
  isUpdating: boolean;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
}

function AppointmentCard({ appointment, isUpdating, onStatusChange, onDelete }: AppointmentCardProps) {
  const style = STATUS_STYLES[appointment.status] ?? STATUS_STYLES.scheduled;
  const isCancellable = appointment.status !== "cancelled" && appointment.status !== "completed";

  return (
    <div className="p-4 rounded-xl border-2 border-[#F3F4F6] dark:border-[#1E293B] hover:border-[#BAE6FD] dark:hover:border-[#0284C7]/40 bg-white dark:bg-[#111827] hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center flex-shrink-0">
            <span className="text-sm text-white font-medium">
              {initials(appointment.patient?.first_name ?? "", appointment.patient?.last_name ?? "")}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[#111827] dark:text-[#F8FAFC] font-medium truncate">
              {appointment.patient?.first_name} {appointment.patient?.last_name}
            </p>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] truncate">
              Dr. {appointment.dentist?.first_name} {appointment.dentist?.last_name}
              {appointment.notes ? ` · ${appointment.notes}` : ""}
            </p>
          </div>
        </div>
        <Badge className={`${style.bg} ${style.text} ${style.border} border flex-shrink-0`}>
          {style.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            {formatTime(appointment.start_at)} {appointment.end_at ? `– ${formatTime(appointment.end_at)}` : ""}
          </div>
          {appointment.end_at && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              {durationLabel(appointment.start_at, appointment.end_at)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={appointment.status}
            disabled={isUpdating}
            onValueChange={(v) => onStatusChange(appointment.id, v as AppointmentStatus)}
          >
            <SelectTrigger className="h-9 w-[150px] rounded-lg border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_STYLES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCancellable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => onStatusChange(appointment.id, "cancelled")}
              className="text-[#B91C1C] dark:text-red-400 hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 rounded-lg h-9 px-2 cursor-pointer"
              title="Cancelar"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUpdating}
            onClick={() => onDelete(appointment.id)}
            className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#B91C1C] dark:hover:text-red-400 hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 rounded-lg h-9 px-2 cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
