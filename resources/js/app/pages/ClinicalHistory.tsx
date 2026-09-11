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
  ChevronDown,
  Scale,
  Thermometer,
  Wind,
  Droplets,
  Search,
  Clock,
  Sparkles,
  FileDown
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
import type { PrescriptionItem } from '../../types';

interface PatientOption { id: string; first_name: string; last_name: string; }
interface DoctorInfo { id: string; first_name: string; last_name: string; }

interface ClinicalRecordListItem {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment_performed: string | null;
  observations: string | null;
  prescriptions: string | null;
  prescription_items?: PrescriptionItem[] | null;
  next_visit_notes: string | null;
  appointment_id?: string | null;
  blood_pressure?: string | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | string | null;
  weight?: number | string | null;
  height?: number | string | null;
  bmi?: number | string | null;
  oxygen_saturation?: number | null;
  blood_glucose?: number | null;
  medical_background?: string | null;
  physical_examination?: string | null;
  created_at: string;
  dentist: DoctorInfo;
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
  national_id?: string | null;
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
  appointments?: { id: string; start_at: string; reason: string | null }[];
}

ClinicalHistory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

interface FormState {
  visit_date: string;
  blood_pressure: string;
  heart_rate: string;
  respiratory_rate: string;
  temperature: string;
  weight: string;
  height: string;
  bmi: string;
  oxygen_saturation: string;
  blood_glucose: string;
  chief_complaint: string;
  medical_background: string;
  physical_examination: string;
  diagnosis: string;
  treatment_performed: string;
  observations: string;
  prescriptions: string;
  prescription_items: PrescriptionItem[];
  next_visit_notes: string;
  appointment_id: string | null;
}

function getTodayString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyForm(defaultDate?: string): FormState {
  return {
    visit_date: defaultDate || getTodayString(),
    blood_pressure: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    weight: "",
    height: "",
    bmi: "",
    oxygen_saturation: "",
    blood_glucose: "",
    chief_complaint: "",
    medical_background: "",
    physical_examination: "",
    diagnosis: "",
    treatment_performed: "",
    observations: "",
    prescriptions: "",
    prescription_items: [],
    next_visit_notes: "",
    appointment_id: null,
  };
}

function computeBmi(weightStr: string, heightStr: string): string {
  const w = parseFloat(weightStr);
  const h = parseFloat(heightStr);
  if (!w || !h || h <= 0) return "";
  const heightInM = h / 100;
  const bmiVal = w / (heightInM * heightInM);
  return bmiVal > 0 && isFinite(bmiVal) ? bmiVal.toFixed(1) : "";
}

