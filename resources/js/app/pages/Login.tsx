import { useState, useEffect } from 'react';
import { useForm, router, Link, usePage } from '@inertiajs/react';
import { Lottie } from 'lottie-react';
import doctorAnimation from '../../../../public/json_icono/Doctor.json';
import {
  Mail, Lock, AlertCircle, Sparkles, User, Phone, Building2,
  Loader2, CheckCircle2, ArrowRight, ShieldAlert, Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../components/ui/dialog';

export default function Login() {
  const { flash } = usePage().props as any;

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  // ── Bloqueo de seguridad (Rate limit 5 intentos / 20 seg) ──
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);
  const [lockoutResolved, setLockoutResolved] = useState<boolean>(false);

  useEffect(() => {
    const flashSec = flash?.lockout_seconds ? Number(flash.lockout_seconds) : 0;
    if (flashSec > 0) {
      setLockoutCountdown(flashSec);
      setLockoutResolved(false);
      return;
    }

    if (errors?.email) {
      // Solo capturar si el mensaje indica explícitamente un bloqueo activo (ej. "bloqueado por 20 segundos" o "nuevamente en 20 segundos")
      const match = errors.email.match(/(?:bloqueado por|nuevamente en)\s+(\d+)\s*segundos/i);
      if (match && match[1]) {
        setLockoutCountdown(parseInt(match[1], 10));
        setLockoutResolved(false);
        return;
      }
    }

    setLockoutCountdown(0);
  }, [flash?.lockout_seconds, errors?.email]);

  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLockoutResolved(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

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
    if (lockoutCountdown > 0) return;
    setLockoutResolved(false);
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
              <img src="/images/logo.png" alt="ClinicSoft Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">ClinicSoft</h1>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-1">Software Médico y Clínico en la Nube</p>
          </div>

          {/* Formulario */}
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-[#111827] dark:text-white">Iniciar Sesión</h2>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Ingresa tus credenciales para acceder a tu clínica</p>
            </div>

            {flash?.success && (
              <div className="flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>{flash.success}</span>
              </div>
            )}

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
                    placeholder="usuario@clinicsoft.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    disabled={lockoutCountdown > 0}
                    className="pl-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm disabled:opacity-50"
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
                    disabled={lockoutCountdown > 0}
                    className="pl-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm disabled:opacity-50"
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
                    disabled={lockoutCountdown > 0}
                  />
                  Recordarme
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#14B8A6] hover:text-[#0F766E] font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {lockoutCountdown > 0 ? (
                <div className="flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3.5 border border-rose-300 dark:border-rose-900/50 shadow-sm animate-pulse">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900 dark:text-rose-200">Acceso bloqueado por seguridad</p>
                    <p className="text-[11px] mt-0.5 text-rose-700 dark:text-rose-300">
                      Superaste 5 intentos fallidos de inicio de sesión.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 font-semibold text-rose-900 dark:text-rose-100 bg-rose-200/70 dark:bg-rose-900/60 px-2.5 py-1 rounded-md text-xs">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Podrás intentar nuevamente en: <span className="font-bold underline text-sm">{lockoutCountdown}s</span>
                    </div>
                  </div>
                </div>
              ) : lockoutResolved ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl px-4 py-3 border border-emerald-300 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>El tiempo de bloqueo ha finalizado. Ya puedes ingresar tus credenciales nuevamente.</span>
                </div>
              ) : (
                errors.email && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 border border-red-200 dark:border-red-900/40">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errors.email}
                  </div>
                )
              )}

              <Button
                type="submit"
                disabled={processing || lockoutCountdown > 0}
                className="w-full h-11 bg-[#14B8A6] hover:bg-[#0F766E] disabled:opacity-60 text-white rounded-xl shadow-md shadow-[#14B8A6]/25 transition-all duration-200 font-medium cursor-pointer"
              >
                {lockoutCountdown > 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Bloqueado temporalmente ({lockoutCountdown}s)
                  </span>
                ) : processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Ingresando...
                  </span>
                ) : (
                  'Ingresar a la Plataforma'
                )}
              </Button>
            </form>

            {/* Modo Prueba / Demo comentado temporalmente
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

            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="w-full h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
            >
              Modo Demo
            </button>
            */}
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-8">
            © 2026 ClinicSoft SaaS. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LADO DERECHO: ANIMACIÓN LOTTIE (Doctor.json)                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#F0FDFA] via-[#CCFBF1]/40 to-[#F8FAFC] dark:from-[#0F172A] dark:via-[#134E4A]/20 dark:to-[#0B1120] border-l border-[#F3F4F6] dark:border-[#1E293B] p-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animación Lottie */}
        <div className="relative z-10 w-full max-w-xl flex items-center justify-center">
          <Lottie
            src={doctorAnimation}
            loop={true}
            autoplay={true}
            className="w-full max-h-[580px] drop-shadow-xl select-none"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ACCESO A MODO PRUEBA / DEMO INTERACTIVA (Comentado temporalmente) */}
      {/*
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
      */}
    </div>
  );
}
