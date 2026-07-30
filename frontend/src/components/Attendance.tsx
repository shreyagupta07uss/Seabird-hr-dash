import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import { api, AttendanceRecord } from '../services/api';
import {
    SectionHeader, LoadingSpinner, ErrorState, StatusBadge,
    Pagination, SearchInput, DatePicker, Card, Button
} from './SharedUI';


// Format decimal hours to HH:MM (e.g. 12.95 → "12h 57m")
function formatHours(decimalHours: number | null | undefined): string {
    if (decimalHours == null || isNaN(decimalHours)) return '-';
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export default function Attendance() {
    const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [issueFilter, setIssueFilter] = useState('all');
    const [otFilter, setOtFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [assignedShiftFilter, setAssignedShiftFilter] = useState('all');
    const [workedShiftFilter, setWorkedShiftFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [vendor, setVendor] = useState('');
    const [store, setStore] = useState('');
    const [department, setDepartment] = useState('');

    const [vendorOptions, setVendorOptions] = useState<string[]>([]);
    const [storeOptions, setStoreOptions] = useState<string[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

    const loadFilterOptions = async () => {
        try {
            const [v, s, d] = await Promise.all([
                api.getVendorNames(), api.getStoreNames(), api.getDepartmentNames()
            ]);
            setVendorOptions(v);
            setStoreOptions(s);
            setDepartmentOptions(d);
        } catch {
            // Non-fatal
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const all: AttendanceRecord[] = [];
            let pageNum = 1;
            let totalPages = 1;
            const pageSize = 200;

            while (pageNum <= totalPages) {
                const res = await api.getDailyAttendance(
                    date,
                    vendor || undefined,
                    store || undefined,
                    department || undefined,
                    filter !== 'all' ? filter : undefined,
                    undefined,
                    pageNum,
                    pageSize
                );
                all.push(...res.data);
                totalPages = res.total_pages;
                pageNum++;
                if (res.data.length < pageSize) break;
            }
            setAllRecords(all);
        } catch (err: any) {
            setError(err.message || "Failed to load attendance");
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndPaginate = () => {
        let filtered = [...allRecords];

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter((r: any) =>
                (r.pr_number || '').toLowerCase().includes(q) ||
                (r.name || '').toLowerCase().includes(q)
            );
        }

        if (issueFilter !== 'all') {
            filtered = filtered.filter((r: any) => r.issue === issueFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter((r: any) => r.category === categoryFilter);
        }

        if (assignedShiftFilter !== 'all') {
            filtered = filtered.filter((r: any) => (r.assigned_shift || 'G') === assignedShiftFilter);
        }

        if (workedShiftFilter !== 'all') {
            filtered = filtered.filter((r: any) => {
                const ws = r.worked_shift || r.assigned_shift || 'G';
                return ws === workedShiftFilter;
            });
        }

        if (otFilter !== 'all') {
            filtered = filtered.filter((r: any) => {
                const ot = parseFloat(r.ot_hours) || 0;
                if (otFilter === 'OT > 2hrs') return ot > 2;
                if (otFilter === 'OT < 2hrs') return ot > 0 && ot < 2;
                if (otFilter === 'OT = 4hrs') return ot >= 3.5 && ot <= 4.5;
                return true;
            });
        }

        const pageSize = 50;
        const total = Math.ceil(filtered.length / pageSize);
        setTotalPages(total || 1);

        const safePage = Math.min(page, total || 1);
        if (safePage !== page) setPage(safePage);

        const start = (safePage - 1) * pageSize;
        const paginated = filtered.slice(start, start + pageSize);
        setRecords(paginated);
    };

    useEffect(() => {
        applyFiltersAndPaginate();
    }, [allRecords, search, issueFilter, categoryFilter, assignedShiftFilter, workedShiftFilter, otFilter, page]);

    useEffect(() => { loadFilterOptions(); }, []);
    useEffect(() => { loadData(); }, [date, filter, vendor, store, department]);

    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    if (loading && records.length === 0) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    const statusFilters = ['all', 'Present', 'Absent'];
    const otFilters = ['all', 'OT > 2hrs', 'OT < 2hrs', 'OT = 4hrs'];
    const issueFilters = ['all', 'Missing ESSL Punch', 'Missing Tata Punch', 'No Data', 'Alternate Shift', 'Time Difference', 'Single Punch', 'Late Punch', 'Early Departure', 'Week Off', 'Absent'];

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader title="Daily Attendance Register" subtitle="View and manage daily attendance records" />

            <div className="flex flex-wrap gap-3 items-end">
                <DatePicker value={date} onChange={setDate} label="Date" />
                <SearchInput value={search} onChange={setSearch} placeholder="Search PR, Name..." />
                <select
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Vendors</option>
                    {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Stores</option>
                    {storeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Departments</option>
                    {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="all">All Categories</option>
                    <option value="WC">WC</option>
                    <option value="BC">BC</option>
                    <option value="FLD">FLD</option>
                </select>
                <select
                    value={assignedShiftFilter}
                    onChange={(e) => { setAssignedShiftFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="all">All Assigned Shifts</option>
                    <option value="A">A (6:30-15:00)</option>
                    <option value="B">B (15:00-23:30)</option>
                    <option value="G">G (8:30-17:00)</option>
                    <option value="C">C (23:30-06:30)</option>
                </select>
                <select
                    value={workedShiftFilter}
                    onChange={(e) => { setWorkedShiftFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="all">All Worked Shifts</option>
                    <option value="A">A (6:30-15:00)</option>
                    <option value="B">B (15:00-23:30)</option>
                    <option value="G">G (8:30-17:00)</option>
                    <option value="C">C (23:30-06:30)</option>
                    <option value="A&G">A &amp; G</option>
                    <option value="G&B">G &amp; B</option>
                    <option value="A&B/2">A &amp; B /2</option>
                    <option value="G&A">G &amp; A</option>
                    <option value="B&G">B &amp; G</option>
                </select>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-slate-500 font-medium mr-1">Status:</span>
                {statusFilters.map(f => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-slate-500 font-medium mr-1">Issue:</span>
                <select
                    value={issueFilter}
                    onChange={(e) => { setIssueFilter(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    {issueFilters.map(f => <option key={f} value={f}>{f === 'all' ? 'All Issues' : f}</option>)}
                </select>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-slate-500 font-medium mr-1">OT:</span>
                {otFilters.map(f => (
                    <button
                        key={f}
                        onClick={() => { setOtFilter(f); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${otFilter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {f === 'all' ? 'All OT' : f}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-100">
                <button
                    onClick={() => {
                        setFilter('all');
                        setIssueFilter('all');
                        setOtFilter('all');
                        setCategoryFilter('all');
                        setAssignedShiftFilter('all');
                        setWorkedShiftFilter('all');
                        setSearch('');
                        setVendor('');
                        setStore('');
                        setDepartment('');
                        setPage(1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    Clear All Filters
                </button>
                <span className="text-xs font-semibold text-slate-500">
                    Showing <span className="text-slate-800">{records.length}</span> of <span className="text-slate-800">{allRecords.length}</span> records
                </span>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-3">PR Number</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Assigned Shift</th>
                                <th className="px-4 py-3">Worked Shift</th>
                                <th className="px-4 py-3">ESSL In</th>
                                <th className="px-4 py-3">ESSL Out</th>
                                <th className="px-4 py-3">Tata In</th>
                                <th className="px-4 py-3">Tata Out</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Hours</th>
                                <th className="px-4 py-3">OT</th>
                                <th className="px-4 py-3">Issue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.length === 0 ? (
                                <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                                    No attendance records for {date}. Run reconciliation for this date first.
                                </td></tr>
                            ) : records.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors table-row-hover">
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { 
                                                detail: { page: 'employee-summary', pr_number: r.pr_number } 
                                            }))}
                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        >
                                            {r.pr_number}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{r.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.vendor}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            r.category === 'WC' ? 'bg-blue-100 text-blue-700' :
                                            r.category === 'BC' ? 'bg-green-100 text-green-700' :
                                            r.category === 'FLD' ? 'bg-purple-100 text-purple-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {r.category || 'BC'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">{r.assigned_shift || 'G'}</span></td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.worked_shift !== r.assigned_shift ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{r.worked_shift || r.assigned_shift || 'G'}</span></td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{r.essl_in || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{r.essl_out || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{r.tata_in || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500 font-mono">{r.tata_out || '-'}</td>
                                    <td className="px-4 py-3"><StatusBadge status={r.attendance_status} /></td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{formatHours(r.worked_hours)}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono">{formatHours(r.ot_hours)}</td>
                                    <td className="px-4 py-3">
                                        {r.issue && r.issue !== '-' ? (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                r.issue === 'Absent' ? 'bg-rose-100 text-rose-700' :
                                                r.issue === 'No Data' ? 'bg-rose-100 text-rose-700' :
                                                r.issue === 'Missing ESSL Punch' ? 'bg-amber-100 text-amber-700' :
                                                r.issue === 'Missing Tata Punch' ? 'bg-amber-100 text-amber-700' :
                                                r.issue === 'Time Difference (>15 min)' ? 'bg-red-100 text-red-700' :
                                                r.issue === 'Time Difference' ? 'bg-orange-100 text-orange-700' :
                                                r.issue === 'Single Punch' ? 'bg-yellow-100 text-yellow-700' :
                                                r.issue === 'Late Punch' ? 'bg-purple-100 text-purple-700' :
                                                r.issue === 'Early Departure' ? 'bg-pink-100 text-pink-700' :
                                                r.issue === 'Alternate Shift' ? 'bg-indigo-100 text-indigo-700' :
                                                r.issue === 'Week Off' ? 'bg-slate-100 text-slate-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>{r.issue}</span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
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