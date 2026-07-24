import React from 'react';
import { 
    LayoutDashboard, Calendar, Users, Building2, Store, 
    Briefcase, Clock, FileText, Upload, AlertCircle, 
    Settings, ChevronLeft, Search, Bell, Menu, ChevronRight,
    TrendingUp, TrendingDown, UserCheck, UserX, Clock4,
    ArrowRightLeft, Zap, Layers, BarChart3, Download,
    CheckCircle2, AlertTriangle, XCircle, X, Loader2,
    Filter, ChevronDown, Eye, Trash2, Edit, Plus, FileUp
} from 'lucide-react';

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================

export const KPICard = ({ title, value, subtext, icon: Icon, trend, colorClass, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white rounded-xl p-5 border border-slate-100 shadow-sm card-lift cursor-pointer ${onClick ? 'hover:border-blue-200' : ''}`}
    >
        <div className="flex justify-between items-start mb-3">
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
        <div className="flex items-center gap-2">
            {trend !== undefined && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
            <p className="text-xs text-slate-400">{subtext}</p>
        </div>
    </div>
);

export const SectionHeader = ({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) => (
    <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
    </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        'Present': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Absent': 'bg-rose-50 text-rose-700 border-rose-200',
        'Late Punch': 'bg-amber-50 text-amber-700 border-amber-200',
        'Single Punch': 'bg-orange-50 text-orange-700 border-orange-200',
        'Early Departure': 'bg-blue-50 text-blue-700 border-blue-200',
        'Less Working Hours': 'bg-purple-50 text-purple-700 border-purple-200',
        'Matched': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Mismatch': 'bg-rose-50 text-rose-700 border-rose-200',
        'Missing ESSL': 'bg-amber-50 text-amber-700 border-amber-200',
        'Missing Tata': 'bg-orange-50 text-orange-700 border-orange-200',
        'No Data': 'bg-slate-50 text-slate-700 border-slate-200',
        'Open': 'bg-amber-50 text-amber-700 border-amber-200',
        'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
        'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
        'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
        'ACTIVE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'INACTIVE': 'bg-rose-50 text-rose-700 border-rose-200',
        'OK': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'NOT OK': 'bg-rose-50 text-rose-700 border-rose-200',
        'P': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'A': 'bg-rose-50 text-rose-700 border-rose-200',
        'SP': 'bg-orange-50 text-orange-700 border-orange-200',
        'L': 'bg-blue-50 text-blue-700 border-blue-200',
        'HD': 'bg-purple-50 text-purple-700 border-purple-200',
        'WO': 'bg-slate-50 text-slate-700 border-slate-200',
    };
    const displayText: Record<string, string> = {
        'P': 'Present', 'A': 'Absent', 'SP': 'Single Punch', 'L': 'Leave', 'HD': 'Half Day', 'WO': 'Week Off',
        'ACTIVE': 'Active', 'INACTIVE': 'Inactive', 'OK': 'OK', 'NOT OK': 'Not OK'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {displayText[status] || status}
        </span>
    );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
        'High': 'bg-rose-100 text-rose-700',
        'Medium': 'bg-amber-100 text-amber-700',
        'Low': 'bg-blue-100 text-blue-700',
        'Critical': 'bg-rose-200 text-rose-800',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || 'bg-slate-100 text-slate-600'}`}>
            {priority}
        </span>
    );
};

export const LoadingSpinner = ({ size = 32 }: { size?: number }) => (
    <div className="flex items-center justify-center h-64">
        <Loader2 size={size} className="animate-spin text-blue-600" />
    </div>
);

export const EmptyState = ({ message = "No data available" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <Layers size={32} className="mb-2 opacity-50" />
        <p className="text-sm">{message}</p>
    </div>
);

export const ErrorState = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
    <div className="flex flex-col items-center justify-center h-48 text-rose-500">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="mt-3 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors">
                Retry
            </button>
        )}
    </div>
);

export const Pagination = ({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
                <button 
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                    Previous
                </button>
                <button 
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export const Toast = ({ message, type = 'info', onClose }: { message: string, type?: string, onClose: () => void }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle2 size={16} />,
        error: <XCircle size={16} />,
        warning: <AlertTriangle size={16} />,
        info: <Bell size={16} />
    };

    return (
        <div className={`toast toast-${type} flex items-center gap-2`}>
            {icons[type as keyof typeof icons]}
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }: { toasts: any[], removeToast: (id: number) => void }) => (
    <div className="toast-container">
        {toasts.map((t: any) => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
    </div>
);

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};

export const FilterBar = ({ filters, onFilterChange }: { filters: any, onFilterChange: (key: string, value: string) => void }) => (
    <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(filters).map(([key, value]: [string, any]) => (
            <select
                key={key}
                value={value || ''}
                onChange={(e) => onFilterChange(key, e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
                <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                {/* Options populated by parent */}
            </select>
        ))}
    </div>
);

export const SearchInput = ({ value, onChange, placeholder = "Search..." }: { value: string, onChange: (v: string) => void, placeholder?: string }) => (
    <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input 
            type="text" 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
    </div>
);

export const DatePicker = ({ value, onChange, label }: { value: string, onChange: (v: string) => void, label?: string }) => (
    <div className="flex flex-col gap-1">
        {label && <label className="text-xs font-medium text-slate-500">{label}</label>}
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
    </div>
);

export const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md', 
    icon: Icon,
    loading = false,
    disabled = false
}: any) => {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-sm',
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
            {children}
        </button>
    );
};

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>
        {children}
    </div>
);

export const DataTable = ({ 
    headers, 
    rows, 
    keyExtractor,
    emptyMessage = "No records found"
}: any) => {
    if (!rows || rows.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                        {headers.map((h: any, i: number) => (
                            <th key={i} className="px-4 py-3">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row: any, i: number) => (
                        <tr key={keyExtractor ? keyExtractor(row, i) : i} className="hover:bg-slate-50 transition-colors table-row-hover">
                            {row}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
