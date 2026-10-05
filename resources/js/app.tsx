import './lib/translateFix';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/index.css';

createInertiaApp({
    title: (title) => title ? `${title} — ClinicSoft` : 'ClinicSoft',
    resolve: (name) =>
        resolvePageComponent(
            `./app/pages/${name}.tsx`,
            import.meta.glob('./app/pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <ThemeProvider>
                    <App {...props} />
                </ThemeProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#14B8A6',
    },
});

