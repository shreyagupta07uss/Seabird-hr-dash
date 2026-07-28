import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, AlertTriangle, Clock, Briefcase, MapPin, Layers, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { api, EmployeeSummary as EmployeeSummaryData } from '../services/api';
import { SectionHeader, LoadingSpinner, ErrorState, Card, Button } from './SharedUI';

function formatHours(decimalHours: number | null | undefined): string {
    if (decimalHours == null || isNaN(decimalHours)) return '-';
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface EmployeeSummaryProps {
    initialPR?: string;
}

export default function EmployeeSummary({ initialPR }: EmployeeSummaryProps) {
    const [prNumber, setPrNumber] = useState(initialPR || '');
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [data, setData] = useState<EmployeeSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Auto-search when initialPR is passed (e.g. from Attendance click)
    useEffect(() => {
        if (initialPR) {
            setPrNumber(initialPR);
            // Small delay to ensure state is set before loading
            setTimeout(() => loadData(), 100);
        }
    }, [initialPR]);

    const loadData = async () => {
        if (!prNumber.trim()) return;
        try {
            setLoading(true);
            setError(null);
            const res = await api.getEmployeeSummary(prNumber.trim(), month);
            setData(res);
        } catch (err: any) {
            setError(err.message || "Failed to load employee summary");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const exportToCSV = () => {
        if (!data) return;
        const headers = ["Date", "Status", "Issue", "ESSL In", "ESSL Out", "Tata In", "Tata Out", "Worked Hours", "OT Hours", "Late Min", "Early Min", "Shift", "Remark"];
        const rows = data.days.map(d => [
            d.date, d.attendance_status, d.issue,
            d.essl_in || '', d.essl_out || '', d.tata_in || '', d.tata_out || '',
            d.worked_hours?.toString() || '', d.ot_hours?.toString() || '',
            d.late_minutes?.toString() || '', d.early_minutes?.toString() || '',
            d.shift || '', d.remark || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.pr_number}_${data.month}_summary.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'bg-emerald-100 text-emerald-700';
            case 'Absent': return 'bg-rose-100 text-rose-700';
            case 'Half Day': return 'bg-amber-100 text-amber-700';
            case 'Leave': return 'bg-blue-100 text-blue-700';
            case 'Week Off': return 'bg-slate-100 text-slate-600';
            case 'Single Punch': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getIssueColor = (issue: string) => {
        switch (issue) {
            case 'Late Punch': return 'text-purple-600';
            case 'Early Departure': return 'text-pink-600';
            case 'Less Working Hours': return 'text-orange-600';
            case 'Single Punch': return 'text-yellow-600';
            case 'Absent': return 'text-rose-600';
            case 'Missing ESSL Punch': return 'text-amber-600';
            case 'Missing Tata Punch': return 'text-amber-600';
            case 'Time Difference': return 'text-orange-600';
            case 'Alternate Shift': return 'text-indigo-600';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader 
                title="Employee Summary" 
                subtitle="View complete attendance breakdown, penalties & salary deductions for any employee" 
            />

            {/* Search Bar */}
            <Card className="p-5">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">PR Number</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={prNumber}
                                onChange={(e) => setPrNumber(e.target.value)}
                                placeholder="Enter PR Number..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Month</label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                    </div>
                    <Button variant="primary" icon={Search} type="submit">
                        Search
                    </Button>
                </form>
            </Card>

            {loading && <LoadingSpinner />}
            {error && <ErrorState message={error} onRetry={loadData} />}

            {data && !loading && (
                <>
                    {/* Employee Info Card */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                    <User size={28} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{data.employee.name}</h2>
                                    <p className="text-sm text-slate-500">PR: <span className="font-mono font-medium text-slate-700">{data.pr_number}</span></p>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <Briefcase size={12} /> {data.employee.vendor}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin size={12} /> {data.employee.store}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <Layers size={12} /> {data.employee.department}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                            {data.employee.designation}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            data.employee.category === 'WC' ? 'bg-blue-100 text-blue-700' :
                                            data.employee.category === 'BC' ? 'bg-green-100 text-green-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                            {data.employee.category}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                            Shift {data.employee.shift || 'G'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Month</p>
                                <p className="text-sm font-semibold text-slate-700">{data.month}</p>
                                <Button variant="secondary" icon={Download} onClick={exportToCSV} className="mt-2 text-xs">
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Summary Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <StatCard title="Total Days" value={data.summary.total_days} color="blue" />
                        <StatCard title="Present" value={data.summary.present} color="emerald" />
                        <StatCard title="Absent" value={data.summary.absent} color="rose" />
                        <StatCard title="Half Day" value={data.summary.half_day} color="amber" />
                        <StatCard title="Leave" value={data.summary.leave} color="blue" />
                        <StatCard title="Week Off" value={data.summary.weekoff} color="slate" />
                        <StatCard title="Single Punch" value={data.summary.single_punch} color="purple" />
                        <StatCard title="Late Punch" value={data.summary.late_punch} color="orange" />
                        <StatCard title="Early Dep." value={data.summary.early_departure} color="pink" />
                        <StatCard title="Less Hours" value={data.summary.less_working_hours} color="orange" />
                        <StatCard title="No Data" value={data.summary.no_data} color="gray" />
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Attendance %</p>
                            <p className="text-lg font-bold text-emerald-700">{data.summary.attendance_percentage}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wide flex items-center gap-1">
                                <Clock size={10} /> OT This Month
                            </p>
                            <p className="text-lg font-bold text-indigo-700">{formatHours(data.summary.total_ot_hours)}</p>
                        </div>
                    </div>

                    {/* Penalty Card */}
                    <Card className={`p-6 border-l-4 ${data.penalty.action_required ? 'border-l-rose-500 bg-rose-50/30' : 'border-l-emerald-500 bg-emerald-50/30'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} className={data.penalty.action_required ? 'text-rose-500' : 'text-emerald-500'} />
                            <h3 className="text-base font-bold text-slate-800">Salary Penalty Summary</h3>
                            {data.penalty.action_required && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">ACTION REQUIRED</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium">Late Punch Penalty</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-slate-800">{data.penalty.late_punch_penalty_days}</span>
                                    <span className="text-sm text-slate-500">days</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {data.penalty.late_punch_count} late punches → {data.penalty.late_punch_label}
                                </p>
                                {data.penalty.next_penalty_at > 0 && (
                                    <p className="text-xs text-amber-600">
                                        Next penalty at {data.penalty.next_penalty_at} late punches
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium">Half Day Penalty</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-slate-800">{data.penalty.half_day_penalty_days}</span>
                                    <span className="text-sm text-slate-500">days</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {data.summary.half_day} half days × 0.5 = {data.penalty.half_day_penalty_days} days
                                </p>
                            </div>
                            <div className="space-y-2 p-4 rounded-xl bg-white border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">Total Penalty to Deduct</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-rose-600">{data.penalty.total_penalty_days}</span>
                                    <span className="text-sm text-slate-500">days</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {data.penalty.late_punch_penalty_days} (late) + {data.penalty.half_day_penalty_days} (half day)
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Day-by-Day Table */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">Day-by-Day Breakdown</h3>
                            <span className="text-xs text-slate-400">{data.days.length} records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Issue</th>
                                        <th className="px-4 py-3">ESSL In/Out</th>
                                        <th className="px-4 py-3">Tata In/Out</th>
                                        <th className="px-4 py-3">Final In/Out</th>
                                        <th className="px-4 py-3">Hours</th>
                                        <th className="px-4 py-3">OT</th>
                                        <th className="px-4 py-3">Late</th>
                                        <th className="px-4 py-3">Early</th>
                                        <th className="px-4 py-3">Shift</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.days.map((day) => (
                                        <React.Fragment key={day.date}>
                                            <tr 
                                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {expandedDay === day.date ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                        <span className="font-medium text-slate-700">{formatDate(day.date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(day.attendance_status)}`}>
                                                        {day.attendance_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {day.issue !== '-' ? (
                                                        <span className={`text-xs font-medium ${getIssueColor(day.issue)}`}>{day.issue}</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                                    {day.essl_in || '-'} / {day.essl_out || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                                    {day.tata_in || '-'} / {day.tata_out || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                                                    {day.final_in || '-'} / {day.final_out || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{formatHours(day.worked_hours)}</td>
                                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{formatHours(day.ot_hours)}</td>
                                                <td className="px-4 py-3">
                                                    {day.late_minutes ? (
                                                        <span className="text-xs text-purple-600 font-medium">{day.late_minutes}m</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {day.early_minutes ? (
                                                        <span className="text-xs text-pink-600 font-medium">{day.early_minutes}m</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{day.shift || '-'}</span>
                                                </td>
                                            </tr>
                                            {expandedDay === day.date && day.remark && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={11} className="px-4 py-2">
                                                        <p className="text-xs text-slate-500">
                                                            <span className="font-medium">Remark:</span> {day.remark}
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
    const colorMap: Record<string, { bg: string; text: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700' },
        pink: { bg: 'bg-pink-50', text: 'text-pink-700' },
        slate: { bg: 'bg-slate-50', text: 'text-slate-700' },
        gray: { bg: 'bg-gray-50', text: 'text-gray-700' },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`p-3 rounded-xl ${c.bg} border border-slate-100`}>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-lg font-bold ${c.text}`}>{value}</p>
        </div>
    );
}