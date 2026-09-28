import { useState } from "react";
import { router } from "@inertiajs/react";
import {
  Search,
  Plus,
  Phone,
  Calendar,
  Activity,
  Trash2,
  AlertTriangle,
  Pill,
  User,
  Heart,
  Mail,
  MapPin,
  CheckCircle,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Layout from "../components/Layout";
import {
  PatientCreateInput,
  AllergyInput,
  MedicalConditionInput,
  EmergencyContactInput,
} from "../../lib/patients";

interface PatientListItem {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  patients: PatientListItem[];
  filters?: { search?: string };
}

Patients.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

const EMPTY_ALLERGY: AllergyInput = { allergen: "", severity: "", notes: "" };
const EMPTY_CONDITION: MedicalConditionInput = { condition_name: "", since_date: "", notes: "" };
const EMPTY_CONTACT: EmergencyContactInput = { name: "", relationship_type: "", phone: "" };

const EMPTY_FORM: PatientCreateInput = {
  first_name: "",
  last_name: "",
  national_id: null,
  date_of_birth: null,
  gender: null,
  blood_type: null,
  phone: null,
  email: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  notes: null,
  allergies: [],
  medical_conditions: [],
  emergency_contacts: [],
};

type Section = "personal" | "medical" | "contacts";

export default function Patients({ patients, filters }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters?.search ?? "");
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("personal");
  const [form, setForm] = useState<PatientCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<PatientListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleDeletePatient() {
    if (!patientToDelete) return;
    setDeleting(true);
    router.delete(`/patients/${patientToDelete.id}`, {
      onSuccess: () => {
        setPatientToDelete(null);
      },
      onFinish: () => setDeleting(false),
      preserveScroll: true,
    });
  }

  // Search: use Inertia router to reload page with new search param
  function handleSearch(value: string) {
    setSearchTerm(value);
    router.get('/patients', { search: value }, { preserveState: true, replace: true });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const payload = {
      ...form,
      allergies: form.allergies.filter((a) => a.allergen.trim()),
      medical_conditions: form.medical_conditions.filter((c) => c.condition_name.trim()),
      emergency_contacts: form.emergency_contacts.filter(
        (ec) => ec.name.trim() && ec.phone.trim()
      ),
    };
    router.post('/patients', payload, {
      onSuccess: () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setActiveSection("personal");
      },
      onError: () => {
        setSaveError("Ocurrió un error al guardar el paciente. Verifica los datos.");
      },
      onFinish: () => setSaving(false),
    });
  }

  function handleCloseModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setActiveSection("personal");
  }

  // ---- Allergies ----
  const addAllergy = () =>
    setForm((f) => ({ ...f, allergies: [...f.allergies, { ...EMPTY_ALLERGY }] }));
  const updateAllergy = (i: number, patch: Partial<AllergyInput>) =>
    setForm((f) => ({
      ...f,
      allergies: f.allergies.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  const removeAllergy = (i: number) =>
    setForm((f) => ({ ...f, allergies: f.allergies.filter((_, idx) => idx !== i) }));

  // ---- Medical conditions ----
  const addCondition = () =>
    setForm((f) => ({
      ...f,
      medical_conditions: [...f.medical_conditions, { ...EMPTY_CONDITION }],
    }));
  const updateCondition = (i: number, patch: Partial<MedicalConditionInput>) =>
    setForm((f) => ({
      ...f,
      medical_conditions: f.medical_conditions.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c
      ),
    }));
  const removeCondition = (i: number) =>
    setForm((f) => ({
      ...f,
      medical_conditions: f.medical_conditions.filter((_, idx) => idx !== i),
    }));

  // ---- Emergency contacts ----
  const addContact = () =>
    setForm((f) => ({
      ...f,
      emergency_contacts: [...f.emergency_contacts, { ...EMPTY_CONTACT }],
    }));
  const updateContact = (i: number, patch: Partial<EmergencyContactInput>) =>
    setForm((f) => ({
      ...f,
      emergency_contacts: f.emergency_contacts.map((ec, idx) =>
        idx === i ? { ...ec, ...patch } : ec
      ),
    }));
  const removeContact = (i: number) =>
    setForm((f) => ({
      ...f,
      emergency_contacts: f.emergency_contacts.filter((_, idx) => idx !== i),
    }));

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getInitials(fn?: string | null, ln?: string | null) {
    const f = (fn || "").trim();
    const l = (ln || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) {
      const parts = f.split(/\s+/);
      return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : f.slice(0, 2).toUpperCase();
    }
    if (l) return l.slice(0, 2).toUpperCase();
    return "P";
  }

  const personalComplete = form.first_name.trim() !== "" && form.last_name.trim() !== "";
  const medicalCount = form.allergies.length + form.medical_conditions.length;
  const contactCount = form.emergency_contacts.length;

  const sidebarSections = [
    {
      id: "personal" as Section,
      label: "Datos Personales",
      sublabel: "Nombre, contacto y dirección",
      icon: User,
      badge: personalComplete ? "ok" : null,
      count: null,
    },
    {
      id: "medical" as Section,
      label: "Info Médica",
      sublabel: "Alergias y condiciones",
      icon: Heart,
      badge: null,
      count: medicalCount || null,
    },
    {
      id: "contacts" as Section,
      label: "Contactos Emergencia",
      sublabel: "Personas de contacto",
      icon: Phone,
      badge: null,
      count: contactCount || null,
    },
  ];

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Gestión de Pacientes</h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Administra la información de tus pacientes</p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
          <Input
            type="text"
            placeholder="Buscar paciente por nombre o email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-11 h-12 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#6B7280] dark:placeholder:text-[#94A3B8] focus:border-[#0284C7] focus:ring-[#0284C7]"
          />
        </div>
        <Button
          className="h-12 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl shadow-lg shadow-[#0284C7]/20 px-6 cursor-pointer transition-colors duration-200 font-medium text-sm"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B7280] dark:text-[#94A3B8]">
            <p className="mb-4 text-sm">
              {searchTerm
                ? `Sin resultados para "${searchTerm}"`
                : "No hay pacientes registrados aún."}
            </p>
            {!searchTerm && (
              <Button
                size="sm"
                className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl cursor-pointer"
                onClick={() => setShowModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar primer paciente
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#111827]">
                <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Nombre</TableHead>
                <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Teléfono</TableHead>
                <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Registro</TableHead>
                <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Estado</TableHead>
                <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 cursor-pointer transition-colors duration-150"
                  onClick={() => router.visit(`/patients/${patient.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm text-white font-medium">
                          {getInitials(patient.first_name, patient.last_name)}
                        </span>
                      </div>
                      <span className="text-[#111827] dark:text-[#F8FAFC] font-medium">
                        {patient.first_name} {patient.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]">
                      <Phone className="w-4 h-4" />
                      {patient.phone ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]">
                      <Calendar className="w-4 h-4" />
                      {formatDate(patient.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-lg border-0 ${
                        patient.is_active
                          ? "bg-[#F0F9FF] dark:bg-[#0284C7]/20 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/20"
                          : "bg-[#F3F4F6] dark:bg-[#1E293B] text-[#6B7280] dark:text-gray-300 hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B]"
                      }`}
                    >
                      {patient.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0284C7] dark:text-[#38BDF8] hover:text-[#075985] dark:hover:text-[#7DD3FC] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 rounded-lg cursor-pointer"
                        onClick={() => router.visit(`/patients/${patient.id}`)}
                      >
                        <Activity className="w-4 h-4 mr-1.5" />
                        Ver perfil
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer p-2 h-auto"
                        onClick={() => setPatientToDelete(patient)}
                        title="Eliminar paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {patients.length > 0 && (
        <div className="mt-6 text-sm text-[#6B7280] dark:text-[#94A3B8]">
          {patients.length} paciente{patients.length !== 1 ? "s" : ""} encontrado
          {patients.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* ===========================
          NEW PATIENT MODAL — Redesigned
      =========================== */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="w-[95vw] sm:w-[90vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] sm:h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">

          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B] pr-12 sm:pr-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center shrink-0 shadow-md shadow-[#0284C7]/20">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold sm:font-semibold text-[#111827] dark:text-[#F8FAFC]">Registrar Nuevo Paciente</DialogTitle>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Completa la información del paciente. Solo nombre y apellido son obligatorios.
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Mobile Navigation Tabs */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B] shrink-0 no-scrollbar">
            {sidebarSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 border ${
                    isActive
                      ? "bg-white dark:bg-[#0F172A] shadow-sm border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8]"
                      : "bg-white/60 dark:bg-[#0F172A]/60 border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-white dark:hover:bg-[#0F172A]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#0284C7] dark:text-[#38BDF8]" : "text-[#9CA3AF]"}`} />
                  <span>{section.label}</span>
                  {section.badge === "ok" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : section.count ? (
                    <span className="px-1.5 py-0.5 bg-[#0284C7] text-white text-[10px] leading-none rounded font-bold">
                      {section.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Body — sidebar + content */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">

            {/* ---- Left Sidebar (Desktop) ---- */}
            <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#F8FAFC] dark:bg-[#111827] border-r border-[#F3F4F6] dark:border-[#1E293B] flex-col py-4 px-3">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-3 mb-3">
                Secciones
              </p>

              <nav className="flex flex-col gap-1">
                {sidebarSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? "bg-white dark:bg-[#0F172A] shadow-sm border border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]"
                          : "text-[#6B7280] dark:text-[#94A3B8] hover:bg-white/60 dark:hover:bg-[#0F172A]/60 hover:text-[#374151] dark:hover:text-gray-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive
                            ? "bg-[#0284C7] text-white"
                            : "bg-[#E5E7EB] dark:bg-[#1E293B] text-[#9CA3AF] group-hover:bg-[#E0F2FE] dark:group-hover:bg-[#0284C7]/20 group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-[#111827] dark:text-[#F8FAFC]" : ""}`}>
                          {section.label}
                        </p>
                        <p className="text-xs text-[#9CA3AF] truncate">{section.sublabel}</p>
                      </div>
                      {section.badge === "ok" ? (
                        <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      ) : section.count ? (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-[#0284C7] text-white text-xs rounded flex items-center justify-center font-bold">
                          {section.count}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive ? "text-[#0284C7] dark:text-[#38BDF8] translate-x-0.5" : "text-[#D1D5DB] dark:text-gray-600"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Quick summary */}
              <div className="mt-auto px-3 pt-4">
                <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#374151] dark:text-gray-200">Resumen</p>
                  <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    <div className="flex justify-between">
                      <span>Alergias</span>
                      <span className="font-medium text-[#374151] dark:text-gray-200">{form.allergies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Condiciones</span>
                      <span className="font-medium text-[#374151] dark:text-gray-200">{form.medical_conditions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contactos</span>
                      <span className="font-medium text-[#374151] dark:text-gray-200">{form.emergency_contacts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* ---- Main Form Content ---- */}
            <form
              id="new-patient-form"
              onSubmit={handleCreate}
              className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6"
            >
              {/* === PERSONAL DATA === */}
              {activeSection === "personal" && (
                <div className="space-y-6">
                  {/* Section header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
                    <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#111827] dark:text-[#F8FAFC]">Datos Personales</h2>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Información de identificación del paciente</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="text-xs font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-3">
                      Nombre Completo
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name" className="text-sm text-[#374151] dark:text-gray-200">
                          Nombre <span className="text-[#EF4444]">*</span>
                        </Label>
                        <Input
                          id="first_name"
                          required
                          placeholder="Ej. María"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name" className="text-sm text-[#374151] dark:text-gray-200">
                          Apellido <span className="text-[#EF4444]">*</span>
                        </Label>
                        <Input
                          id="last_name"
                          required
                          placeholder="Ej. González"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <Label htmlFor="national_id" className="text-sm text-[#374151] dark:text-gray-200">
                        C.I. / Documento de Identidad
                      </Label>
                      <Input
                        id="national_id"
                        placeholder="Ej. 1234567"
                        className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                        value={form.national_id ?? ""}
                        onChange={(e) => setForm({ ...form, national_id: e.target.value || null })}
                      />
                    </div>
                  </div>

                  <Separator className="dark:bg-[#1E293B]" />

                  {/* Contact */}
                  <div>
                    <p className="text-xs font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-3">
                      Contacto
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Teléfono
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+591 712 34567"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.phone ?? ""}
                          onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.email ?? ""}
                          onChange={(e) => setForm({ ...form, email: e.target.value || null })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-[#1E293B]" />

                  {/* Bio */}
                  <div>
                    <p className="text-xs font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-3">
                      Datos Biográficos
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="dob" className="text-sm text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Fecha de Nacimiento
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.date_of_birth ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, date_of_birth: e.target.value || null })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-[#374151] dark:text-gray-200">Género</Label>
                        <Select
                          value={form.gender ?? ""}
                          onValueChange={(v) => setForm({ ...form, gender: v || null })}
                        >
                          <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-[#374151] dark:text-gray-200">Grupo Sanguíneo</Label>
                        <Select
                          value={form.blood_type ?? ""}
                          onValueChange={(v) => setForm({ ...form, blood_type: v || null })}
                        >
                          <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bt) => (
                              <SelectItem key={bt} value={bt}>
                                {bt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-[#1E293B]" />

                  {/* Address */}
                  <div>
                    <p className="text-xs font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Domicilio
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-sm text-[#374151] dark:text-gray-200">
                          Dirección
                        </Label>
                        <Input
                          id="address"
                          placeholder="Calle y número"
                          className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          value={form.address ?? ""}
                          onChange={(e) => setForm({ ...form, address: e.target.value || null })}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-sm text-[#374151] dark:text-gray-200">Ciudad</Label>
                          <Input
                            id="city"
                            placeholder="Santa Cruz de la Sierra"
                            className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                            value={form.city ?? ""}
                            onChange={(e) => setForm({ ...form, city: e.target.value || null })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="state" className="text-sm text-[#374151] dark:text-gray-200">Departamento</Label>
                          <Input
                            id="state"
                            placeholder="Santa Cruz"
                            className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                            value={form.state ?? ""}
                            onChange={(e) => setForm({ ...form, state: e.target.value || null })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="zip" className="text-sm text-[#374151] dark:text-gray-200">C.P.</Label>
                          <Input
                            id="zip"
                            placeholder="0000"
                            className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                            value={form.zip_code ?? ""}
                            onChange={(e) =>
                              setForm({ ...form, zip_code: e.target.value || null })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-[#1E293B]" />

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Notas Generales
                    </p>
                    <Textarea
                      placeholder="Observaciones generales sobre el paciente..."
                      className="rounded-xl resize-none border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                      rows={3}
                      value={form.notes ?? ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
                    />
                  </div>
                </div>
              )}

              {/* === MEDICAL INFO === */}
              {activeSection === "medical" && (
                <div className="space-y-8">
                  {/* Section header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/40 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#111827] dark:text-[#F8FAFC]">Información Médica</h2>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Alergias y condiciones relevantes para el tratamiento</p>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-[#374151] dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] dark:text-amber-400" /> Alergias
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          Medicamentos, materiales o sustancias
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAllergy}
                        className="rounded-xl border-[#0284C7] dark:border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer h-9"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Agregar Alergia
                      </Button>
                    </div>

                    {form.allergies.length === 0 ? (
                      <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#1E293B] rounded-xl py-8 flex flex-col items-center gap-2 text-[#9CA3AF]">
                        <AlertTriangle className="w-8 h-8 text-[#D1D5DB] dark:text-gray-600" />
                        <p className="text-sm">Sin alergias registradas</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addAllergy}
                          className="text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Agregar primera alergia
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.allergies.map((a, i) => (
                          <div
                            key={i}
                            className="bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-800/40 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#92400E] dark:text-amber-300">
                                Alergia #{i + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAllergy(i)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-[#374151] dark:text-gray-200">
                                  Alérgeno <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Input
                                  placeholder="Ej. Penicilina, Látex..."
                                  className="rounded-xl h-10 text-sm border-[#FDE68A] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                                  value={a.allergen}
                                  onChange={(e) => updateAllergy(i, { allergen: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-[#374151] dark:text-gray-200">Severidad</Label>
                                <Select
                                  value={a.severity}
                                  onValueChange={(v) => updateAllergy(i, { severity: v })}
                                >
                                  <SelectTrigger className="rounded-xl h-10 text-sm border-[#FDE68A] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]">
                                    <SelectValue placeholder="Seleccionar..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-[#111827] border-[#FDE68A] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                                    <SelectItem value="leve">Leve</SelectItem>
                                    <SelectItem value="moderada">Moderada</SelectItem>
                                    <SelectItem value="severa">Severa</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#374151] dark:text-gray-200">Notas adicionales</Label>
                              <Input
                                placeholder="Reacciones observadas, tratamiento previo..."
                                className="rounded-xl h-10 text-sm border-[#FDE68A] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                                value={a.notes}
                                onChange={(e) => updateAllergy(i, { notes: e.target.value })}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="dark:bg-[#1E293B]" />

                  {/* Medical Conditions */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-[#374151] dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" /> Condiciones Médicas
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          Enfermedades crónicas, antecedentes relevantes
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCondition}
                        className="rounded-xl border-[#0284C7] dark:border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer h-9"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Agregar Condición
                      </Button>
                    </div>

                    {form.medical_conditions.length === 0 ? (
                      <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#1E293B] rounded-xl py-8 flex flex-col items-center gap-2 text-[#9CA3AF]">
                        <Pill className="w-8 h-8 text-[#D1D5DB] dark:text-gray-600" />
                        <p className="text-sm">Sin condiciones médicas registradas</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addCondition}
                          className="text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Agregar condición
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.medical_conditions.map((c, i) => (
                          <div
                            key={i}
                            className="bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-sky-800/40 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#075985] dark:text-[#38BDF8]">
                                Condición #{i + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeCondition(i)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-[#374151] dark:text-gray-200">
                                  Condición <span className="text-[#EF4444]">*</span>
                                </Label>
                                <Input
                                  placeholder="Ej. Diabetes tipo 2, Hipertensión..."
                                  className="rounded-xl h-10 text-sm border-[#BAE6FD] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                                  value={c.condition_name}
                                  onChange={(e) =>
                                    updateCondition(i, { condition_name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-[#374151] dark:text-gray-200">Desde</Label>
                                <Input
                                  type="date"
                                  className="rounded-xl h-10 text-sm border-[#BAE6FD] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                                  value={c.since_date}
                                  onChange={(e) =>
                                    updateCondition(i, { since_date: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#374151] dark:text-gray-200">Notas</Label>
                              <Input
                                placeholder="Medicamentos actuales, observaciones..."
                                className="rounded-xl h-10 text-sm border-[#BAE6FD] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                                value={c.notes}
                                onChange={(e) => updateCondition(i, { notes: e.target.value })}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === EMERGENCY CONTACTS === */}
              {activeSection === "contacts" && (
                <div className="space-y-6">
                  {/* Section header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
                    <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/40 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#3B82F6] dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#111827] dark:text-[#F8FAFC]">Contactos de Emergencia</h2>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Personas a contactar ante una emergencia</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-[#9CA3AF]">
                      Agrega uno o más contactos de confianza del paciente
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addContact}
                      className="rounded-xl border-[#0284C7] dark:border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer h-9"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Agregar Contacto
                    </Button>
                  </div>

                  {form.emergency_contacts.length === 0 ? (
                    <div className="border-2 border-dashed border-[#E5E7EB] dark:border-[#1E293B] rounded-xl py-12 flex flex-col items-center gap-2 text-[#9CA3AF]">
                      <Phone className="w-10 h-10 text-[#D1D5DB] dark:text-gray-600" />
                      <p className="text-sm font-medium">Sin contactos de emergencia</p>
                      <p className="text-xs text-center max-w-xs">
                        Recomendamos registrar al menos un contacto de emergencia del paciente
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addContact}
                        className="text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 cursor-pointer rounded-xl mt-1"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Agregar primer contacto
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.emergency_contacts.map((ec, i) => (
                        <div
                          key={i}
                          className="bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#0284C7]/10 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                              </div>
                              <span className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                                Contacto #{i + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeContact(i)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-[#374151] dark:text-gray-200">
                                Nombre <span className="text-[#EF4444]">*</span>
                              </Label>
                              <Input
                                placeholder="Ej. Juan Pérez"
                                className="rounded-xl h-10 text-sm border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                                value={ec.name}
                                onChange={(e) => updateContact(i, { name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-[#374151] dark:text-gray-200">Parentesco / Relación</Label>
                              <Input
                                placeholder="Ej. Esposo, Madre, Amigo..."
                                className="rounded-xl h-10 text-sm border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                                value={ec.relationship_type}
                                onChange={(e) =>
                                  updateContact(i, { relationship_type: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-[#374151] dark:text-gray-200 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> Teléfono{" "}
                              <span className="text-[#EF4444]">*</span>
                            </Label>
                            <Input
                              placeholder="+52 999 123 4567"
                              className="rounded-xl h-10 text-sm border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                              value={ec.phone}
                              onChange={(e) => updateContact(i, { phone: e.target.value })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          {saveError && (
            <div className="flex-shrink-0 px-4 sm:px-8 pb-1">
              <p className="text-sm text-[#EF4444] bg-[#FEF2F2] dark:bg-red-950/40 border border-[#FECACA] dark:border-red-900/40 rounded-xl px-4 py-2.5">
                {saveError}
              </p>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 px-4 sm:px-8 py-3 sm:py-4 border-t border-[#F3F4F6] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <p className="text-xs text-[#9CA3AF] text-center sm:text-left order-2 sm:order-1">
                Los campos con <span className="text-[#EF4444]">*</span> son obligatorios
              </p>
              <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1 sm:flex-initial rounded-xl border-[#D1D5DB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="new-patient-form"
                  disabled={saving}
                  className="flex-1 sm:flex-initial bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl px-6 shadow-md shadow-[#0284C7]/20 cursor-pointer transition-colors duration-200"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {saving ? "Guardando..." : "Guardar Paciente"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation Dialog Alert */}
      <Dialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <DialogContent className="rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border border-[#F3F4F6] dark:border-[#1E293B] max-w-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                ¿Eliminar paciente?
              </DialogTitle>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-2 leading-relaxed">
                ¿Estás seguro de que deseas eliminar a{' '}
                <strong className="text-[#111827] dark:text-white font-semibold">
                  {patientToDelete?.first_name} {patientToDelete?.last_name}
                </strong>
                ? Esta acción desactivará su registro en la clínica.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPatientToDelete(null)}
              disabled={deleting}
              className="rounded-xl border-[#D1D5DB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeletePatient}
              disabled={deleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 cursor-pointer"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {deleting ? 'Eliminando...' : 'Sí, eliminar paciente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
