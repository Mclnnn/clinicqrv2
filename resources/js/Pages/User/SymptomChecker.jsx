import { Head } from '@inertiajs/react';
import { useState } from 'react';
import UserLayout from '../../Layouts/UserLayout';

export default function SymptomChecker() {
    const [symptoms, setSymptoms] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function analyze(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setResult('');

        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        const response = await fetch('/student/symptom-checker/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                Accept: 'application/json',
            },
            body: JSON.stringify({ symptoms }),
        });

        const payload = await response.json();
        setLoading(false);

        if (!response.ok) {
            setError(payload?.message ?? 'Unable to analyze symptoms.');
            return;
        }

        setResult(payload.message);
    }

    return (
        <UserLayout title="Symptom Checker" subtitle="Initial triage guidance before visiting the clinic.">
            <Head title="Symptom Checker" />
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <form onSubmit={analyze} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <label className="text-sm font-bold text-slate-300">Describe your symptoms</label>
                    <textarea rows="10" value={symptoms} onChange={event => setSymptoms(event.target.value)} className="field mt-2" placeholder="Example: fever, cough, sore throat..." />
                    {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                    <button disabled={loading || symptoms.length < 3} className="mt-4 w-full rounded-lg bg-blue-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50">
                        {loading ? 'Checking...' : 'Analyze symptoms'}
                    </button>
                </form>

                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <h2 className="text-lg font-black">Guidance</h2>
                    {result ? (
                        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">{result}</pre>
                    ) : (
                        <p className="mt-4 text-sm leading-6 text-slate-400">The result will appear here. This is guidance only and does not replace clinic assessment.</p>
                    )}
                </section>
            </div>
        </UserLayout>
    );
}
