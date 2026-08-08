import { Head } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function Clearances({ clearances }) {
    return (
        <AdminLayout title="Clearances Table" subtitle="Raw clearance records.">
            <Head title="Clearances Table" />
            <DataTable rows={clearances} columns={['clearance_id', 'patient_name', 'clearance_type', 'purpose', 'status', 'signer_name']} />
        </AdminLayout>
    );
}

function DataTable({ rows, columns }) {
    return <div className="overflow-auto rounded-lg border border-white/10 bg-white/[0.04]"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase text-slate-500"><tr>{columns.map(column => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.clearance_id ?? index} className="border-b border-white/5">{columns.map(column => <td key={column} className="px-4 py-3 text-slate-300">{String(row[column] ?? '-')}</td>)}</tr>)}</tbody></table></div>;
}
