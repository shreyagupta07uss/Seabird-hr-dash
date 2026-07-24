import React, { useState, useEffect } from 'react';
import { FileText, Download, BarChart3, Clock, AlertTriangle, FileUp, CalendarDays, Calendar } from 'lucide-react';
import { api, ReportItem } from '../services/api';
import { SectionHeader, LoadingSpinner, ErrorState, Card, Button } from './SharedUI';

function MonthPicker({ value, onChange, label }: { value: string, onChange: (v: string) => void, label?: string }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-medium text-slate-500">{label}</label>}
            <input
                type="month"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-40"
            />
        </div>
    );
}

function DatePicker({ value, onChange, label }: { value: string, onChange: (v: string) => void, label?: string }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-medium text-slate-500">{label}</label>}
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-40"
            />
        </div>
    );
}

function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

export default function Reports() {
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
    const [dumpMode, setDumpMode] = useState<'monthly' | 'daily'>('monthly');

    const [vendorOptions, setVendorOptions] = useState<string[]>([]);
    const [storeOptions, setStoreOptions] = useState<string[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
    const [vendor, setVendor] = useState('');
    const [store, setStore] = useState('');
    const [department, setDepartment] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, v, s, d] = await Promise.all([
                api.getReports(),
                api.getVendorNames().catch(() => []),
                api.getStoreNames().catch(() => []),
                api.getDepartmentNames().catch(() => [])
            ]);
            setReports(data);
            setVendorOptions(v);
            setStoreOptions(s);
            setDepartmentOptions(d);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleDownload = async (reportType: string) => {
        try {
            setDownloading(reportType);
            let blob: Blob;
            let filename: string;
            switch (reportType) {
                case 'dump':
                    if (dumpMode === 'daily') {
                        blob = await api.downloadDumpReport({
                            targetDate,
                            vendor: vendor || undefined,
                            store: store || undefined,
                            department: department || undefined
                        });
                        filename = `seabird_dump_${targetDate}.xlsx`;
                    } else {
                        blob = await api.downloadDumpReport({
                            month,
                            vendor: vendor || undefined,
                            store: store || undefined,
                            department: department || undefined
                        });
                        filename = `seabird_dump_${month}.xlsx`;
                    }
                    break;
                case 'monthly':
                    blob = await api.downloadMonthlyReport(month);
                    filename = `seabird_monthly_${month}.csv`;
                    break;
                case 'ot':
                    blob = await api.downloadOtReport(month, vendor || undefined, store || undefined);
                    filename = `seabird_ot_${month}.csv`;
                    break;
                case 'late':
                    blob = await api.downloadLateReport(month, vendor || undefined, store || undefined);
                    filename = `seabird_late_punch_${month}.csv`;
                    break;
                default:
                    throw new Error(`Unknown report type: ${reportType}`);
            }
            downloadBlob(blob, filename);
        } catch (err: any) {
            alert(`Download failed: ${err.message}`);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    const reportIcons: Record<string, React.ElementType> = {
        dump: FileUp,
        monthly: BarChart3,
        ot: Clock,
        late: AlertTriangle,
    };

    const reportColors: Record<string, string> = {
        dump: 'bg-blue-50 text-blue-600',
        monthly: 'bg-emerald-50 text-emerald-600',
        ot: 'bg-amber-50 text-amber-600',
        late: 'bg-rose-50 text-rose-600',
    };

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader title="Reports" subtitle="Generate and download HR analytics reports" />

            <div className="flex flex-wrap items-end gap-4">
                <MonthPicker value={month} onChange={setMonth} label="Report Period (Month)" />
                <p className="text-xs text-slate-500 mb-1">Used for Monthly, OT, Late Punch reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map(r => {
                    const Icon = reportIcons[r.type] || FileText;
                    const colorClass = reportColors[r.type] || 'bg-slate-50 text-slate-600';
                    return (
                        <Card key={r.id} className="p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700">{r.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                                </div>
                            </div>
                            <Button variant="ghost" icon={Download} loading={downloading === r.type} onClick={() => handleDownload(r.type)}>
                                Download
                            </Button>
                        </Card>
                    );
                })}
            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <FileUp size={16} className="text-blue-600" />
                        Dump Report — Custom Filters
                    </h3>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setDumpMode('monthly')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${dumpMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <CalendarDays size={14} /> Monthly
                        </button>
                        <button onClick={() => setDumpMode('daily')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${dumpMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Calendar size={14} /> Single Day
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    {dumpMode === 'monthly' ? (
                        <div className="flex items-center gap-3">
                            <MonthPicker value={month} onChange={setMonth} label="Dump Month" />
                            <p className="text-xs text-slate-400">One sheet per date + Summary sheet</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <DatePicker value={targetDate} onChange={setTargetDate} label="Dump Date" />
                            <p className="text-xs text-slate-400">Single sheet for selected date</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Vendor</label>
                        <select value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="">All Vendors</option>
                            {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Store</label>
                        <select value={store} onChange={(e) => setStore(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="">All Stores</option>
                            {storeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Department</label>
                        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="">All Departments</option>
                            {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="primary" icon={FileUp} loading={downloading === 'dump'} onClick={() => handleDownload('dump')}>
                        {downloading === 'dump' ? 'Generating...' : dumpMode === 'monthly' ? 'Download Monthly Dump (.xlsx)' : `Download ${targetDate} Dump (.xlsx)`}
                    </Button>
                </div>
            </Card>
        </div>
    );
}