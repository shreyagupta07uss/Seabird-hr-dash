import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, UserCheck, UserX, Zap } from 'lucide-react';
import { api, HRActionItem } from '../services/api';
import { 
    SectionHeader, LoadingSpinner, ErrorState, StatusBadge, 
    PriorityBadge, Pagination, Card, Button, Modal 
} from './SharedUI';

export default function HRActions() {
    const [actions, setActions] = useState<HRActionItem[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [resolution, setResolution] = useState('');
    const [showModal, setShowModal] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [queue, sum] = await Promise.all([
                api.getActionQueue(page, 50),
                api.getActionSummary()
            ]);
            setActions(queue.data);
            setTotalPages(queue.total_pages);
            setSummary(sum);
        } catch (err: any) {
            setError(err.message || "Failed to load HR actions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page]);

    const handleResolve = async () => {
        if (!resolvingId || !resolution.trim()) return;
        try {
            await api.resolveAction(resolvingId, resolution);
            setShowModal(false);
            setResolution('');
            setResolvingId(null);
            await loadData();
        } catch (err: any) {
            alert(`Failed to resolve: ${err.message}`);
        }
    };

    const openResolve = (id: number) => {
        setResolvingId(id);
        setResolution('');
        setShowModal(true);
    };

    if (loading && actions.length === 0) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    const summaryCards = [
        { label: 'Reconciliation', value: summary?.reconciliation || 0, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
        { label: 'Missing Punches', value: summary?.missing_punches || 0, icon: UserX, color: 'bg-rose-50 text-rose-600' },
        { label: 'Late Punches', value: summary?.late_punches || 0, icon: Clock, color: 'bg-blue-50 text-blue-600' },
        { label: 'Total Open', value: summary?.total_open || 0, icon: AlertCircle, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader title="HR Action Center" subtitle="Manage and resolve HR actions and anomalies" />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => (
                    <Card key={idx} className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">{card.label}</p>
                            <p className="text-xl font-bold text-slate-800">{card.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Assigned</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {actions.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No open actions</td></tr>
                            ) : actions.map(a => (
                                <tr key={a.id} className="hover:bg-slate-50 table-row-hover">
                                    <td className="px-4 py-3 font-medium text-slate-700">#{a.id}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{a.type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 max-w-md">
                                        <p className="truncate">{a.description}</p>
                                    </td>
                                    <td className="px-4 py-3"><PriorityBadge priority={a.priority} /></td>
                                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                                    <td className="px-4 py-3 text-slate-500">{a.assigned_to}</td>
                                    <td className="px-4 py-3">
                                        {a.status === 'Open' && (
                                            <Button variant="success" size="sm" icon={CheckCircle2} onClick={() => openResolve(a.id)}>
                                                Resolve
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>

            <Modal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                title="Resolve Action"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Enter resolution details for action #{resolvingId}:</p>
                    <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe the resolution..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="success" size="sm" icon={CheckCircle2} onClick={handleResolve}>
                            Confirm Resolve
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
