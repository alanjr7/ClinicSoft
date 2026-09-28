import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  Save,
  Printer,
  User,
  Plus,
  Loader2,
  Trash2,
  Calendar as CalendarIcon,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Pencil,
  X,
  Pill,
  ClipboardList,
  Activity,
  HeartPulse,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import Layout from '../components/Layout';

interface PatientOption { id: string; first_name: string; last_name: string; }
interface DentistInfo { id: string; first_name: string; last_name: string; }

interface ClinicalRecordListItem {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment_performed: string | null;
  observations: string | null;
  prescriptions: string | null;
  next_visit_notes: string | null;
  appointment_id?: string | null;
  created_at: string;
  dentist: DentistInfo;
}

interface PatientAllergy {
  id: string;
  allergen: string;
  severity: string | null;
  notes: string | null;
}

interface PatientMedicalCondition {
  id: string;
  condition_name: string;
  since_date: string | null;
  notes: string | null;
}

interface PatientDetail {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code?: string | null;
  allergies?: PatientAllergy[];
  medical_conditions?: PatientMedicalCondition[];
}

interface Props {
  patients: PatientOption[];
  records: ClinicalRecordListItem[];
  patient_id: string | null;
  patient_detail: PatientDetail | null;
}

ClinicalHistory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

interface FormState {
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_performed: string;
  observations: string;
  prescriptions: string;
  next_visit_notes: string;
  appointment_id: string | null;
}

function emptyForm(defaultDate?: string): FormState {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return {
    visit_date: defaultDate || `${y}-${m}-${d}`,
    chief_complaint: "",
    diagnosis: "",
    treatment_performed: "",
    observations: "",
    prescriptions: "",
    next_visit_notes: "",
    appointment_id: null,
  };
}

function extractDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "";
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
}

function parseDateParts(dateStr?: string | null): [number, number, number] | null {
  if (!dateStr) return null;
  const clean = extractDateOnly(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return [y, m, d];
    }
  }
  return null;
}

function fromRecord(r: ClinicalRecordListItem): FormState {
  return {
    visit_date: extractDateOnly(r.visit_date),
    chief_complaint: r.chief_complaint ?? "",
    diagnosis: r.diagnosis ?? "",
    treatment_performed: r.treatment_performed ?? "",
    observations: r.observations ?? "",
    prescriptions: r.prescriptions ?? "",
    next_visit_notes: r.next_visit_notes ?? "",
    appointment_id: r.appointment_id ?? null,
  };
}

function formatVisitDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parts = parseDateParts(dateStr);
  if (parts) {
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const parts = parseDateParts(dob);
  let birth: Date;
  if (parts) {
    const [y, m, d] = parts;
    birth = new Date(y, m - 1, d);
  } else {
    birth = new Date(dob);
  }
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function genderLabel(g: string | null): string {
  if (!g) return "—";
  const map: Record<string, string> = {
    M: "Masculino",
    masculino: "Masculino",
    F: "Femenino",
    femenino: "Femenino",
    other: "Otro",
    otro: "Otro",
  };
  return map[g] ?? g;
}

function joinAddress(p: { address?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }): string {
  const parts = [p.address, p.city, p.state, p.zip_code].filter((s) => s && s.trim());
  return parts.length ? parts.join(", ") : "—";
}

type ViewMode = 'view' | 'edit' | 'create';

export default function ClinicalHistory({
  patients,
  records,
  patient_id,
  patient_detail,
}: Props) {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<string>(patient_id ?? '');
  const patientDetail = patient_detail;

  // Selected record ID
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    records.length > 0 ? records[0].id : null
  );

  // View mode: 'view' (read-only), 'edit' (editing existing), 'create' (new record)
  const [viewMode, setViewMode] = useState<ViewMode>(
    records.length > 0 ? 'view' : 'create'
  );

  const [form, setForm] = useState<FormState>(
    records.length > 0 ? fromRecord(records[0]) : emptyForm()
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  // Sync selected patient when prop changes
  useEffect(() => {
    setSelectedPatient(patient_id ?? '');
  }, [patient_id]);

  // Sync selected record and form when records prop updates
  useEffect(() => {
    if (records.length > 0) {
      if (selectedRecordId) {
        const match = records.find((r) => r.id === selectedRecordId);
        if (match) {
          if (viewMode !== 'edit' && viewMode !== 'create') {
            setForm(fromRecord(match));
          }
        } else {
          setSelectedRecordId(records[0].id);
          setForm(fromRecord(records[0]));
          setViewMode('view');
        }
      } else if (viewMode === 'view') {
        setSelectedRecordId(records[0].id);
        setForm(fromRecord(records[0]));
      }
    } else {
      if (viewMode !== 'create') {
        setSelectedRecordId(null);
        setForm(emptyForm());
        setViewMode('create');
      }
    }
  }, [records]);

  // When patient changes, reload page with new patient_id
  function handlePatientChange(patientId: string) {
    setSelectedPatient(patientId);
    setSelectedRecordId(null);
    setForm(emptyForm());
    setViewMode('view');
    router.get('/clinical-history', { patient_id: patientId }, { preserveState: false });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectedPatientName = useMemo(() => {
    const p = patients.find((x) => x.id === selectedPatient);
    return p ? `${p.first_name} ${p.last_name}` : "";
  }, [patients, selectedPatient]);

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) ?? null,
    [records, selectedRecordId]
  );

  function handleField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Start creating a new record
  function handleStartNew() {
    setSelectedRecordId(null);
    setForm(emptyForm());
    setViewMode('create');
    setSaveError(null);
  }

  // Pick a record to view
  function handlePickRecord(id: string) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    setSelectedRecordId(id);
    setForm(fromRecord(r));
    setViewMode('view');
    setSaveError(null);
  }

  // Enter edit mode for the current record
  function handleStartEdit() {
    if (!selectedRecord) return;
    setForm(fromRecord(selectedRecord));
    setViewMode('edit');
    setSaveError(null);
  }

  // Cancel edit or create mode
  function handleCancel() {
    setSaveError(null);
    if (selectedRecord) {
      setForm(fromRecord(selectedRecord));
      setViewMode('view');
    } else if (records.length > 0) {
      setSelectedRecordId(records[0].id);
      setForm(fromRecord(records[0]));
      setViewMode('view');
    } else {
      setForm(emptyForm());
      setViewMode('create');
    }
  }

  function flashSuccess(msg: string) {
    setSuccessFlash(msg);
    window.setTimeout(() => setSuccessFlash(null), 3000);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setSaveError('Selecciona un paciente antes de guardar.');
      return;
    }
    setSaving(true);
    setSaveError(null);

    const body = {
      patient_id: selectedPatient,
      appointment_id: form.appointment_id || null,
      visit_date: form.visit_date,
      chief_complaint: form.chief_complaint || null,
      diagnosis: form.diagnosis || null,
      treatment_performed: form.treatment_performed || null,
      prescriptions: form.prescriptions || null,
      observations: form.observations || null,
      next_visit_notes: form.next_visit_notes || null,
    };

    if (viewMode === 'edit' && selectedRecordId) {
      router.put(`/clinical-history/${selectedRecordId}`, body, {
        onSuccess: () => {
          flashSuccess('Historia clínica actualizada correctamente.');
          setViewMode('view');
        },
        onError: () => setSaveError('No se pudo guardar los cambios. Verifica los datos.'),
        onFinish: () => setSaving(false),
      });
    } else {
      router.post('/clinical-history', body, {
        onSuccess: () => {
          flashSuccess('Nueva historia clínica creada exitosamente.');
          setViewMode('view');
        },
        onError: () => setSaveError('No se pudo crear el registro. Verifica los datos.'),
        onFinish: () => setSaving(false),
      });
    }
  }

  function handleDelete() {
    if (!selectedRecordId) return;
    if (!confirm('¿Estás seguro de eliminar permanentemente esta historia clínica?')) return;
    setSaving(true);
    router.delete(`/clinical-history/${selectedRecordId}`, {
      onSuccess: () => {
        flashSuccess('Registro eliminado correctamente.');
        if (records.length > 1) {
          const next = records.find((r) => r.id !== selectedRecordId);
          if (next) {
            setSelectedRecordId(next.id);
            setForm(fromRecord(next));
            setViewMode('view');
          }
        } else {
          handleStartNew();
        }
      },
      onError: () => setSaveError('No se pudo eliminar el registro.'),
      onFinish: () => setSaving(false),
    });
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header Principal */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-[#14B8A6]" />
            Historial Clínico
          </h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-0.5">
            Registro médico profesional y evolución clínica de pacientes
          </p>
        </div>

        {/* Global patient quick badge */}
        {selectedPatient && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#0F172A] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-sm">
            <User className="w-4 h-4 text-[#14B8A6]" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedPatientName}</span>
            {records.length > 0 && (
              <Badge className="bg-[#F0FDFA] dark:bg-[#14B8A6]/20 text-[#0F766E] dark:text-[#2DD4BF] border-none text-xs ml-1">
                {records.length} {records.length === 1 ? 'historia' : 'historias'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Flash Messages */}
      {successFlash && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/10 border border-[#99F6E4] dark:border-[#14B8A6]/30 text-[#0F766E] dark:text-[#2DD4BF] text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successFlash}</span>
        </div>
      )}
      {saveError && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-[#FEF2F2] dark:bg-red-950/40 border border-[#FECACA] dark:border-red-800/50 text-[#B91C1C] dark:text-red-400 text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{saveError}</span>
        </div>
      )}

      {/* ─── PANTALLA DIVIDIDA EN 2 PANELES (Master - Detail) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
            PANEL IZQUIERDO (Master): Paciente + Lista de Historias Clínicas
            ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          
          {/* Card: Selector de Paciente */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2 text-base font-semibold">
                <User className="w-5 h-5 text-[#14B8A6]" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <Select
                value={selectedPatient}
                onValueChange={handlePatientChange}
              >
                <SelectTrigger className="h-12 rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] focus:border-[#14B8A6] focus:ring-[#14B8A6]">
                  <SelectValue placeholder="Seleccionar o buscar paciente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC] max-h-72">
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg text-[#111827] dark:text-[#F8FAFC] focus:bg-[#F0FDFA] dark:focus:bg-[#1E293B] focus:text-[#0F766E] dark:focus:text-[#2DD4BF]">
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Card: Expediente Médico (Historias Clínicas Guardadas) */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-base font-semibold flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#14B8A6]" />
                  Expediente Médico
                  {selectedPatient && records.length > 0 && (
                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none text-xs font-semibold px-2 py-0.5">
                      {records.length}
                    </Badge>
                  )}
                </CardTitle>
                {selectedPatient && (
                  <Button
                    size="sm"
                    onClick={handleStartNew}
                    className="bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl h-9 px-3.5 cursor-pointer font-medium text-xs shadow-md shadow-[#14B8A6]/20 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nueva Historia
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {!selectedPatient ? (
                <div className="text-center text-sm text-[#9CA3AF] dark:text-[#64748B] py-12 space-y-2">
                  <User className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                  <p>Selecciona un paciente para ver sus historias clínicas guardadas.</p>
                </div>
              ) : records.length === 0 && viewMode !== 'create' ? (
                <div className="text-center text-sm text-[#9CA3AF] dark:text-[#64748B] py-10 space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                  <p>No hay historias clínicas registradas para este paciente.</p>
                  <Button
                    size="sm"
                    onClick={handleStartNew}
                    className="bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Crear primera historia
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {/* Tarjeta de Nueva Historia si está en modo creación */}
                  {viewMode === 'create' && (
                    <div className="p-3.5 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/15 border-2 border-[#14B8A6] text-sm shadow-sm transition-all animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-[#0F766E] dark:text-[#2DD4BF] font-semibold flex items-center gap-1.5 text-xs">
                          <Plus className="w-4 h-4" /> Nueva Historia Clínica
                        </p>
                        <Badge className="bg-[#14B8A6] text-white text-[10px] py-0 font-medium">En creación</Badge>
                      </div>
                      <p className="text-xs text-[#0F766E]/80 dark:text-[#2DD4BF]/80 mt-1">
                        Fecha: {formatVisitDate(form.visit_date)}
                      </p>
                    </div>
                  )}

                  {/* Listado de Historias Guardadas */}
                  {records.map((r) => {
                    const isSelected = viewMode !== 'create' && r.id === selectedRecordId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handlePickRecord(r.id)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? "border-[#14B8A6] bg-[#F0FDFA] dark:bg-[#14B8A6]/15 shadow-sm ring-1 ring-[#14B8A6]/30"
                            : "border-gray-200 dark:border-[#1E293B] hover:border-[#99F6E4] dark:hover:border-[#14B8A6]/50 bg-white dark:bg-[#0F172A]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className={`w-4 h-4 ${isSelected ? "text-[#14B8A6]" : "text-gray-400"}`} />
                            <p className={`text-sm font-semibold ${isSelected ? "text-[#0F766E] dark:text-[#2DD4BF]" : "text-[#111827] dark:text-[#F8FAFC]"}`}>
                              {formatVisitDate(r.visit_date)}
                            </p>
                          </div>
                          <Badge className="bg-gray-100 dark:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] border-none text-[11px] font-medium">
                            Dr. {r.dentist.last_name}
                          </Badge>
                        </div>

                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] line-clamp-2 mb-1 pl-5.5">
                          {r.chief_complaint || r.diagnosis || "Sin motivo registrado"}
                        </p>

                        <div className="flex items-center justify-end pl-5.5 pt-0.5">
                          <span className={`text-[11px] font-medium flex items-center gap-0.5 transition-colors ${
                            isSelected ? "text-[#0F766E] dark:text-[#2DD4BF]" : "text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                          }`}>
                            Ver detalle <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            PANEL DERECHO (Detail): Visualizador (Lectura) / Editor (SOAP Form)
            ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8">
          
          {!selectedPatient ? (
            /* Estado Vacío: Sin Paciente */
            <Card className="rounded-2xl border-dashed border-2 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0F172A]/50 shadow-none min-h-[500px] flex items-center justify-center">
              <CardContent className="py-20 flex flex-col items-center justify-center gap-3 text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[#F0FDFA] dark:bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] mb-2">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Expediente Clínico</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un paciente en el panel izquierdo para consultar sus historias clínicas guardadas o registrar una nueva consulta médica.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'view' && selectedRecord ? (
            /* =====================================================================
               MODO 1: LECTURA / CONSULTA (Ficha Médica con Imprimir & Lápiz Editar)
               ===================================================================== */
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header de la Ficha en Modo Lectura con Barra de Acciones */}
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] dark:bg-[#14B8A6]/20 border border-[#99F6E4] dark:border-[#14B8A6]/30 flex items-center justify-center text-[#0F766E] dark:text-[#2DD4BF] shrink-0">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Visita del {formatVisitDate(selectedRecord.visit_date)}
                        </h2>
                        <Badge className="bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#2DD4BF] border-none text-xs font-semibold">
                          Guardada
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-[#14B8A6]" />
                          Dr. {selectedRecord.dentist.first_name} {selectedRecord.dentist.last_name}
                        </span>
                        <span>•</span>
                        <span>Folio: #{selectedRecord.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Barra de Acciones: Imprimir, Editar (Lápiz), Eliminar */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.print()}
                      className="h-10 rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 cursor-pointer text-xs font-medium"
                    >
                      <Printer className="w-4 h-4 mr-1.5 text-gray-600 dark:text-gray-400" />
                      Imprimir
                    </Button>

                    <Button
                      type="button"
                      onClick={handleStartEdit}
                      className="h-10 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/20 px-4 cursor-pointer text-xs font-semibold transition-all hover:scale-[1.02]"
                    >
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Editar
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={saving}
                      className="h-10 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl px-3 cursor-pointer text-xs"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Grid de Secciones SOAP en Modo Lectura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Motivo de Consulta */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#14B8A6]">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Motivo de Consulta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.chief_complaint || <span className="italic text-gray-400">Sin motivo registrado.</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Diagnóstico */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                      <Activity className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Diagnóstico Clínico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.diagnosis || <span className="italic text-gray-400">Sin diagnóstico registrado.</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Tratamiento Realizado */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Tratamiento Realizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.treatment_performed || <span className="italic text-gray-400">Sin tratamiento registrado.</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* 4. Receta Médica */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                      <Pill className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Receta Médica / Prescripciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.prescriptions || <span className="italic text-gray-400">Sin prescripciones registradas.</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* 5. Observaciones */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm md:col-span-2">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Observaciones y Cuidados Especiales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.observations || <span className="italic text-gray-400">Sin observaciones adicionales.</span>}
                    </p>
                  </CardContent>
                </Card>

                {/* 6. Plan / Próxima Visita */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm md:col-span-2">
                  <CardHeader className="pb-2.5 pt-5 px-5 flex flex-row items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#14B8A6]">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Plan / Indicaciones para Próxima Visita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedRecord.next_visit_notes || <span className="italic text-gray-400">Sin indicaciones para la próxima visita.</span>}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pie de Ficha con Registro */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F172A]/80 border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <span>Registrado el {formatDateTime(selectedRecord.created_at)}</span>
                <span>Atendido por Dr. {selectedRecord.dentist.first_name} {selectedRecord.dentist.last_name}</span>
              </div>
            </div>
          ) : (
            /* =====================================================================
               MODO 2 y 3: FORMULARIO INTERACTIVO (Edición 'edit' o Creación 'create')
               ===================================================================== */
            <form id="clinical-form" onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-200">
              
              {/* Toolbar Superior del Formulario */}
              <Card className={`rounded-2xl border shadow-sm ${
                viewMode === 'create'
                  ? "bg-[#F0FDFA] dark:bg-[#14B8A6]/10 border-[#99F6E4] dark:border-[#14B8A6]/30"
                  : "bg-[#EFF6FF] dark:bg-blue-950/30 border-[#BFDBFE] dark:border-blue-900/40"
              }`}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                      viewMode === 'create' ? "bg-[#14B8A6]" : "bg-blue-600"
                    }`}>
                      {viewMode === 'create' ? <Plus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {viewMode === 'create' ? "Nueva Historia Clínica" : `Editando Historia del ${formatVisitDate(form.visit_date)}`}
                        </h2>
                        <Badge className={viewMode === 'create' ? "bg-[#14B8A6] text-white text-[10px]" : "bg-blue-600 text-white text-[10px]"}>
                          {viewMode === 'create' ? "Creación" : "Edición"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {viewMode === 'create'
                          ? "Completa la evolución clínica para registrar una nueva visita en el expediente."
                          : "Modifica los campos necesarios y guarda los cambios para actualizar la ficha."}
                      </p>
                    </div>
                  </div>

                  {/* Botones: Cancelar y Guardar */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                      className="h-10 rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 cursor-pointer text-xs font-medium"
                    >
                      <X className="w-4 h-4 mr-1.5 text-gray-500" />
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      disabled={saving}
                      className={`h-10 rounded-xl text-white px-5 cursor-pointer text-xs font-semibold transition-all shadow-md ${
                        viewMode === 'create'
                          ? "bg-[#14B8A6] hover:bg-[#0F766E] shadow-[#14B8A6]/20"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1.5" />
                      )}
                      {saving ? "Guardando..." : viewMode === 'create' ? "Crear Registro" : "Guardar Cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Metadatos: Fecha de Visita y Paciente */}
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2 text-sm font-bold">
                    <CalendarIcon className="w-4 h-4 text-[#14B8A6]" />
                    Fecha y Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Fecha de visita médica *
                      </Label>
                      <Input
                        type="date"
                        value={form.visit_date}
                        onChange={(e) => handleField("visit_date", e.target.value)}
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Paciente
                      </Label>
                      <div className="h-11 px-3.5 rounded-xl border border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#1E293B] flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        <User className="w-4 h-4 mr-2 text-[#14B8A6]" />
                        {selectedPatientName}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulario SOAP Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Motivo de Consulta */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[#14B8A6]" />
                      Motivo de Consulta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Describe el motivo principal de la consulta..."
                      value={form.chief_complaint}
                      onChange={(e) => handleField("chief_complaint", e.target.value)}
                      className="min-h-[120px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Diagnóstico */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Diagnóstico Clínico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Diagnóstico clínico, hallazgos, evaluación..."
                      value={form.diagnosis}
                      onChange={(e) => handleField("diagnosis", e.target.value)}
                      className="min-h-[120px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Tratamiento Realizado */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      Tratamiento Realizado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Describe el procedimiento o tratamiento realizado..."
                      value={form.treatment_performed}
                      onChange={(e) => handleField("treatment_performed", e.target.value)}
                      className="min-h-[120px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Receta Médica */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-purple-600" />
                      Receta Médica / Prescripciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Medicamentos recetados, dosis, horarios y duración..."
                      value={form.prescriptions}
                      onChange={(e) => handleField("prescriptions", e.target.value)}
                      className="min-h-[120px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Observaciones */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm md:col-span-2">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-amber-600" />
                      Observaciones y Cuidados Especiales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Notas adicionales, recomendaciones post-operatorias, cuidados..."
                      value={form.observations}
                      onChange={(e) => handleField("observations", e.target.value)}
                      className="min-h-[100px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Plan / Próxima Visita */}
                <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm md:col-span-2">
                  <CardHeader className="pb-2.5 pt-5 px-5">
                    <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-[#14B8A6]" />
                      Plan / Indicaciones para Próxima Visita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <Textarea
                      placeholder="Indicaciones para el siguiente control, procedimientos pendientes..."
                      value={form.next_visit_notes}
                      onChange={(e) => handleField("next_visit_notes", e.target.value)}
                      className="min-h-[80px] rounded-xl border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm focus:border-[#14B8A6] focus:ring-[#14B8A6] resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================
          Vista de impresión — sólo visible al imprimir (B&N, serif)
          ============================================================ */}
      {selectedRecord && (
        <PrintView
          record={selectedRecord}
          patient={patientDetail}
          fallbackPatientName={selectedPatientName}
          clinicName={user?.tenant_name ?? 'Clínica Dental'}
          professional={user ? `Dr. ${user.first_name} ${user.last_name}` : null}
        />
      )}
    </div>
  );
}

// ─── Print view (B&N, formato documento) ────────────────────────────────────
interface PrintViewProps {
  record: ClinicalRecordListItem;
  patient: PatientDetail | null;
  fallbackPatientName: string;
  clinicName: string;
  professional: string | null;
}

function PrintView({ record, patient, fallbackPatientName, clinicName, professional }: PrintViewProps) {
  const r = record;
  const age = calculateAge(patient?.date_of_birth ?? null);
  const fullName =
    patient ? `${patient.first_name} ${patient.last_name}` : fallbackPatientName || "—";
  const recordedBy = `Dr. ${record.dentist.first_name} ${record.dentist.last_name}`;
  const printedAt = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="print-area">
      {/* ── Cabecera ── */}
      <header
        style={{
          textAlign: "center",
          borderBottom: "2px solid #000",
          paddingBottom: "8mm",
          marginBottom: "8mm",
        }}
      >
        <div style={{ fontSize: "9pt", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          Documento clínico — Uso profesional
        </div>
        <h1
          style={{
            fontSize: "20pt",
            fontWeight: "bold",
            margin: "4mm 0 2mm",
            letterSpacing: "0.5px",
          }}
        >
          {clinicName}
        </h1>
        <div style={{ fontSize: "10pt", fontStyle: "italic" }}>
          Historial Clínico Dental
        </div>
      </header>

      {/* ── Metadatos del documento ── */}
      <table
        style={{
          width: "100%",
          fontSize: "10pt",
          marginBottom: "6mm",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "1mm 0" }}>
              <strong>Folio:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{record.id.slice(0, 8).toUpperCase()}</span>
            </td>
            <td style={{ padding: "1mm 0", textAlign: "right" }}>
              <strong>Emitido:</strong> {printedAt}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Datos del paciente ── */}
      <section className="no-break" style={{ marginBottom: "8mm" }}>
        <h2
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #000",
            paddingBottom: "1mm",
            marginBottom: "3mm",
          }}
        >
          Datos del Paciente
        </h2>
        <table style={{ width: "100%", fontSize: "11pt", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Nombre completo:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{fullName}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Fecha de nacimiento:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>
                {patient?.date_of_birth
                  ? `${formatVisitDate(patient.date_of_birth)}${age != null ? ` (${age} años)` : ""}`
                  : "—"}
              </td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Género:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{genderLabel(patient?.gender ?? null)}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Grupo sanguíneo:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{patient?.blood_type ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Teléfono:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{patient?.phone ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Correo electrónico:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{patient?.email ?? "—"}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1.5mm 4mm 1.5mm 0", verticalAlign: "top" }}>
                <strong>Domicilio:</strong>
              </td>
              <td style={{ padding: "1.5mm 0" }}>{patient ? joinAddress(patient) : "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Antecedentes médicos relevantes ── */}
      {patient && (((patient.allergies?.length ?? 0) > 0) || ((patient.medical_conditions?.length ?? 0) > 0)) && (
        <section className="no-break" style={{ marginBottom: "8mm" }}>
          <h2
            style={{
              fontSize: "12pt",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #000",
              paddingBottom: "1mm",
              marginBottom: "3mm",
            }}
          >
            Antecedentes Médicos
          </h2>
          {(patient.allergies?.length ?? 0) > 0 && (
            <div style={{ marginBottom: "3mm" }}>
              <strong>Alergias:</strong>
              <ul style={{ margin: "1mm 0 0 5mm", padding: 0 }}>
                {patient.allergies?.map((a) => (
                  <li key={a.id} style={{ marginBottom: "0.5mm" }}>
                    {a.allergen}
                    {a.severity ? ` — ${a.severity}` : ""}
                    {a.notes ? ` (${a.notes})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(patient.medical_conditions?.length ?? 0) > 0 && (
            <div>
              <strong>Condiciones médicas:</strong>
              <ul style={{ margin: "1mm 0 0 5mm", padding: 0 }}>
                {patient.medical_conditions?.map((c) => (
                  <li key={c.id} style={{ marginBottom: "0.5mm" }}>
                    {c.condition_name}
                    {c.since_date ? ` — desde ${formatVisitDate(c.since_date)}` : ""}
                    {c.notes ? ` (${c.notes})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── Datos de la visita ── */}
      <section style={{ marginBottom: "8mm" }}>
        <h2
          style={{
            fontSize: "12pt",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid #000",
            paddingBottom: "1mm",
            marginBottom: "3mm",
          }}
        >
          Registro de la Visita
        </h2>
        <table style={{ width: "100%", fontSize: "11pt", marginBottom: "3mm", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", padding: "1mm 4mm 1mm 0" }}>
                <strong>Fecha de visita:</strong>
              </td>
              <td style={{ padding: "1mm 0" }}>{formatVisitDate(record.visit_date)}</td>
            </tr>
            <tr>
              <td style={{ width: "30%", padding: "1mm 4mm 1mm 0" }}>
                <strong>Profesional tratante:</strong>
              </td>
              <td style={{ padding: "1mm 0" }}>{recordedBy}</td>
            </tr>
          </tbody>
        </table>

        <PrintField label="Motivo de consulta" value={r.chief_complaint} />
        <PrintField label="Diagnóstico" value={r.diagnosis} />
        <PrintField label="Tratamiento realizado" value={r.treatment_performed} />
        <PrintField label="Receta médica / Prescripciones" value={r.prescriptions} />
        <PrintField label="Observaciones" value={r.observations} />
        <PrintField label="Plan / Indicaciones para próxima visita" value={r.next_visit_notes} />
      </section>

      {/* ── Firma ── */}
      <section className="no-break" style={{ marginTop: "18mm" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "60%" }}></td>
              <td style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1px solid #000", paddingTop: "2mm", fontSize: "10pt" }}>
                  <strong>{professional ?? recordedBy}</strong>
                  <br />
                  Firma del profesional
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Pie de página ── */}
      <footer
        style={{
          marginTop: "12mm",
          paddingTop: "3mm",
          borderTop: "1px solid #000",
          fontSize: "8.5pt",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Documento generado por {clinicName}. La información contenida es confidencial y de uso médico exclusivo.
      </footer>
    </section>
  );
}

function PrintField({ label, value }: { label: string; value?: string | null }) {
  const text = value && value.trim() ? value : "Sin información registrada.";
  return (
    <div className="no-break" style={{ marginBottom: "4mm" }}>
      <div style={{ fontSize: "10.5pt", fontWeight: "bold", marginBottom: "1mm" }}>{label}</div>
      <div
        style={{
          fontSize: "11pt",
          whiteSpace: "pre-wrap",
          textAlign: "justify",
          borderLeft: "2px solid #000",
          paddingLeft: "3mm",
          color: value && value.trim() ? "#000" : "#555",
          fontStyle: value && value.trim() ? "normal" : "italic",
        }}
      >
        {text}
      </div>
    </div>
  );
}
