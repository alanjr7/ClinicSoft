import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Scan,
  Folder,
  FolderOpen,
  Plus,
  Upload,
  Trash2,
  File,
  ChevronRight,
  X,
  Loader2,
  Search,
  User,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Download,
  Maximize2,
  Layers,
  Sparkles,
  ArrowLeft,
  LayoutGrid,
  List,
  Calendar,
  ExternalLink,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import Layout from '../components/Layout';

// ── Types ────────────────────────────────────────────────────────────────────

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

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

interface SelectedPatient extends PatientOption {
  folders: PatientFolder[];
}

interface Props {
  patients: PatientOption[];
  selectedPatient: SelectedPatient | null;
  patient_id: string | null;
}

Radiographs.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

const QUICK_FOLDER_SUGGESTIONS = [
  'Radiografía Panorámica (Ortopantomografía)',
  'Radiografías Periapicales',
  'Radiografía Cefalométrica Lateral',
  'Bite-wing (Aleta de Mordida)',
  'Fotografías Intraorales',
  'Tomografía 3D (CBCT)',
];

export default function Radiographs({ patients, selectedPatient, patient_id }: Props) {
  const [searchPatient, setSearchPatient] = useState('');
  const [currentFolder, setCurrentFolder] = useState<PatientFolder | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Lightbox & Image Inspector state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter patients by search term
  const filteredPatients = useMemo(() => {
    if (!searchPatient.trim()) return patients;
    const term = searchPatient.toLowerCase();
    return patients.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
      (p.national_id && p.national_id.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  }, [patients, searchPatient]);

  // Keep current folder updated when selectedPatient changes
  useEffect(() => {
    if (currentFolder && selectedPatient) {
      const updated = selectedPatient.folders?.find((f) => f.id === currentFolder.id);
      if (updated) setCurrentFolder(updated);
      else setCurrentFolder(null);
    }
  }, [selectedPatient, currentFolder?.id]);

  // List of image files in current folder for lightbox navigation
  const currentImageFiles = useMemo(() => {
    if (!currentFolder) return [];
    return currentFolder.files.filter((f) => !f.file_type?.includes('pdf'));
  }, [currentFolder]);

  const activeImage = selectedImageIndex !== null ? currentImageFiles[selectedImageIndex] : null;

  // Handle selecting a patient
  function handleSelectPatient(id: string) {
    setCurrentFolder(null);
    router.get('/radiographs', { patient_id: id }, { preserveState: true, preserveScroll: true });
  }

  // Folder creation
  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim() || !selectedPatient) return;
    setIsCreatingFolder(true);
    router.post(
      `/patients/${selectedPatient.id}/folders`,
      { name: newFolderName },
      {
        onSuccess: () => {
          setShowNewFolderModal(false);
          setNewFolderName('');
        },
        onFinish: () => setIsCreatingFolder(false),
        preserveScroll: true,
      }
    );
  }

  // Folder deletion
  function handleDeleteFolder(folderId: string) {
    if (!selectedPatient) return;
    if (confirm('¿Estás seguro de eliminar esta carpeta y todas sus radiografías y archivos?')) {
      router.delete(`/patients/${selectedPatient.id}/folders/${folderId}`, {
        onSuccess: () => {
          if (currentFolder?.id === folderId) setCurrentFolder(null);
        },
        preserveScroll: true,
      });
    }
  }

  // File upload
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0 && currentFolder && selectedPatient) {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(e.target.files).forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      router.post(
        `/patients/${selectedPatient.id}/folders/${currentFolder.id}/files`,
        formData,
        {
          onSuccess: () => {
            if (fileInputRef.current) fileInputRef.current.value = '';
          },
          onFinish: () => setIsUploading(false),
          preserveScroll: true,
        }
      );
    }
  }

  // File deletion
  function handleDeleteFile(fileId: string) {
    if (!selectedPatient) return;
    if (confirm('¿Estás seguro de eliminar este archivo?')) {
      router.delete(`/patients/${selectedPatient.id}/files/${fileId}`, {
        preserveScroll: true,
      });
    }
  }

  // Open file (Image viewer or PDF in new tab)
  function handleOpenFile(file: PatientFile) {
    if (file.file_type === 'application/pdf') {
      window.open(`/patients/${selectedPatient?.id}/files/${file.id}/download`, '_blank');
    } else {
      const idx = currentImageFiles.findIndex((f) => f.id === file.id);
      if (idx !== -1) {
        setSelectedImageIndex(idx);
        setZoomLevel(1);
        setRotation(0);
        setIsInverted(false);
        setHighContrast(false);
      }
    }
  }

  // Lightbox controls
  function handleNextImage() {
    if (selectedImageIndex !== null && selectedImageIndex < currentImageFiles.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
      setZoomLevel(1);
      setRotation(0);
    }
  }

  function handlePrevImage() {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
      setZoomLevel(1);
      setRotation(0);
    }
  }

  // Keyboard navigation for viewer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedImageIndex === null) return;
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setSelectedImageIndex(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, currentImageFiles.length]);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center text-white shadow-lg shadow-[#0284C7]/20">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">
                Radiografías e Imágenes
              </h1>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                Gestión, visualización y visor clínico de radiografías sincronizado con el expediente del paciente
              </p>
            </div>
          </div>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-2">
            <Link
              href={`/patients/${selectedPatient.id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] text-[#4B5563] dark:text-gray-300 hover:text-[#0284C7] dark:hover:text-[#38BDF8] hover:border-[#0284C7]/40 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Ficha del Paciente
            </Link>
          </div>
        )}
      </div>

      {/* Main Grid: Left column (Patient selector) & Right column (Folders & Radiographs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Patient Selection Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <CardTitle className="text-base font-semibold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <User className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                Seleccionar Paciente
              </CardTitle>
              <div className="relative mt-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Buscar paciente por nombre o CI..."
                  className="pl-9 text-xs rounded-xl border-[#E5E7EB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus-visible:ring-[#0284C7]"
                />
                {searchPatient && (
                  <button
                    onClick={() => setSearchPatient('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-1 pr-1">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#9CA3AF]">
                    No se encontraron pacientes
                  </div>
                ) : (
                  filteredPatients.map((p) => {
                    const isSelected = selectedPatient?.id === p.id;
                    const initials = `${p.first_name[0] || ''}${p.last_name[0] || ''}`.toUpperCase();
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0284C7] text-white shadow-md shadow-[#0284C7]/20 font-medium'
                            : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8]'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {p.first_name} {p.last_name}
                          </p>
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isSelected ? 'text-white/80' : 'text-[#6B7280] dark:text-[#94A3B8]'
                            }`}
                          >
                            {p.national_id ? `CI: ${p.national_id}` : p.phone || 'Sin datos adicionales'}
                          </p>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 shrink-0 text-white" />}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radiographs & Folders Main Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {!selectedPatient ? (
            /* No patient selected state */
            <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm py-20 text-center">
              <CardContent className="flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] mb-5 shadow-inner">
                  <Scan className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-2">
                  Selecciona un paciente
                </h3>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-6">
                  Elige un paciente del panel izquierdo para explorar sus carpetas, cargar nuevas radiografías o examinar imágenes en el visor clínico.
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Patient Selected -> Folders or Files inside folder */
            <div className="space-y-6">
              {/* Selected Patient Banner */}
              <div className="bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#0284C7]/20 shrink-0">
                    {`${selectedPatient.first_name[0] || ''}${selectedPatient.last_name[0] || ''}`.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC]">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      {selectedPatient.national_id && <span>CI: <strong>{selectedPatient.national_id}</strong></span>}
                      {selectedPatient.date_of_birth && <span>• {calcAge(selectedPatient.date_of_birth)}</span>}
                      {selectedPatient.gender && (
                        <span>
                          • {selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)}
                        </span>
                      )}
                      {selectedPatient.phone && <span>• Tel: {selectedPatient.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] border-[#0284C7]/30">
                    {selectedPatient.folders?.length || 0} Carpetas
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-[#4B5563] dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    {selectedPatient.folders?.reduce((acc, f) => acc + (f.files?.length || 0), 0) || 0} Archivos
                  </Badge>
                </div>
              </div>

              {/* Main Folders & Files Card */}
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b border-[#F3F4F6] dark:border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-[#0F172A]/50">
                  {/* Breadcrumbs Navigation */}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {currentFolder ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentFolder(null)}
                          className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Folder className="w-4 h-4" />
                          Carpetas
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#D1D5DB] dark:text-gray-600" />
                        <span className="text-[#0284C7] dark:text-[#38BDF8] font-bold flex items-center gap-1.5 bg-[#F0F9FF] dark:bg-[#0284C7]/10 px-2.5 py-1 rounded-lg">
                          <FolderOpen className="w-4 h-4" />
                          {currentFolder.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#111827] dark:text-[#F8FAFC] font-bold text-base flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                        Carpetas de Radiografías y Archivos
                      </span>
                    )}
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2">
                    {currentFolder ? (
                      <>
                        <div className="flex items-center border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl overflow-hidden p-0.5 bg-[#F8FAFC] dark:bg-[#111827]">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              viewMode === 'grid'
                                ? 'bg-white dark:bg-[#0F172A] text-[#0284C7] dark:text-[#38BDF8] shadow-xs'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                            title="Vista en Cuadrícula"
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              viewMode === 'list'
                                ? 'bg-white dark:bg-[#0F172A] text-[#0284C7] dark:text-[#38BDF8] shadow-xs'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                            title="Vista en Lista"
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>

                        <input
                          type="file"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*,.pdf"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white shadow-md shadow-[#0284C7]/20 text-xs font-semibold cursor-pointer"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-1.5" />
                          )}
                          Subir Radiografías
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setShowNewFolderModal(true)}
                        className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white shadow-md shadow-[#0284C7]/20 text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Nueva Carpeta
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* VIEW 1: INSIDE A FOLDER (FILES / RADIOGRAPHS) */}
                  {currentFolder ? (
                    currentFolder.files.length === 0 ? (
                      <div className="py-16 text-center text-[#6B7280] dark:text-[#94A3B8]">
                        <div className="w-16 h-16 rounded-3xl bg-[#F8FAFC] dark:bg-[#1E293B] flex items-center justify-center mx-auto mb-4 text-[#9CA3AF]">
                          <File className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                          La carpeta está vacía
                        </h4>
                        <p className="text-sm mt-1 mb-5 max-w-sm mx-auto">
                          Usa el botón "Subir Radiografías" para añadir imágenes periapicales, panorámicas o documentos en PDF.
                        </p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-1.5" />
                          Subir Archivos Ahora
                        </Button>
                      </div>
                    ) : viewMode === 'grid' ? (
                      /* Grid / Gallery View */
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {currentFolder.files.map((file) => {
                          const isPdf = file.file_type?.includes('pdf');
                          const downloadUrl = `/patients/${selectedPatient.id}/files/${file.id}/download`;
                          return (
                            <div
                              key={file.id}
                              onClick={() => handleOpenFile(file)}
                              className="group relative rounded-2xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#0284C7] dark:hover:border-[#0284C7] transition-all overflow-hidden cursor-pointer flex flex-col shadow-sm hover:shadow-md"
                            >
                              {/* Thumbnail preview */}
                              <div className="aspect-square bg-[#0B1120] relative flex items-center justify-center overflow-hidden">
                                {isPdf ? (
                                  <div className="flex flex-col items-center justify-center p-4 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center mb-2">
                                      <File className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                      Documento PDF
                                    </span>
                                  </div>
                                ) : (
                                  <img
                                    src={downloadUrl}
                                    alt={file.file_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                )}

                                {/* Hover Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenFile(file);
                                    }}
                                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                                    title="Inspeccionar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={downloadUrl}
                                    download={file.file_name}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                                    title="Descargar"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(file.id);
                                    }}
                                    className="p-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* File details footer */}
                              <div className="p-3 bg-white dark:bg-[#0F172A] border-t border-[#E5E7EB] dark:border-[#1E293B]">
                                <p className="text-xs font-semibold text-[#111827] dark:text-[#F8FAFC] truncate" title={file.file_name}>
                                  {file.file_name}
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] mt-1">
                                  <span>{(file.file_size ? file.file_size / 1024 : 0).toFixed(1)} KB</span>
                                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* List / Table View */
                      <div className="space-y-2">
                        {currentFolder.files.map((file) => {
                          const isPdf = file.file_type?.includes('pdf');
                          const downloadUrl = `/patients/${selectedPatient.id}/files/${file.id}/download`;
                          return (
                            <div
                              key={file.id}
                              onClick={() => handleOpenFile(file)}
                              className="flex items-center justify-between p-3.5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-all cursor-pointer shadow-xs group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] flex items-center justify-center shrink-0">
                                  {isPdf ? (
                                    <File className="w-5 h-5 text-red-500" />
                                  ) : (
                                    <Scan className="w-5 h-5 text-[#0284C7]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                                    {file.file_name}
                                  </p>
                                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                                    {(file.file_size ? file.file_size / 1024 : 0).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={downloadUrl}
                                  download={file.file_name}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Descargar"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    /* VIEW 2: FOLDERS LIST */
                    (!selectedPatient.folders || selectedPatient.folders.length === 0) ? (
                      <div className="py-16 text-center text-[#6B7280] dark:text-[#94A3B8]">
                        <div className="w-16 h-16 rounded-3xl bg-[#FFFBEB] dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                          <FolderOpen className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-[#111827] dark:text-[#F8FAFC]">
                          No hay carpetas creadas.
                        </h4>
                        <p className="text-sm mt-1 mb-5 max-w-sm mx-auto">
                          Crea una carpeta para comenzar a organizar archivos.
                        </p>
                        <Button
                          onClick={() => setShowNewFolderModal(true)}
                          className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Nueva Carpeta
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedPatient.folders.map((folder) => {
                          const fileCount = folder.files?.length || 0;
                          return (
                            <div
                              key={folder.id}
                              onClick={() => setCurrentFolder(folder)}
                              className="group p-5 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl hover:border-[#0284C7] dark:hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/30 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                  <Folder className="w-6 h-6 fill-[#F59E0B]/20 dark:fill-amber-400/20" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-auto rounded-lg"
                                  title="Eliminar Carpeta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div>
                                <h3 className="font-bold text-sm text-[#111827] dark:text-[#F8FAFC] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                                  {folder.name}
                                </h3>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B] text-xs text-[#6B7280] dark:text-[#94A3B8]">
                                  <span>{fileCount} {fileCount === 1 ? 'archivo' : 'archivos'}</span>
                                  <span className="flex items-center gap-1">
                                    Abrir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      <Dialog open={showNewFolderModal} onOpenChange={setShowNewFolderModal}>
        <DialogContent className="rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#0284C7]" />
              Nueva Carpeta
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolder}>
            <div className="py-4 space-y-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-200 text-xs font-semibold">
                  Nombre de la carpeta
                </Label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej. Radiografía Panorámica 2026"
                  className="mt-1.5 rounded-xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus-visible:ring-[#0284C7]"
                  autoFocus
                />
              </div>

              {/* Quick suggestions tags */}
              <div>
                <Label className="text-[#9CA3AF] text-[11px] uppercase tracking-wider block mb-2 font-semibold">
                  Sugerencias rápidas:
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOLDER_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewFolderName(tag)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#F8FAFC] dark:bg-[#1E293B] text-[#4B5563] dark:text-gray-300 hover:bg-[#0284C7]/10 hover:text-[#0284C7] dark:hover:text-[#38BDF8] border border-[#E5E7EB] dark:border-[#1E293B] transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewFolderModal(false)}
                className="rounded-xl border-[#E5E7EB] dark:border-[#1E293B] text-gray-700 dark:text-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="rounded-xl bg-[#0284C7] hover:bg-[#075985] text-white"
              >
                {isCreatingFolder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Crear Carpeta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Advanced Clinical Radiograph Lightbox & Inspection Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none">
          {/* Top Bar: Title, Controls, Close */}
          <div className="w-full max-w-6xl flex items-center justify-between gap-4 text-white z-50 py-2">
            <div className="min-w-0">
              <h4 className="text-base font-bold truncate">{activeImage.file_name}</h4>
              <p className="text-xs text-gray-400">
                {selectedPatient?.first_name} {selectedPatient?.last_name} • {selectedImageIndex! + 1} de {currentImageFiles.length}
              </p>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Reducir Zoom (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Rotar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsInverted((inv) => !inv)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isInverted ? 'bg-[#0284C7] text-white' : 'hover:bg-white/20'
                }`}
                title="Modo Negativo / Invertir Colores"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setHighContrast((hc) => !hc)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  highContrast ? 'bg-[#0284C7] text-white' : 'hover:bg-white/20'
                }`}
                title="Alto Contraste Óseo"
              >
                <Layers className="w-4 h-4" />
              </button>
              <a
                href={`/patients/${selectedPatient?.id}/files/${activeImage.id}/download`}
                download={activeImage.file_name}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                title="Descargar Archivo Original"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setRotation(0);
                  setIsInverted(false);
                  setHighContrast(false);
                }}
                className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors ml-1 cursor-pointer"
                title="Restablecer vista"
              >
                Reset
              </button>
            </div>

            <button
              onClick={() => setSelectedImageIndex(null)}
              className="p-2.5 bg-white/10 hover:bg-red-500 rounded-2xl transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central Image Viewport */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-2">
            {/* Previous navigation button */}
            {selectedImageIndex! > 0 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-4 z-40 p-3 bg-black/60 hover:bg-black/90 text-white rounded-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                title="Anterior (Flecha izquierda)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image Canvas */}
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={`/patients/${selectedPatient?.id}/files/${activeImage.id}/download`}
                alt={activeImage.file_name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  filter: `${isInverted ? 'invert(1)' : ''} ${highContrast ? 'contrast(1.6) brightness(1.1)' : ''}`,
                  transition: 'transform 0.2s ease-out, filter 0.2s ease',
                }}
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Next navigation button */}
            {selectedImageIndex! < currentImageFiles.length - 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 z-40 p-3 bg-black/60 hover:bg-black/90 text-white rounded-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                title="Siguiente (Flecha derecha)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="text-center text-xs text-gray-400 py-1">
            Zoom: {Math.round(zoomLevel * 100)}% • Rotación: {rotation}° • {isInverted ? 'Filtro Invertido Activado • ' : ''}
            Usa las teclas de flechas (← / →) para navegar o Esc para salir.
          </div>
        </div>
      )}
    </div>
  );
}
