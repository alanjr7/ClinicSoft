import React, { useState } from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Lottie } from 'lottie-react';
import doctorAnimation from '../../../../public/json_icono/Doctor.json';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface ForgotPasswordProps {
  status?: string | null;
}

export default function ForgotPassword({ status: initialStatus }: ForgotPasswordProps) {
  const { flash } = usePage().props as any;
  const activeStatus = initialStatus || flash?.status;

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
  });

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedEmail(data.email);
    post('/forgot-password');
  };

  const handleResetForm = () => {
    reset();
    setSubmittedEmail(null);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LADO IZQUIERDO: FORMULARIO DE RECUPERACIÓN                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Enlace para volver */}
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#14B8A6] dark:hover:text-[#14B8A6] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>

          {/* Logo y Encabezado */}
          <div className="text-center sm:text-left mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-[#14B8A6] mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm mt-1.5 leading-relaxed">
              No te preocupes. Ingresa el correo asociado a tu cuenta y te enviaremos un enlace seguro para restablecerla.
            </p>
          </div>

          {/* Estado de Éxito / Confirmación */}
          {activeStatus ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Instrucciones enviadas
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-1 leading-relaxed">
                      {activeStatus}
                    </p>
                    {submittedEmail && (
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 mt-2 bg-emerald-100/60 dark:bg-emerald-900/40 px-2.5 py-1 rounded-md inline-block">
                        Destinatario: {submittedEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-emerald-200/60 dark:border-emerald-800/40 pt-3 text-[11px] text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Por seguridad, el enlace caducará automáticamente en 60 minutos.</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="w-full h-11 inline-flex items-center justify-center bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/25 transition-all duration-200 font-medium text-sm"
                >
                  Regresar al Inicio de Sesión
                </Link>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full text-xs text-center text-[#6B7280] dark:text-[#94A3B8] hover:text-[#14B8A6] dark:hover:text-[#14B8A6] transition-colors py-1 font-medium"
                >
                  ¿No recibiste el correo? Probar con otra dirección
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Solicitud */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                  Correo Electrónico Registrado
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinicsoft.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={`pl-10 h-11 rounded-xl bg-white dark:bg-[#0F172A] text-sm transition-all ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-[#D1D5DB] dark:border-[#1E293B] focus:border-[#14B8A6] focus:ring-[#14B8A6]'
                    }`}
                    autoFocus
                    required
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2 border border-red-200 dark:border-red-900/40 mt-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={processing || !data.email.trim()}
                className="w-full h-11 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/25 transition-all duration-200 font-medium cursor-pointer"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando enlace seguro...
                  </span>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-[#9CA3AF] mt-10">
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
    </div>
  );
}

