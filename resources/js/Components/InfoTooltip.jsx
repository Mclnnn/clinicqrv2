import { Info } from 'lucide-react';

export default function InfoTooltip({ text, label = 'More information', side = 'top', children }) {
    const position = {
        top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        'top-end': 'bottom-full right-0 mb-2',
        bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
        left: 'right-full top-1/2 mr-2 -translate-y-1/2',
        right: 'left-full top-1/2 ml-2 -translate-y-1/2',
    }[side] ?? 'bottom-full left-1/2 mb-2 -translate-x-1/2';

    return (
        <span className="group/tooltip relative inline-flex align-middle" aria-label={label}>
            {children ?? <Info size={14} className="cursor-help text-cyan-200/80 transition group-hover/tooltip:text-cyan-100" aria-hidden="true" />}
            <span role="tooltip" className={`pointer-events-none absolute z-50 w-64 rounded-xl border border-cyan-300/30 bg-slate-950 px-3 py-2 text-left text-xs font-medium normal-case leading-5 tracking-normal text-slate-100 opacity-0 shadow-2xl shadow-slate-950/70 transition duration-150 group-hover/tooltip:opacity-100 ${position}`}>
                {text}
            </span>
        </span>
    );
}
