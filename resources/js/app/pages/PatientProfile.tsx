import React, { useState, useRef } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  Image,
  Pill,
  ArrowLeft,
  AlertTriangle,
  User,
  Heart,
  Folder,
  FolderOpen,
  Plus,
  Upload,
  Trash2,
  File,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  Scan,
  Activity,
  Calendar,
  Clock,
  Scissors,
  Pencil,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import Layout from '../components/Layout';
import { toast } from 'sonner';

interface PatientFile {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

interface PatientFolder {
  id: string;
  name: string;
  files: PatientFile[];
  created_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  national_id: string | null;
  notes: string | null;
  is_active: boolean;
  allergies: Array<{ id: string; allergen: string; severity: string | null; notes: string | null }>;
  medical_conditions: Array<{ id: string; condition_name: string; since_date: string | null; notes: string | null }>;
  emergency_contacts: Array<{ id: string; name: string; relationship_type: string | null; phone: string }>;
  folders: PatientFolder[];
  surgeries?: Array<{
    id: string;
    procedure_name: string;
    surgeon_name: string;
    anesthesiologist_name?: string | null;
    assistant_name?: string | null;
    operating_room?: string | null;
    scheduled_start_at: string;
    status: string;
    surgical_protocol?: string | null;
    pre_op_diagnosis?: string | null;
    post_op_diagnosis?: string | null;
    notes?: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string | null;
    created_at: string;
    notes: string | null;
    items: Array<{
      id: string;
      description: string;
      amount: number;
    }>;
  }>;
}

interface Props { patient: Patient; }

PatientProfile.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

export default function PatientProfile({ patient }: Props) {
  const [currentFolder, setCurrentFolder] = useState<PatientFolder | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<PatientFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);

