import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  Mail, Lock, AlertCircle, Sparkles, User, Phone, Building2,
  Loader2, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../components/ui/dialog';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  // ── Modal Modo Prueba State ──
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    full_name: '',
    whatsapp: '',
    company_name: '',
  });
  const [demoProcessing, setDemoProcessing] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login');
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.full_name.trim() || !demoForm.whatsapp.trim()) {
      setDemoError('Nombre completo y número de WhatsApp son obligatorios.');
      return;
    }

    setDemoProcessing(true);
    setDemoError(null);

    router.post('/demo-access', demoForm, {
      onError: (errs) => {
        const msg = Object.values(errs)[0] as string || 'Error al iniciar la demostración.';
        setDemoError(msg);
        setDemoProcessing(false);
      },
      onFinish: () => {
        // Will redirect to /dashboard
      },
    });
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LADO IZQUIERDO: FORMULARIO DE ACCESO Y MODO DEMO                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3">
              <img src="/images/logo.png" alt="DentalSoft Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">DentalSoft</h1>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-1">Software Odontológico en la Nube</p>
          </div>

          {/* Formulario */}
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-[#111827] dark:text-white">Iniciar Sesión</h2>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Ingresa tus credenciales para acceder a tu clínica</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@dentalsoft.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="pl-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="pl-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#6B7280] dark:text-[#94A3B8] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded accent-[#14B8A6]"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                  />
                  Recordarme
                </label>
                <a href="#" className="text-[#14B8A6] hover:text-[#0F766E] font-medium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {errors.email && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errors.email}
                </div>
              )}

              <Button
                type="submit"
                disabled={processing}
                className="w-full h-11 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/25 transition-all duration-200 font-medium cursor-pointer"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Ingresando...
                  </span>
                ) : (
                  'Ingresar a la Plataforma'
                )}
              </Button>
            </form>

            {/* Separador */}
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#0B1120] px-3 text-[#9CA3AF] font-medium">
                  o
                </span>
              </div>
            </div>

            {/* Botón Modo Demo (Gris con Letras Gruesas) */}
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="w-full h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
            >
              Modo Demo
            </button>
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-8">
            © 2026 DentalSoft SaaS. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LADO DERECHO: SVG ANIMADO ÚNICAMENTE (Sin texto, 50% de la pantalla)        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#F0FDFA] via-[#CCFBF1]/40 to-[#F8FAFC] dark:from-[#0F172A] dark:via-[#134E4A]/20 dark:to-[#0B1120] border-l border-[#F3F4F6] dark:border-[#1E293B] p-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* SVG Animado Limpio sin texto */}
        <div className="relative z-10 w-full max-w-xl flex items-center justify-center">
          <img
            src="/images/dental-examination-report.svg"
            alt="DentalSoft Animation"
            className="w-full max-h-[580px] object-contain drop-shadow-xl select-none"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ACCESO A MODO PRUEBA / DEMO INTERACTIVA                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="max-w-md rounded-3xl bg-white text-[#111827] border border-gray-100 shadow-2xl p-6 sm:p-7">
          <DialogHeader className="text-left space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#14B8A6] mb-1 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#111827]">
              Acceso a Modo Prueba
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Ingresa tus datos para acceder instantáneamente a un entorno interactivo de prueba con datos odontológicos de demostración.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDemoSubmit} className="space-y-4 pt-2">
            {demoError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-3.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {demoError}
              </div>
            )}

            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  required
                  placeholder="Ej. Dr. Mario Santos"
                  value={demoForm.full_name}
                  onChange={(e) => setDemoForm(f => ({ ...f, full_name: e.target.value }))}
                  className="pl-10 h-11 rounded-xl border-[#D1D5DB] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                />
              </div>
            </div>

            {/* Número de WhatsApp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#374151]">
                Número de WhatsApp <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  required
                  type="tel"
                  placeholder="Ej. +591 71234567"
                  value={demoForm.whatsapp}
                  onChange={(e) => setDemoForm(f => ({ ...f, whatsapp: e.target.value }))}
                  className="pl-10 h-11 rounded-xl border-[#D1D5DB] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Para enviarte el enlace de acceso o brindarte soporte personalizado.
              </p>
            </div>

            {/* Nombre de la Empresa / Clínica (Opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#374151]">
                  Nombre de tu Clínica o Empresa
                </Label>
                <span className="text-[10px] text-gray-400 font-medium">Opcional</span>
              </div>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  placeholder="Ej. Clínica Dental Sonrisas"
                  value={demoForm.company_name}
                  onChange={(e) => setDemoForm(f => ({ ...f, company_name: e.target.value }))}
                  className="pl-10 h-11 rounded-xl border-[#D1D5DB] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                />
              </div>
            </div>

            {/* Features check list */}
            <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 border border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Acceso completo a todos los módulos (Agenda, Odontograma, Finanzas).</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Entorno de prueba seguro para interactuar con la plataforma.</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDemoModal(false)}
                className="rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={demoProcessing}
                className="bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl h-11 px-5 shadow-lg shadow-[#14B8A6]/25 font-medium cursor-pointer"
              >
                {demoProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Configurando Demo...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Ingresar a Modo Demo <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
