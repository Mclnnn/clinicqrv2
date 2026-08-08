import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    inertiaCore: ['@inertiajs/react'],
                    icons: ['lucide-react'],
                    qr: ['html5-qrcode'],
                },
            },
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/js/inertia.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
});