  // Edit Patient Modal State
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: patient.first_name || '',
    last_name: patient.last_name || '',
    national_id: patient.national_id || '',
    phone: patient.phone || '',
    email: patient.email || '',
    date_of_birth: patient.date_of_birth || '',
    gender: patient.gender || 'male',
    blood_type: patient.blood_type || '',
    address: patient.address || '',
    city: patient.city || '',
    state: patient.state || '',
    notes: patient.notes || '',
  });

  const handleOpenEditModal = () => {
    setEditForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      national_id: patient.national_id || '',
      phone: patient.phone || '',
      email: patient.email || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'male',
      blood_type: patient.blood_type || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      notes: patient.notes || '',
    });
    setShowEditPatientModal(true);
  };

  const handleUpdatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.first_name.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }
    setIsUpdatingPatient(true);
    router.put(`/patients/${patient.id}`, editForm, {
      onSuccess: () => {
        toast.success('Datos del paciente actualizados exitosamente.');
        setShowEditPatientModal(false);
      },
      onError: (errors) => {
        const firstErr = Object.values(errors)[0] as string;
        toast.error(firstErr || 'Ocurrió un error al actualizar los datos.');
      },
      onFinish: () => setIsUpdatingPatient(false),
    });
  };

  function handleDeletePatient() {
    setIsDeletingPatient(true);
    router.delete(`/patients/${patient.id}`, {
      onSuccess: () => {
        setShowDeletePatientModal(false);
      },
      onFinish: () => setIsDeletingPatient(false),
    });
  }

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    router.post(`/patients/${patient.id}/folders`, { name: newFolderName }, {
      onSuccess: () => {
        setShowNewFolderModal(false);
        setNewFolderName("");
      },
      onFinish: () => setIsCreatingFolder(false),
      preserveScroll: true,
    });
  }

  function handleDeleteFolder(folderId: string) {
    if (confirm("¿Estás seguro de eliminar esta carpeta y todos sus archivos?")) {
      router.delete(`/patients/${patient.id}/folders/${folderId}`, {
        onSuccess: () => {
          if (currentFolder?.id === folderId) setCurrentFolder(null);
        },
        preserveScroll: true,
      });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0 && currentFolder) {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(e.target.files).forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      router.post(`/patients/${patient.id}/folders/${currentFolder.id}/files`, formData, {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onFinish: () => setIsUploading(false),
        preserveScroll: true,
      });
    }
  }

  function handleDeleteFile(fileId: string) {
    if (confirm("¿Estás seguro de eliminar este archivo?")) {
      router.delete(`/patients/${patient.id}/files/${fileId}`, {
        preserveScroll: true,
      });
    }
  }

  function handleDownloadFile(file: PatientFile) {
    if (file.file_type === 'application/pdf') {
      window.open(`/patients/${patient.id}/files/${file.id}/download`, '_blank');
    } else {
      setSelectedImage(file);
    }
  }

  // Effect to update currentFolder when patient.folders changes
  React.useEffect(() => {
    if (currentFolder) {
      const updated = patient.folders?.find(f => f.id === currentFolder.id);
      if (updated) setCurrentFolder(updated);
      else setCurrentFolder(null);
    }
  }, [patient.folders, currentFolder]);

  if (!patient) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 gap-4 bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]">
        <p className="text-[#EF4444]">Paciente no encontrado.</p>
        <Link href="/patients">
          <Button variant="outline" className="rounded-xl border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a pacientes
          </Button>
        </Link>
      </div>
    );
  }

  const getInitials = (fn?: string | null, ln?: string | null) => {
    const f = (fn || "").trim();
    const l = (ln || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) {
      const parts = f.split(/\s+/);
      return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : f.slice(0, 2).toUpperCase();
    }
    if (l) return l.slice(0, 2).toUpperCase();
    return "P";
  };

  const initials = getInitials(patient.first_name, patient.last_name);
  const address =
    [patient.address, patient.city, patient.state].filter(Boolean).join(", ") || "—";

  const backBtn = (
    <Link href="/patients" className="p-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] transition-colors inline-block">
      <ArrowLeft className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
    </Link>
  );

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Back */}
      <div className="mb-6 -ml-2">
        {backBtn}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center shadow-xl shadow-[#0284C7]/20 flex-shrink-0">
              <span className="text-2xl text-white font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">
                {patient.first_name} {patient.last_name}
              </h1>
              {patient.national_id && (
                <p className="text-sm font-medium text-[#4B5563] dark:text-gray-300 mb-1">
                  CI: {patient.national_id}
                </p>
              )}
              <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">
                {calcAge(patient.date_of_birth)}
                {patient.gender
                  ? ` • ${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}`
                  : ""}
                {patient.blood_type ? ` • ${patient.blood_type}` : ""}
              </p>
              <Badge
                className={`mt-2 rounded-lg border-0 ${
                  patient.is_active
                    ? "bg-[#F0F9FF] dark:bg-[#0284C7]/20 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF]"
                    : "bg-[#F3F4F6] dark:bg-[#1E293B] text-[#6B7280] dark:text-gray-300 hover:bg-[#F3F4F6]"
                }`}
              >
                {patient.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={handleOpenEditModal}
              className="rounded-xl border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Editar Datos
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeletePatientModal(true)}
              className="rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Eliminar Paciente
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
              </div>
              <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Teléfono</span>
            </div>
            <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{patient.phone ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
              </div>
              <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Email</span>
            </div>
            <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{patient.email ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
              </div>
              <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Dirección</span>
            </div>
            <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{address}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="medical" className="space-y-6">
        <TabsList className="bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] p-1 rounded-xl shadow-sm">
          <TabsTrigger
            value="medical"
            className="rounded-lg data-[state=active]:bg-[#0284C7] data-[state=active]:text-white dark:data-[state=active]:bg-[#0284C7] dark:data-[state=active]:text-white text-[#6B7280] dark:text-[#94A3B8]"
          >
            <Heart className="w-4 h-4 mr-2" />
            Info Médica
          </TabsTrigger>
          <TabsTrigger
            value="surgeries"
            className="rounded-lg data-[state=active]:bg-[#0284C7] data-[state=active]:text-white dark:data-[state=active]:bg-[#0284C7] dark:data-[state=active]:text-white text-[#6B7280] dark:text-[#94A3B8]"
          >
            <Activity className="w-4 h-4 mr-2" />
            Cirugías ({patient.surgeries?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg data-[state=active]:bg-[#0284C7] data-[state=active]:text-white dark:data-[state=active]:bg-[#0284C7] dark:data-[state=active]:text-white text-[#6B7280] dark:text-[#94A3B8]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Historial Clínico
          </TabsTrigger>
          <TabsTrigger
            value="attachments"
            className="rounded-lg data-[state=active]:bg-[#0284C7] data-[state=active]:text-white dark:data-[state=active]:bg-[#0284C7] dark:data-[state=active]:text-white text-[#6B7280] dark:text-[#94A3B8]"
          >
            <Image className="w-4 h-4 mr-2" />
            Archivos
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-lg data-[state=active]:bg-[#0284C7] data-[state=active]:text-white dark:data-[state=active]:bg-[#0284C7] dark:data-[state=active]:text-white text-[#6B7280] dark:text-[#94A3B8]"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* Medical Info */}
        <TabsContent value="medical" className="space-y-6">
          {/* Allergies */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                Alergias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.allergies.length === 0 ? (
                <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Sin alergias registradas</p>
              ) : (
                <div className="space-y-3">
                  {patient.allergies.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between p-3 bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-800/40 rounded-xl"
                    >
                      <div>
                        <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{a.allergen}</p>
                        {a.notes && (
                          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{a.notes}</p>
                        )}
                      </div>
                      {a.severity && (
                        <Badge className="bg-[#FEF3C7] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400 border-0 ml-4 flex-shrink-0">
                          {a.severity}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Conditions */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                Condiciones Médicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medical_conditions.length === 0 ? (
                <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Sin condiciones médicas registradas</p>
              ) : (
                <div className="space-y-3">
                  {patient.medical_conditions.map((mc) => (
                    <div key={mc.id} className="p-3 bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-sky-800/40 rounded-xl">
                      <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{mc.condition_name}</p>
                      {mc.since_date && (
                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">Desde: {mc.since_date}</p>
                      )}
                      {mc.notes && (
                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">{mc.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <User className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                Contactos de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.emergency_contacts.length === 0 ? (
                <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Sin contactos de emergencia registrados</p>
              ) : (
                <div className="space-y-3">
                  {patient.emergency_contacts.map((ec) => (
                    <div
                      key={ec.id}
                      className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl"
                    >
                      <div>
                        <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{ec.name}</p>
                        {ec.relationship_type && (
                          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{ec.relationship_type}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8]">
                        <Phone className="w-4 h-4" />
                        <span>{ec.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {patient.notes && (
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#6B7280] dark:text-[#94A3B8]">{patient.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cirugías Realizadas y Programadas */}
        <TabsContent value="surgeries" className="space-y-4">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                Procedimientos Quirúrgicos del Paciente
              </CardTitle>
              <Link
                href={`/surgeries`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#0284C7]/20 transition-colors border border-[#0284C7]/30"
              >
                <Plus className="w-4 h-4" />
                Nueva Cirugía
              </Link>
            </CardHeader>
            <CardContent>
              {(!patient.surgeries || patient.surgeries.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#6B7280] dark:text-[#94A3B8]">
                  <Activity className="w-12 h-12 mb-3 text-[#D1D5DB] dark:text-gray-600" />
                  <p>No hay cirugías registradas para este paciente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patient.surgeries.map((surg) => {
                    const isCompleted = surg.status === 'completed';
                    const dateFormatted = surg.scheduled_start_at
                      ? new Date(surg.scheduled_start_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Sin fecha';

                    return (
                      <div
                        key={surg.id}
                        className="p-4 bg-white dark:bg-[#111827] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl shadow-sm space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                          <div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {surg.procedure_name}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                                {dateFormatted}
                              </span>
                              {surg.operating_room && (
                                <span>• {surg.operating_room}</span>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={`w-fit ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {isCompleted ? 'Realizada' : 'Programada'}
                          </Badge>
                        </div>

                        {/* Detalle Personal */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Cirujano:</span>{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{surg.surgeon_name}</span>
                          </div>
                          {surg.anesthesiologist_name && (
                            <div>
                              <span className="text-gray-400">Anestesiólogo:</span>{' '}
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{surg.anesthesiologist_name}</span>
                            </div>
                          )}
                          {surg.assistant_name && (
                            <div>
                              <span className="text-gray-400">Instrumentista/Ayudante:</span>{' '}
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{surg.assistant_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Protocolo o Notas */}
                        {(surg.surgical_protocol || surg.notes || surg.pre_op_diagnosis) && (
                          <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-lg text-xs space-y-1 text-gray-600 dark:text-gray-300">
                            {surg.pre_op_diagnosis && (
                              <p><strong>Diagnóstico:</strong> {surg.pre_op_diagnosis}</p>
                            )}
                            {surg.surgical_protocol && (
                              <p><strong>Protocolo Quirúrgico:</strong> {surg.surgical_protocol}</p>
                            )}
                            {surg.notes && (
                              <p><strong>Notas:</strong> {surg.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical History — linked to appointments module */}
        <TabsContent value="history">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-[#6B7280] dark:text-[#94A3B8]">
              <FileText className="w-12 h-12 mb-4 text-[#D1D5DB] dark:text-gray-600" />
              <p className="text-lg font-medium text-[#111827] dark:text-[#F8FAFC] mb-2">Historial Clínico</p>
              <p className="text-sm">Disponible desde el módulo de Citas</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {(!patient.payments || patient.payments.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#6B7280] dark:text-[#94A3B8]">
                  <DollarSign className="w-12 h-12 mb-3 text-[#D1D5DB] dark:text-gray-600" />
                  <p>No hay pagos registrados para este paciente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patient.payments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-white dark:bg-[#111827] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[#111827] dark:text-[#F8FAFC]">Método:</span>
                          <Badge variant="outline" className="text-[#6B7280] dark:text-gray-300 border-gray-200 dark:border-[#1E293B]">{payment.payment_method}</Badge>
                          <span className="text-sm text-[#6B7280] dark:text-[#94A3B8] ml-2">
                            {new Date(payment.payment_date || payment.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {payment.notes && <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1 mb-2"><strong>Notas:</strong> {payment.notes}</div>}
                        
                        {payment.items && payment.items.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Conceptos de cobro</span>
                            <ul className="mt-1 space-y-1">
                              {payment.items.map((item) => (
                                <li key={item.id} className="text-sm text-[#4B5563] dark:text-gray-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                                  {item.description} <span className="text-[#9CA3AF]">(Bs. {Number(item.amount).toLocaleString('es-BO', { minimumFractionDigits: 2 })})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider font-semibold mb-1">Total Pagado</div>
                        <div className="text-2xl font-bold text-[#0284C7] dark:text-[#38BDF8]">
                          Bs. {Number(payment.amount).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments */}
        <TabsContent value="attachments">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center">
                {currentFolder ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentFolder(null)} className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white transition-colors">Carpetas</button>
                    <ChevronRight className="w-4 h-4 text-[#D1D5DB] dark:text-gray-600" />
                    <span className="text-[#0284C7] dark:text-[#38BDF8]">{currentFolder.name}</span>
                  </div>
                ) : (
                  "Carpetas y Archivos"
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link
                  href={`/radiographs?patient_id=${patient.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#0284C7]/20 transition-colors border border-[#0284C7]/30"
                >
                  <Scan className="w-4 h-4" />
                  Abrir en Radiografías
                </Link>
                {currentFolder ? (
                  <>
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white">
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Subir Archivos
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowNewFolderModal(true)} className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Carpeta
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentFolder ? (
                /* Archivos List */
                <div className="flex flex-col gap-2">
                  {currentFolder.files.length === 0 ? (
                    <div className="py-12 text-center text-[#6B7280] dark:text-[#94A3B8]">
                      <File className="w-12 h-12 mx-auto mb-3 text-[#D1D5DB] dark:text-gray-600" />
                      <p>La carpeta está vacía.</p>
                      <p className="text-sm mt-1">Usa el botón "Subir Archivos" para añadir documentos.</p>
                    </div>
                  ) : (
                    currentFolder.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#111827] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-all cursor-pointer shadow-sm group" onClick={() => handleDownloadFile(file)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-[#1E293B] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#0F172A] transition-colors">
                            {file.file_type?.includes('pdf') ? <File className="w-5 h-5 text-red-500" /> : <Image className="w-5 h-5 text-blue-500" />}
                          </div>
                          <div>
                            <span className="text-[#111827] dark:text-[#F8FAFC] font-medium">{file.file_name}</span>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{(file.file_size ? file.file_size / 1024 : 0).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Carpetas List */
                <div className="flex flex-col gap-2">
                  {(!patient.folders || patient.folders.length === 0) ? (
                    <div className="py-12 text-center text-[#6B7280] dark:text-[#94A3B8]">
                      <FolderOpen className="w-12 h-12 mx-auto mb-3 text-[#D1D5DB] dark:text-gray-600" />
                      <p>No hay carpetas creadas.</p>
                      <p className="text-sm mt-1">Crea una carpeta para comenzar a organizar archivos.</p>
                    </div>
                  ) : (
                    patient.folders.map(folder => (
                      <div key={folder.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#111827] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-all cursor-pointer shadow-sm group" onClick={() => setCurrentFolder(folder)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] dark:bg-amber-950/40 flex items-center justify-center group-hover:bg-[#FEF3C7] transition-colors">
                            <Folder className="w-5 h-5 text-[#F59E0B] dark:text-amber-400" />
                          </div>
                          <span className="text-[#111827] dark:text-[#F8FAFC] font-medium">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[#6B7280] dark:text-[#94A3B8]">
                          <Badge variant="secondary" className="bg-[#F3F4F6] dark:bg-[#1E293B] text-[#4B5563] dark:text-gray-300 border-0">
                            {folder.files.length} archivos
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Folder Modal */}
      <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
        <DialogContent className="rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Nueva Carpeta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder}>
            <div className="py-4">
              <Label className="text-gray-700 dark:text-gray-200">Nombre de la carpeta</Label>
              <Input 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="Ej. Radiografías" 
                className="mt-2 rounded-xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus-visible:ring-[#0284C7]" 
                autoFocus 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewFolderModal(false)} className="rounded-xl border-[#E5E7EB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
              <Button type="submit" disabled={isCreatingFolder || !newFolderName.trim()} className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white">
                {isCreatingFolder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] bg-transparent border-none shadow-none flex flex-col items-center justify-center p-0">
           {selectedImage && (
             <div className="relative group w-full h-full flex items-center justify-center">
                <button 
                  onClick={() => setSelectedImage(null)} 
                  className="absolute -top-12 right-0 p-2 bg-black/50 hover:bg-black/70 rounded text-white backdrop-blur-md transition-colors z-50"
                >
                  <X className="w-6 h-6" />
                </button>
                <img 
                  src={`/patients/${patient.id}/files/${selectedImage.id}/download`} 
                  alt={selectedImage.file_name} 
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
                />
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation Dialog Alert */}
      <Dialog open={showDeletePatientModal} onOpenChange={setShowDeletePatientModal}>
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
                  {patient.first_name} {patient.last_name}
                </strong>
                ? Esta acción desactivará su registro en la clínica.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeletePatientModal(false)}
              disabled={isDeletingPatient}
              className="rounded-xl border-[#D1D5DB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeletePatient}
              disabled={isDeletingPatient}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 cursor-pointer"
            >
              {isDeletingPatient ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {isDeletingPatient ? 'Eliminando...' : 'Sí, eliminar paciente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditPatientModal} onOpenChange={setShowEditPatientModal}>
        <DialogContent className="rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border border-[#F3F4F6] dark:border-[#1E293B] max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Editar Datos del Paciente
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Modifica los datos personales, de contacto y notas del paciente.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdatePatient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Nombre(s) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Apellidos
                </Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Carnet / C.I.
                </Label>
                <Input
                  value={editForm.national_id}
                  onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="Ej. 1234567"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Teléfono / Celular
                </Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="Ej. 71234567"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Grupo Sanguíneo
                </Label>
                <Input
                  value={editForm.blood_type}
                  onChange={(e) => setEditForm({ ...editForm, blood_type: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="Ej. O+, A+, B-"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Fecha de Nacimiento
                </Label>
                <Input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Género
                </Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(v) => setEditForm({ ...editForm, gender: v })}
                >
                  <SelectTrigger className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Correo Electrónico
                </Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="paciente@correo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Dirección
                </Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="Av. Principal #123"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ciudad
                </Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="rounded-xl h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  placeholder="La Paz, Santa Cruz, etc."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Notas adicionales
              </Label>
              <Textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="rounded-xl resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                placeholder="Observaciones clínicas generales..."
              />
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditPatientModal(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPatient}
                className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white shadow-md shadow-[#0284C7]/20 font-semibold"
              >
                {isUpdatingPatient ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
