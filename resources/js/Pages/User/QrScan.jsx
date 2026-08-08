import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';

function canOpen(value) {
    try {
        const url = new URL(value, window.location.origin);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function getAllowedQrUrl(value) {
    try {
        const url = new URL(value, window.location.origin);
        const path = url.pathname.replace(/\/+$/, '');
        const isClinicCheckin = path.startsWith('/clinic/checkin/');
        const isEventAttendance = path.startsWith('/attendance/scan/');

        return isClinicCheckin || isEventAttendance ? url : null;
    } catch {
        return null;
    }
}

export default function QrScan() {
    const scannerRef = useRef(null);
    const [manualUrl, setManualUrl] = useState('');
    const [scanValue, setScanValue] = useState('');
    const [status, setStatus] = useState('Ready to scan a ClinicQR code.');
    const [scanning, setScanning] = useState(false);
    const [supported, setSupported] = useState(Boolean(navigator.mediaDevices?.getUserMedia));

    useEffect(() => {
        return stopCamera;
    }, []);

    async function startCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            setSupported(false);
            setStatus('Camera QR scanning is not supported here. Paste the QR link instead.');
            return;
        }

        try {
            setStatus('Opening camera...');
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('cq-qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1,
                },
                decodedText => {
                    const qrUrl = getAllowedQrUrl(decodedText);
                    setScanValue(decodedText);
                    stopCamera();

                    if (qrUrl) {
                        setStatus('QR detected. Opening check-in page...');
                        window.location.href = qrUrl.toString();
                        return;
                    }

                    setStatus('This QR is not a public ClinicQR check-in or event attendance code.');
                },
                () => {}
            );

            setScanning(true);
            setStatus('Point your camera at the clinic or event QR code.');
        } catch {
            setStatus('Camera permission was blocked or unavailable. Paste the QR link instead.');
            setSupported(false);
        }
    }

    function stopCamera() {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        setScanning(false);

        if (scanner?.isScanning) {
            scanner.stop().then(() => {
                try {
                    scanner.clear();
                } catch {}
            }).catch(() => {});
        } else if (scanner) {
            try {
                scanner.clear();
            } catch {}
        }
    }

    function openManual(event) {
        event.preventDefault();

        if (!canOpen(manualUrl)) {
            setStatus('Paste a valid QR link first.');
            return;
        }

        window.location.href = new URL(manualUrl, window.location.origin).toString();
    }

    return (
        <UserLayout title="QR Scan" subtitle="Scan clinic and event QR codes from your phone.">
            <Head title="QR Scan" />

            <section className="cq-glass cq-scan-card p-5 sm:p-7">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="cq-scan-orb mx-auto">QR</div>
                    <h2 className="cq-font-display mt-5 text-3xl font-black">Scan ClinicQR</h2>
                    <p className="mt-3 text-sm leading-6 text-white/55">{status}</p>
                </div>

                <div className="cq-scan-frame mt-6">
                    <div id="cq-qr-reader" className="h-full w-full"></div>
                    {!scanning && (
                        <div className="cq-scan-placeholder">
                            <div className="text-sm font-bold text-white/60">{supported ? 'Camera preview will appear here.' : 'Use the fallback below.'}</div>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={scanning ? stopCamera : startCamera} className="cq-primary-btn flex-1 border-0">
                        {scanning ? 'Stop Camera' : 'Start QR Scan'}
                    </button>
                </div>

                <form onSubmit={openManual} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <label className="text-xs font-black uppercase tracking-widest text-white/55">Manual fallback</label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input value={manualUrl} onChange={event => setManualUrl(event.target.value)} className="field" placeholder="Paste QR link here" />
                        <button className="rounded-lg bg-blue-300 px-5 py-3 font-black text-slate-950">Open</button>
                    </div>
                </form>

                {scanValue && (
                    <div className="mt-4 break-all rounded-xl border border-blue-300/20 bg-blue-300/10 p-3 text-sm text-blue-100">
                        Last detected: {scanValue}
                    </div>
                )}
            </section>
        </UserLayout>
    );
}
