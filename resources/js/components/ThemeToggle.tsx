import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'segmented';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = 'icon',
  className = '',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();

  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: React.ElementType }[] = [
      { value: 'light', label: 'Claro', icon: Sun },
      { value: 'dark', label: 'Oscuro', icon: Moon },
      { value: 'system', label: 'Sistema', icon: Laptop },
    ];

    return (
      <div
        role="radiogroup"
        aria-label="Selector de tema visual"
        className={`inline-flex p-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] ${className}`}
      >
        {options.map(({ value, label, icon: Icon }) => {
          const isSelected = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-[#0F172A] text-[#0284C7] dark:text-[#38BDF8] shadow-sm font-semibold'
                  : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-[#4B5563] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-white border border-[#E5E7EB] dark:border-[#334155] ${className}`}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <Sun
            className={`w-4 h-4 text-amber-500 transition-all duration-300 transform absolute ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <Moon
            className={`w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] transition-all duration-300 transform absolute ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </div>
        <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
      </button>
    );
  }

  // Default: variant === 'icon'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#0284C7]/40 ${className}`}
      title={isDark ? 'Cambiar a modo claro (Actualmente Oscuro)' : 'Cambiar a modo oscuro (Actualmente Claro)'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <div className="w-5 h-5 relative flex items-center justify-center overflow-hidden">
        <Sun
          className={`w-5 h-5 text-amber-500 transition-all duration-300 transform absolute ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`w-5 h-5 text-[#0284C7] dark:text-[#38BDF8] transition-all duration-300 transform absolute ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
