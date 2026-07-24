import React, { useState, useEffect } from 'react';
import { Users, Search, Filter } from 'lucide-react';
import { api, Employee } from '../services/api';
import {
    SectionHeader, LoadingSpinner, ErrorState, StatusBadge,
    Pagination, SearchInput, Card, Button
} from './SharedUI';

export default function Employees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [vendor, setVendor] = useState('');
    const [store, setStore] = useState('');
    const [department, setDepartment] = useState('');
    const [status, setStatus] = useState('');

    // FIX: dropdown options used to be hardcoded ("SeaBird, Venus, Apex...", "Store A/B/C/D")
    // and didn't match any real value in the data (real vendors are SLL/SG/SSE), so every
    // filter silently returned zero rows. These now come from the live employee data.
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
            // Non-fatal - filters just stay empty if this fails
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.getEmployees(
                search || undefined,
                vendor || undefined,
                store || undefined,
                department || undefined,
                status || undefined,
                page,
                50
            );
            setEmployees(res.data);
            setTotalPages(res.total_pages);
        } catch (err: any) {
            setError(err.message || "Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadFilterOptions(); }, []);
    useEffect(() => { loadData(); }, [page, vendor, store, department, status]);

    useEffect(() => {
        const timer = setTimeout(() => { setPage(1); loadData(); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    if (loading && employees.length === 0) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    return (
        <div className="space-y-6 fade-in">
            <SectionHeader title="Employee Directory" subtitle="Manage master employee data" />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end">
                <SearchInput value={search} onChange={setSearch} placeholder="Search PR, Code, Name..." />
                <select
                    value={vendor}
                    onChange={(e) => { setVendor(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Vendors</option>
                    {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <select
                    value={store}
                    onChange={(e) => { setStore(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Stores</option>
                    {storeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    value={department}
                    onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Departments</option>
                    {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-3">PR</th>
                                <th className="px-4 py-3">Bio</th>
                                <th className="px-4 py-3">ESSL Code</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">Store</th>
                                <th className="px-4 py-3">Dept</th>
                                <th className="px-4 py-3">Designation</th>
                                <th className="px-4 py-3">Shift</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No employees match these filters</td></tr>
                            ) : employees.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50 table-row-hover">
                                    <td className="px-4 py-3 font-medium text-slate-700">{e.pr_number}</td>
                                    <td className="px-4 py-3 text-slate-400">{e.bio_id || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500">{e.emp_code || '-'}</td>
                                    <td className="px-4 py-3 text-slate-700 font-medium">{e.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{e.vendor}</td>
                                    <td className="px-4 py-3 text-slate-500">{e.store}</td>
                                    <td className="px-4 py-3 text-slate-500">{e.department || '-'}</td>
                                    <td className="px-4 py-3 text-slate-500">{e.designation}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{e.shift}</span></td>
                                    <td className="px-4 py-3 text-slate-500">{e.wc}</td>
                                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
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