import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Lottie } from 'lottie-react';
import doctorAnimation from '../../../../public/json_icono/Doctor.json';
import {
  Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle, KeyRound, Check, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface ResetPasswordProps {
  token: string;
  email?: string;
}

export default function ResetPassword({ token, email = '' }: ResetPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/reset-password');
  };

  const hasMinLength = data.password.length >= 8;
  const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC]">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LADO IZQUIERDO: FORMULARIO DE RESTABLECIMIENTO                             */}
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
              Cancelar y volver al inicio
            </Link>
          </div>

          {/* Logo y Encabezado */}
          <div className="text-center sm:text-left mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-[#14B8A6] mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
              Crear Nueva Contraseña
            </h1>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-xs sm:text-sm mt-1.5 leading-relaxed">
              Elige una contraseña segura de al menos 8 caracteres para tu cuenta en ClinicSoft.
            </p>
          </div>

          {/* Errores globales / Token inválido */}
          {errors.email && (
            <div className="mb-5 flex items-start gap-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl p-3.5 border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo restablecer la contraseña</p>
                <p className="mt-0.5">{errors.email}</p>
                <Link
                  href="/forgot-password"
                  className="text-[#14B8A6] underline hover:text-[#0F766E] font-medium mt-1 inline-block"
                >
                  Solicitar un nuevo enlace
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Oculto / Visible de Correo */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  readOnly={!!email}
                  className={`pl-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm ${
                    email ? 'bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed opacity-90' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation" className="text-xs font-semibold text-[#374151] dark:text-gray-200">
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu nueva contraseña"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] focus:border-[#14B8A6] focus:ring-[#14B8A6] text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
              )}
            </div>

            {/* Requisitos visuales defensivos */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3.5 space-y-2 border border-gray-100 dark:border-gray-800 text-xs">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400 shrink-0" />}
                <span>Al menos 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                {passwordsMatch ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-400 shrink-0" />}
                <span>Las contraseñas coinciden</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={processing || !hasMinLength || !passwordsMatch}
              className="w-full h-11 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl shadow-md shadow-[#14B8A6]/25 transition-all duration-200 font-medium cursor-pointer mt-2"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando nueva contraseña...
                </span>
              ) : (
                'Restablecer y Guardar Contraseña'
              )}
            </Button>
          </form>

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
    </div>
  );
}