function getBmiStatus(bmiStr: string): { label: string; color: string } | null {
  const bmi = parseFloat(bmiStr);
  if (!bmi || isNaN(bmi)) return null;
  if (bmi < 18.5) return { label: "Bajo peso", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300" };
  if (bmi <= 24.9) return { label: "Normopeso", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300" };
  if (bmi <= 29.9) return { label: "Sobrepeso", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300" };
  if (bmi <= 34.9) return { label: "Obesidad Grado I", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300" };
  return { label: "Obesidad Grado II/III", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300" };
}

export default function ClinicalHistory({
  patients = [],
  records = [],
  patient_id,
  patient_detail,
  appointments = []
}: Props) {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patient_id || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  // Update selected patient when prop changes
  useEffect(() => {
    if (patient_id) {
      setSelectedPatientId(patient_id);
    }
  }, [patient_id]);

  // Recalculate BMI when weight or height changes
  const handleWeightHeightChange = (field: 'weight' | 'height', val: string) => {
    const updated = { ...form, [field]: val };
    const calculatedBmi = computeBmi(
      field === 'weight' ? val : form.weight,
      field === 'height' ? val : form.height
    );
    updated.bmi = calculatedBmi;
    setForm(updated);
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const term = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term)
    );
  }, [patients, patientSearch]);

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    setEditingRecordId(null);
    setForm(emptyForm());
    router.get('/clinical-history', { patient_id: id }, { preserveState: true, preserveScroll: true });
  };

  const handleStartNewRecord = () => {
    setEditingRecordId(null);
    setForm(emptyForm());
  };

  const handleEditRecord = (record: ClinicalRecordListItem) => {
    setEditingRecordId(record.id);
    setForm({
      visit_date: record.visit_date ? record.visit_date.substring(0, 10) : getTodayString(),
      blood_pressure: record.blood_pressure || "",
      heart_rate: record.heart_rate ? String(record.heart_rate) : "",
      respiratory_rate: record.respiratory_rate ? String(record.respiratory_rate) : "",
      temperature: record.temperature ? String(record.temperature) : "",
      weight: record.weight ? String(record.weight) : "",
      height: record.height ? String(record.height) : "",
      bmi: record.bmi ? String(record.bmi) : "",
      oxygen_saturation: record.oxygen_saturation ? String(record.oxygen_saturation) : "",
      blood_glucose: record.blood_glucose ? String(record.blood_glucose) : "",
      chief_complaint: record.chief_complaint || "",
      medical_background: record.medical_background || "",
      physical_examination: record.physical_examination || "",
      diagnosis: record.diagnosis || "",
      treatment_performed: record.treatment_performed || "",
      observations: record.observations || "",
      prescriptions: record.prescriptions || "",
      prescription_items: Array.isArray(record.prescription_items) ? record.prescription_items : [],
      next_visit_notes: record.next_visit_notes || "",
      appointment_id: record.appointment_id || null,
    });
    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta consulta médica?')) {
      router.delete(`/clinical-history/${id}`, {
        onSuccess: () => {
          if (editingRecordId === id) {
            handleStartNewRecord();
          }
        }
      });
    }
  };

  // Prescription builder helpers
  const handleAddMedication = () => {
    setForm(prev => ({
      ...prev,
      prescription_items: [
        ...prev.prescription_items,
        { name: '', presentation: '', dose: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const handleUpdateMedication = (index: number, key: keyof PrescriptionItem, val: string) => {
    setForm(prev => {
      const items = [...prev.prescription_items];
      items[index] = { ...items[index], [key]: val };
      return { ...prev, prescription_items: items };
    });
  };

  const handleRemoveMedication = (index: number) => {
    setForm(prev => ({
      ...prev,
      prescription_items: prev.prescription_items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setIsSubmitting(true);
    const payload: any = {
      patient_id: selectedPatientId,
      visit_date: form.visit_date,
      blood_pressure: form.blood_pressure || null,
      heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
      respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      bmi: form.bmi ? parseFloat(form.bmi) : null,
      oxygen_saturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
      blood_glucose: form.blood_glucose ? parseInt(form.blood_glucose) : null,
      chief_complaint: form.chief_complaint || null,
      medical_background: form.medical_background || null,
      physical_examination: form.physical_examination || null,
      diagnosis: form.diagnosis || null,
      treatment_performed: form.treatment_performed || null,
      observations: form.observations || null,
      prescriptions: form.prescriptions || null,
      prescription_items: form.prescription_items.length > 0 ? form.prescription_items : null,
      next_visit_notes: form.next_visit_notes || null,
      appointment_id: form.appointment_id || null,
    };

    if (editingRecordId) {
      router.put(`/clinical-history/${editingRecordId}`, payload, {
        onSuccess: () => {
          setIsSubmitting(false);
          setEditingRecordId(null);
          setForm(emptyForm());
        },
        onError: () => setIsSubmitting(false)
      });
    } else {
      router.post('/clinical-history', payload, {
        onSuccess: () => {
          setIsSubmitting(false);
          setForm(emptyForm());
        },
        onError: () => setIsSubmitting(false)
      });
    }
  };

  const bmiStatus = getBmiStatus(form.bmi);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-600/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultas y Evoluciones Médicas</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Registro clínico integral, somatometría, signos vitales y generación de recetas médicas
              </p>
            </div>
          </div>
        </div>

        {selectedPatientId && (
          <div className="flex items-center gap-2">
            <a
              href={`/patients/${selectedPatientId}/clinical-pdf?preview=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Expediente Completo (PDF)</span>
            </a>
          </div>
        )}
      </div>

      {/* Patient Selector Card */}
      <Card className="border-sky-100 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:w-80">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 block">
                Seleccionar Paciente
              </Label>
              <Select value={selectedPatientId} onValueChange={handlePatientSelect}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Buscar paciente en el padrón..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                      <Input
                        placeholder="Filtrar por nombre..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-xs text-center text-gray-400">No se encontraron pacientes</div>
                  ) : (
                    filteredPatients.map(p => (
                      <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {patient_detail && (
              <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    {patient_detail.first_name[0]}{patient_detail.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                      {patient_detail.first_name} {patient_detail.last_name}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {patient_detail.national_id && <span>CI: {patient_detail.national_id}</span>}
                      {patient_detail.date_of_birth && <span>• F. Nac: {patient_detail.date_of_birth}</span>}
                      {patient_detail.phone && <span>• Tel: {patient_detail.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {patient_detail.blood_type && (
                    <Badge className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200">
                      🩸 {patient_detail.blood_type}
                    </Badge>
                  )}

                  {patient_detail.allergies && patient_detail.allergies.length > 0 && (
                    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200">
                      ⚠ {patient_detail.allergies.length} Alergia(s)
                    </Badge>
                  )}

                  {patient_detail.medical_conditions && patient_detail.medical_conditions.length > 0 && (
                    <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200">
                      🏥 {patient_detail.medical_conditions.length} Patología(s)
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatientId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column (Left / Main) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-sky-200/80 dark:border-slate-800 shadow-md">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-900 border-b border-sky-100 dark:border-slate-800 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                      {editingRecordId ? 'Editar Consulta Médica' : 'Nueva Consulta Médica / Evolución'}
                    </CardTitle>
                  </div>
                  {editingRecordId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartNewRecord}
                      className="text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Consulta
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Fecha de Visita & Cita Vinculada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="visit_date" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Fecha de la Consulta *
                      </Label>
                      <Input
                        id="visit_date"
                        type="date"
                        required
                        value={form.visit_date}
                        onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                        className="mt-1 h-9"
                      />
                    </div>

                    {appointments.length > 0 && (
                      <div>
                        <Label htmlFor="appointment_id" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Vincular con Cita de Agenda (Opcional)
                        </Label>
                        <Select
                          value={form.appointment_id || 'none'}
                          onValueChange={(val) => setForm({ ...form, appointment_id: val === 'none' ? null : val })}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Seleccionar cita..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin cita vinculada</SelectItem>
                            {appointments.map(a => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.start_at.substring(0, 16).replace('T', ' ')} — {a.reason || 'Cita general'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* ── 1. Somatometría y Signos Vitales ── */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-red-500" />
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          Signos Vitales y Somatometría (Triaje)
                        </h3>
                      </div>
                      {bmiStatus && (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiStatus.color}`}>
                          IMC: {form.bmi} ({bmiStatus.label})
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* P. Arterial */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Presión Arterial (PA)
                        </Label>
                        <Input
                          placeholder="120/80"
                          value={form.blood_pressure}
                          onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* FC */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Frec. Cardíaca (FC)
                        </Label>
                        <Input
                          type="number"
                          placeholder="75 bpm"
                          value={form.heart_rate}
                          onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* FR */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Frec. Resp. (FR)
                        </Label>
                        <Input
                          type="number"
                          placeholder="18 rpm"
                          value={form.respiratory_rate}
                          onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* Temp */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Temperatura (°C)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="36.5"
                          value={form.temperature}
                          onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* Peso */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Peso (kg)
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="70.5"
                          value={form.weight}
                          onChange={(e) => handleWeightHeightChange('weight', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* Talla */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Talla (cm)
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="175"
                          value={form.height}
                          onChange={(e) => handleWeightHeightChange('height', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* Sat O2 */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Sat. Oxígeno (SpO2)
                        </Label>
                        <Input
                          type="number"
                          placeholder="98 %"
                          value={form.oxygen_saturation}
                          onChange={(e) => setForm({ ...form, oxygen_saturation: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      {/* Glucosa */}
                      <div>
                        <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          Glucemia (mg/dL)
                        </Label>
                        <Input
                          type="number"
                          placeholder="95"
                          value={form.blood_glucose}
                          onChange={(e) => setForm({ ...form, blood_glucose: e.target.value })}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── 2. Evaluación Clínica ── */}
                  <div className="space-y-4">
                    {/* Motivo de Consulta */}
                    <div>
                      <Label htmlFor="chief_complaint" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Motivo de Consulta y Enfermedad Actual
                      </Label>
                      <Textarea
                        id="chief_complaint"
                        rows={2}
                        placeholder="Describa el motivo principal de la consulta, tiempo de evolución y sintomatología..."
                        value={form.chief_complaint}
                        onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                        className="mt-1 text-xs resize-y"
                      />
                    </div>

                    {/* Antecedentes Clínicos Relevantes */}
                    <div>
                      <Label htmlFor="medical_background" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Antecedentes Patológicos / Relevantes
                      </Label>
                      <Textarea
                        id="medical_background"
                        rows={2}
                        placeholder="Antecedentes quirúrgicos, familiares, tratamientos crónicos..."
                        value={form.medical_background}
                        onChange={(e) => setForm({ ...form, medical_background: e.target.value })}
                        className="mt-1 text-xs resize-y"
                      />
                    </div>

                    {/* Examen Físico */}
                    <div>
                      <Label htmlFor="physical_examination" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Examen Físico y Hallazgos Clínicos
                      </Label>
                      <Textarea
                        id="physical_examination"
                        rows={2}
                        placeholder="Hallazgos por sistemas: cabeza/cuello, cardiopulmonar, abdomen, extremidades, neurológico..."
                        value={form.physical_examination}
                        onChange={(e) => setForm({ ...form, physical_examination: e.target.value })}
                        className="mt-1 text-xs resize-y"
                      />
                    </div>

                    {/* Diagnóstico Principal */}
                    <div>
                      <Label htmlFor="diagnosis" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Diagnóstico Clínico / CIE-10 *
                      </Label>
                      <Input
                        id="diagnosis"
                        placeholder="Ej. Faringoamigdalitis aguda (J03.9), Hipertensión arterial esencial (I10)..."
                        value={form.diagnosis}
                        onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                        className="mt-1 font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Procedimiento o Tratamiento Realizado en Consulta */}
                    <div>
                      <Label htmlFor="treatment_performed" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Procedimiento / Conducta Médica en Consultorio
                      </Label>
                      <Input
                        id="treatment_performed"
                        placeholder="Ej. Nebulización realizada, curación plana, sutura con nylon 4-0, infiltración..."
                        value={form.treatment_performed}
                        onChange={(e) => setForm({ ...form, treatment_performed: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* ── 3. Receta Médica Estructurada ── */}
                  <div className="bg-sky-50/50 dark:bg-slate-900/60 p-4 rounded-xl border border-sky-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          Receta Médica y Prescripción Farmacológica (Rp.)
                        </h3>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddMedication}
                        className="h-7 text-xs bg-white dark:bg-slate-800 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Medicamento
                      </Button>
                    </div>

                    {form.prescription_items.length > 0 ? (
                      <div className="space-y-3">
                        {form.prescription_items.map((med, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800/90 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                              title="Quitar medicamento"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                              <div>
                                <Label className="text-[10px] text-gray-500">Medicamento</Label>
                                <Input
                                  placeholder="Ej. Amoxicilina + Ác. Clavulánico"
                                  value={med.name}
                                  onChange={(e) => handleUpdateMedication(idx, 'name', e.target.value)}
                                  className="h-7 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">Presentación / Vía</Label>
                                <Input
                                  placeholder="Ej. Comp. 875/125mg Vía Oral"
                                  value={med.presentation || ''}
                                  onChange={(e) => handleUpdateMedication(idx, 'presentation', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">Dosis</Label>
                                <Input
                                  placeholder="Ej. 1 comprimido"
                                  value={med.dose || ''}
                                  onChange={(e) => handleUpdateMedication(idx, 'dose', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <Label className="text-[10px] text-gray-500">Frecuencia</Label>
                                <Input
                                  placeholder="Ej. Cada 12 horas"
                                  value={med.frequency || ''}
                                  onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">Duración</Label>
                                <Input
                                  placeholder="Ej. Por 7 días"
                                  value={med.duration || ''}
                                  onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">Instrucciones Adicionales</Label>
                                <Input
                                  placeholder="Ej. Tomar con alimentos"
                                  value={med.instructions || ''}
                                  onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="prescriptions" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          O escriba la prescripción en texto libre:
                        </Label>
                        <Textarea
                          id="prescriptions"
                          rows={3}
                          placeholder="Paracetamol 500mg: 1 comprimido cada 8 horas por 3 días si hay dolor o fiebre..."
                          value={form.prescriptions}
                          onChange={(e) => setForm({ ...form, prescriptions: e.target.value })}
                          className="mt-1 text-xs bg-white dark:bg-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* ── 4. Indicaciones y Próximo Control ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="observations" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Indicaciones Generales y Cuidados
                      </Label>
                      <Textarea
                        id="observations"
                        rows={2}
                        placeholder="Hidratación abundante, reposo relativo por 48h, dieta blanda..."
                        value={form.observations}
                        onChange={(e) => setForm({ ...form, observations: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="next_visit_notes" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Próximo Control / Cita de Seguimiento
                      </Label>
                      <Textarea
                        id="next_visit_notes"
                        rows={2}
                        placeholder="Control en 7 días con resultado de hemograma, o SOS en caso de alarma..."
                        value={form.next_visit_notes}
                        onChange={(e) => setForm({ ...form, next_visit_notes: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {editingRecordId && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleStartNewRecord}
                        disabled={isSubmitting}
                        className="text-xs"
                      >
                        Cancelar Edición
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 h-10 shadow-md shadow-sky-600/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingRecordId ? 'Actualizar Consulta' : 'Guardar Consulta Médica'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Column (Right) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Historial de Consultas ({records.length})</span>
              </h3>
            </div>

            {records.length === 0 ? (
              <Card className="border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <CardContent className="p-6 text-center text-xs text-gray-400">
                  No hay consultas registradas para este paciente. Complete el formulario para registrar la primera visita.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => {
                  const isExpanded = expandedRecordId === rec.id;
                  const isBeingEdited = editingRecordId === rec.id;

                  return (
                    <Card
                      key={rec.id}
                      className={`border transition-all duration-200 ${
                        isBeingEdited
                          ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/20 shadow-md ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="p-3.5 space-y-2">
                        {/* Header card info */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white block">
                              {rec.visit_date ? rec.visit_date.substring(0, 10) : 'Fecha sin definir'}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              Dr(a). {rec.dentist ? `${rec.dentist.first_name} ${rec.dentist.last_name}` : 'Médico'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Prescription PDF Link */}
                            <a
                              href={`/clinical-records/${rec.id}/prescription-pdf?preview=1`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-sky-600 hover:text-sky-800 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Imprimir Receta Médica"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleEditRecord(rec)}
                              className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Editar Consulta"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                              title="Eliminar Consulta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Vital signs badge pills */}
                        {(rec.blood_pressure || rec.temperature || rec.heart_rate || rec.weight || rec.bmi) && (
                          <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 dark:text-slate-300">
                            {rec.blood_pressure && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                PA: {rec.blood_pressure}
                              </span>
                            )}
                            {rec.heart_rate && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                FC: {rec.heart_rate}bpm
                              </span>
                            )}
                            {rec.temperature && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                T: {rec.temperature}°C
                              </span>
                            )}
                            {rec.weight && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                {rec.weight}kg
                              </span>
                            )}
                            {rec.bmi && (
                              <span className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                IMC {rec.bmi}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Diagnóstico */}
                        {rec.diagnosis && (
                          <div className="text-xs bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-sky-700 dark:text-sky-300 block text-[11px]">
                              Dx: {rec.diagnosis}
                            </span>
                            {rec.chief_complaint && (
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                                {rec.chief_complaint}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Toggle expand */}
                        <button
                          onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                          className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer pt-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> Menos detalles
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-3.5 h-3.5" /> Ver consulta completa
                            </>
                          )}
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                            {rec.physical_examination && (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-gray-500 block">Examen Físico:</span>
                                <p className="text-[11px]">{rec.physical_examination}</p>
                              </div>
                            )}

                            {rec.treatment_performed && (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-gray-500 block">Procedimiento:</span>
                                <p className="text-[11px]">{rec.treatment_performed}</p>
                              </div>
                            )}

                            {(rec.prescription_items && rec.prescription_items.length > 0) ? (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-sky-600 dark:text-sky-400 block">Receta Médica:</span>
                                <div className="space-y-1 mt-0.5">
                                  {rec.prescription_items.map((item, i) => (
                                    <div key={i} className="text-[11px] bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                                      <strong>{item.name}</strong> - {item.dose} ({item.frequency}) x {item.duration}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : rec.prescriptions && (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-sky-600 dark:text-sky-400 block">Receta Médica:</span>
                                <p className="text-[11px] whitespace-pre-line">{rec.prescriptions}</p>
                              </div>
                            )}

                            {rec.observations && (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-gray-500 block">Indicaciones:</span>
                                <p className="text-[11px]">{rec.observations}</p>
                              </div>
                            )}

                            {rec.next_visit_notes && (
                              <div>
                                <span className="font-bold text-[10px] uppercase text-gray-500 block">Próximo Control:</span>
                                <p className="text-[11px]">{rec.next_visit_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center mx-auto font-bold">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white">Seleccione un Paciente</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Elija un paciente en el menú superior para visualizar su historial clínico completo, signos vitales históricos o crear una nueva consulta médica.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
