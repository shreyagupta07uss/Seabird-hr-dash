import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { api, ReconciliationRecord, ReconciliationSummary } from '../services/api';
import { 
    SectionHeader, LoadingSpinner, ErrorState, StatusBadge, 
    PriorityBadge, Pagination, DatePicker, Card, Button 
} from './SharedUI';

export default function Reconciliation() {
    const [records, setRecords] = useState<ReconciliationRecord[]>([]);
    const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [running, setRunning] = useState(false);
    const [runningMonth, setRunningMonth] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [recs, sum] = await Promise.all([
                api.getReconciliationRecords(date, page, 50),
                api.getReconciliationSummary(date)
            ]);
            setRecords(recs.data);
            setTotalPages(recs.total_pages);
            setSummary(sum);
        } catch (err: any) {
            setError(err.message || "Failed to load reconciliation data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [date, page]);

    const handleRunReconciliation = async () => {
        try {
            setRunning(true);
            await api.runReconciliation(date);
            await loadData();
            alert(`Reconciliation completed for ${date}`);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setRunning(false);
        }
    };

    // FIX: new - Tata's source file covers a full month across 30 sheets. Reconciling one
    // day at a time meant 30 manual clicks; this runs every day in the selected date's month.
    const handleRunReconciliationMonth = async () => {
        const month = date.slice(0, 7);
        if (!confirm(`Run reconciliation for every day in ${month}? This may take a minute for a full month of data.`)) return;
        try {
            setRunningMonth(true);
            const result = await api.runReconciliationMonth(month);
            await loadData();
            alert(`Reconciliation completed for ${month}: ${result.days_processed} days processed, ${result.attendance_records_created} records created, ${result.reconciliation_issues} issues flagged.`);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setRunningMonth(false);
        }
    };

    if (loading && records.length === 0) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader 
                title="Reconciliation Analysis" 
                subtitle="Compare ESSL biometric data with Tata official records"
                action={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            icon={ArrowRightLeft}
                            onClick={handleRunReconciliationMonth}
                            loading={runningMonth}
                        >
                            Run Whole Month
                        </Button>
                        <Button
                            variant="primary"
                            icon={ArrowRightLeft}
                            onClick={handleRunReconciliation}
                            loading={running}
                        >
                            Run This Date
                        </Button>
                    </div>
                }
            />

            {/* Date Selector */}
            <div className="flex items-center gap-3">
                <DatePicker value={date} onChange={setDate} label="Target Date" />
                <p className="text-xs text-slate-500">Select date and click Run Reconciliation to process</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-xs text-slate-500 uppercase">Total Records</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.total || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-slate-500 uppercase">Matched</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{summary?.matched || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-slate-500 uppercase">Mismatch</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{summary?.mismatched || 0}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-slate-500 uppercase">Critical</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{summary?.critical || 0}</p>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Missing ESSL</p>
                        <p className="text-lg font-bold text-slate-800">{summary?.missing_essl || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Missing Tata</p>
                        <p className="text-lg font-bold text-slate-800">{summary?.missing_tata || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-slate-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">No Data</p>
                        <p className="text-lg font-bold text-slate-800">{summary?.no_data || 0}</p>
                    </div>
                </Card>
            </div>

            {/* Records Table */}
            <Card>
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700">Reconciliation Records</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-3">PR Number</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">ESSL In</th>
                                <th className="px-4 py-3">ESSL Out</th>
                                <th className="px-4 py-3">Tata In</th>
                                <th className="px-4 py-3">Tata Out</th>
                                <th className="px-4 py-3">In Delta</th>
                                <th className="px-4 py-3">Out Delta</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors table-row-hover">
                                    <td className="px-4 py-3 font-medium text-slate-700">{r.pr_number}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.date}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{r.essl_in || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{r.essl_out || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{r.tata_in || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{r.tata_out || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{r.in_delta_minutes} min</td>
                                    <td className="px-4 py-3 text-slate-600">{r.out_delta_minutes} min</td>
                                    <td className="px-4 py-3"><StatusBadge status={r.match_status} /></td>
                                    <td className="px-4 py-3"><PriorityBadge priority={r.severity} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
        </div>
    );
}