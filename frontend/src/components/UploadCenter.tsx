import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileUp, CheckCircle2, XCircle, FileText, Database, Table, AlertTriangle, CalendarDays, Trash2 } from 'lucide-react';
import { api, UploadLog, UploadResult } from '../services/api';
import { SectionHeader, LoadingSpinner, ErrorState, StatusBadge, Card, Button } from './SharedUI';

interface UploadZoneProps {
    type: string;
    title: string;
    description: string;
    icon: React.ElementType;
    onUpload: (file: File, type: string) => void;
    uploading: boolean;
}

const UploadZone = ({ type, title, description, icon: Icon, onUpload, uploading }: UploadZoneProps) => {
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onUpload(file, type);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file, type);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${dragging ? 'bg-blue-100' : 'bg-slate-50'}`}>
                <Icon className={dragging ? 'text-blue-600' : 'text-slate-400'} size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">{description}</p>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
            >
                Select File
            </Button>
        </div>
    );
};

// Small check/cross pill used in the day-wise result card to show which of the
// three expected sheets (Essl In / Essl Out / Tata) were actually found.
const SheetFoundPill = ({ label, found }: { label: string; found: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${found ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
        }`}>
        {found ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {label}
    </span>
);

export default function UploadCenter() {
    const [uploads, setUploads] = useState<UploadLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    // FIX: the result of the most recent upload is now shown in the UI with row/sheet counts,
    // instead of a generic "uploaded successfully!" alert that hid whether all sheets were read.
    const [lastResult, setLastResult] = useState<UploadResult | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deletingAll, setDeletingAll] = useState(false);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await api.getUploadHistory();
            setUploads(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadHistory(); }, []);

    const handleUpload = async (file: File, type: string) => {
        try {
            setUploadingType(type);
            setLastResult(null);
            let result: UploadResult;
            switch (type) {
                case 'master': result = await api.uploadMaster(file, true); break;
                case 'essl': result = await api.uploadESSL(file); break;
                case 'tata': result = await api.uploadTata(file); break;
                case 'tata_all': result = await api.uploadTataAll(file); break;
                // New: single workbook with 'Essl In' / 'Essl Out' / 'Tata' sheets for one day.
                // The backend auto-detects the date from the Tata sheet, so no extra input needed here.
                case 'daywise': result = await api.uploadDaywise(file); break;
                default: throw new Error(`Unknown upload type: ${type}`);
            }
            setLastResult(result);
            await loadHistory();
        } catch (err: any) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploadingType(null);
        }
    };

    const handleDelete = async (id: number, filename: string, type: string) => {
        // Destructive action - confirm first. Note: this only removes the log entry
        // (and lets the same file be re-uploaded) - it does not undo the attendance
        // rows that upload created.
        const confirmed = window.confirm(
            `Remove "${filename}" from upload history?\n\nThis will DELETE all raw attendance rows AND all derived data (Attendance, Reconciliation, HR Actions, Overtime) for the dates covered by this upload. For Master files, this DELETES all employees created by that master. This action cannot be undone.`
        );
        if (!confirmed) return;
        try {
            setDeletingId(id);
            await api.deleteUpload(id);
            await loadHistory();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = window.confirm(
            'Delete ALL uploads and reset the dashboard?\n\nThis permanently deletes every uploaded file record, employee, attendance row, reconciliation result, HR action, alert, vendor, store, and department. The dashboard will return to zero employees. This cannot be undone.'
        );
        if (!confirmed) return;

        try {
            setDeletingAll(true);
            const result = await api.deleteAllUploads();
            setUploads([]);
            setLastResult(null);
            window.dispatchEvent(new CustomEvent('dashboard-data-reset'));
            alert(`${result.message}\n\nRemaining employees: ${result.remaining.employees}`);
        } catch (err: any) {
            alert(`Failed to delete all uploads: ${err.message}`);
        } finally {
            setDeletingAll(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadHistory} />;

    const uploadZones = [
        { type: 'daywise', title: 'Day-wise (ESSL + Tata)', description: "One day's combined workbook - 'Essl In', 'Essl Out', and 'Tata' sheets in a single file. Date is auto-detected.", icon: CalendarDays },
        { type: 'master', title: 'Master Data', description: 'Employee roster (PR, Bio, WC/BC, Vendor, Store, Designation)', icon: Database },
        { type: 'essl', title: 'ESSL Biometric', description: 'Raw biometric punches from ESSL machine (cross-tab format)', icon: FileText },
        { type: 'tata', title: 'Tata Daily', description: 'Official daily attendance from Tata - reads every sheet (one per day)', icon: Table },
        { type: 'tata_all', title: 'Tata All (Monthly)', description: 'Monthly historical data for trends and analytics', icon: FileUp }
    ];

    // A multi-sheet file (Tata) where only 1 sheet got read is a strong signal something's wrong
    // with the file format - flag it instead of letting it pass silently.
    const suspiciouslyFewSheets = lastResult?.sheets_read !== undefined && lastResult.sheets_read <= 1;
    const isDaywiseResult = lastResult?.type === 'daywise';

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader title="Upload Center" subtitle="Upload Master, ESSL, Tata, Tata All, and Day-wise combined files" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {uploadZones.map((zone) => (
                    <UploadZone
                        key={zone.type}
                        {...zone}
                        onUpload={handleUpload}
                        uploading={uploadingType === zone.type}
                    />
                ))}
            </div>

            {lastResult && isDaywiseResult && (
                <Card className="p-4 flex items-start gap-3 border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm w-full">
                        <p className="font-semibold text-slate-800">
                            {lastResult.filename}: attendance stored for {lastResult.date}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <SheetFoundPill label="Essl In" found={!!lastResult.sheets_found?.essl_in} />
                            <SheetFoundPill label="Essl Out" found={!!lastResult.sheets_found?.essl_out} />
                            <SheetFoundPill label="Tata" found={!!lastResult.sheets_found?.tata} />
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                            {lastResult.essl_rows_processed?.toLocaleString()} ESSL rows · {lastResult.tata_rows_processed?.toLocaleString()} Tata rows processed.
                        </p>
                        {lastResult.message && <p className="text-xs text-slate-600 mt-0.5">{lastResult.message}</p>}
                    </div>
                </Card>
            )}

            {lastResult && !isDaywiseResult && (
                <Card className={`p-4 flex items-start gap-3 ${suspiciouslyFewSheets ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    {suspiciouslyFewSheets ? (
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    ) : (
                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    )}
                    <div className="text-sm">
                        <p className="font-semibold text-slate-800">
                            {lastResult.filename}: {lastResult.rows_processed?.toLocaleString() ?? lastResult.monthly_records_created?.toLocaleString()} rows processed
                        </p>
                        {lastResult.sheets_read !== undefined && (
                            <p className="text-xs text-slate-600 mt-0.5">
                                {lastResult.sheets_read} sheet(s) read, {lastResult.sheets_skipped} skipped.
                                {suspiciouslyFewSheets && ' Expected ~30 sheets (one per day) for a full month of Tata data - check the file if this looks low.'}
                            </p>
                        )}
                        {lastResult.message && <p className="text-xs text-slate-600 mt-0.5">{lastResult.message}</p>}
                    </div>
                </Card>
            )}

            <Card>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-700">Upload History</h3>
                    {uploads.length > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDeleteAll}
                            loading={deletingAll}
                        >
                            Delete All Uploads
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Filename</th>
                                <th className="px-6 py-3">Rows</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {uploads.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No uploads yet</td></tr>
                            ) : uploads.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 table-row-hover">
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium uppercase">{u.type}</span>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-700">{u.filename}</td>
                                    <td className="px-6 py-3 text-slate-500">{u.rows_processed.toLocaleString()}</td>
                                    <td className="px-6 py-3"><StatusBadge status={u.status} /></td>
                                    <td className="px-6 py-3 text-slate-500">{new Date(u.uploaded_at).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(u.id, u.filename, u.type)}
                                            disabled={deletingId === u.id}
                                            title="Remove from history"
                                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
