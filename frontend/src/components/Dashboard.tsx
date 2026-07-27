import React, { useState, useEffect } from 'react';
import {
    TrendingDown, UserCheck, UserX, Clock4,
    Zap, BarChart3, AlertTriangle, Users, Clock, Upload, Download, ArrowRightLeft, Calendar,
    Activity, Briefcase, MapPin, Layers, CheckCircle2, ShieldAlert
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { api, KPIData, TrendData, BreakdownItem, HRActionItem } from '../services/api';
import {
    KPICard, SectionHeader, LoadingSpinner, ErrorState,
    PriorityBadge, Button, Card
} from './SharedUI';
import OTThresholdCard from "../components/OTThresholdCard";
import { useNavigate } from "react-router-dom";


// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg p-3 min-w-[140px]">
                <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-600 capitalize">{entry.name}:</span>
                        <span className="text-xs font-bold text-slate-800">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Breakdown tooltip
const BreakdownTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg p-3">
                <p className="text-xs font-semibold text-slate-700 mb-1">{data.name}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500">Present</span>
                        <span className="text-xs font-bold text-blue-600">{data.present}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500">Total</span>
                        <span className="text-xs font-bold text-slate-700">{data.total}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500">Rate</span>
                        <span className="text-xs font-bold text-emerald-600">{data.percentage}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};


// Format decimal hours to HH:MM (e.g. 12.95 → "12h 57m")
function formatHours(decimalHours: number | null | undefined): string {
    if (decimalHours == null || isNaN(decimalHours)) return '0h 00m';
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [vendors, setVendors] = useState<BreakdownItem[]>([]);
    const [stores, setStores] = useState<BreakdownItem[]>([]);
    const [departments, setDepartments] = useState<BreakdownItem[]>([]);
    const [shifts, setShifts] = useState<BreakdownItem[]>([]);
    const [actions, setActions] = useState<HRActionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // PERF FIX: requestIdRef guards against stale responses - if the date is
    // changed again before an in-flight load finishes, the older response is
    // discarded instead of overwriting newer data on the screen.
    const requestIdRef = React.useRef(0);

    const loadData = async (dateToLoad: string) => {
        if (!dateToLoad) return;
        const myRequestId = ++requestIdRef.current;
        try {
            setLoading(true);
            setError(null);
            const [k, t, v, s, d, sh, a] = await Promise.all([
                api.getKPIs(dateToLoad),
                api.getTrends(dateToLoad, 30),
                api.getBreakdown('vendors', dateToLoad),
                api.getBreakdown('stores', dateToLoad),
                api.getBreakdown('departments', dateToLoad),
                api.getBreakdown('shifts', dateToLoad),
                api.getActionQueue()
            ]);
            if (myRequestId !== requestIdRef.current) return; // a newer request superseded this one
            setKpis(k);
            // FIX: Parse trend data correctly - API returns { trends: [...] }
            setTrends(Array.isArray(t) ? t : ((t as any).trends || []));
            setVendors(v);
            setStores(s);
            setDepartments(d);
            setShifts(sh);
            setActions(a.data || []);
        } catch (err: any) {
            if (myRequestId !== requestIdRef.current) return;
            setError(err.message || "Failed to load dashboard data");
        } finally {
            if (myRequestId === requestIdRef.current) setLoading(false);
        }
    };

    // PERF FIX: debounce date changes by 300ms so clicking through the date
    // picker (or a fast back-to-back change) doesn't fire 7 parallel requests
    // per keystroke - only the final date after the user pauses gets loaded.
    useEffect(() => {
        if (!selectedDate) return;
        const timer = setTimeout(() => loadData(selectedDate), 300);
        return () => clearTimeout(timer);
    }, [selectedDate]);

    // Set default date to yesterday on mount
    useEffect(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setSelectedDate(yesterday.toISOString().split('T')[0]);
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorState message={error} onRetry={() => loadData(selectedDate)} />;

    // Prepare pie chart data for attendance distribution
    const attendancePieData = kpis ? [
        { name: 'Present', value: kpis.present, color: '#3b82f6' },
        { name: 'Absent', value: kpis.absent, color: '#ef4444' },
        { name: 'Leave', value: kpis.on_leave || 0, color: '#f59e0b' },
        { name: 'No Data', value: kpis.no_data || 0, color: '#94a3b8' },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="space-y-6 fade-in">
            {/* Top Action Bar with Date Picker */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Good day, HR</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Snapshot for {selectedDate} — attendance, overtime & mismatch signals across all vendors.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm hover:border-blue-300 transition-colors">
                        <Calendar className="text-blue-400" size={16} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-sm text-slate-700 outline-none bg-transparent"
                        />
                    </div>
                    <Button variant="secondary" icon={Upload} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'upload' }))}>
                        Upload Files
                    </Button>
                    <Button variant="secondary" icon={ArrowRightLeft} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'reconciliation' }))}>
                        Reconcile
                    </Button>
                    <Button variant="secondary" icon={BarChart3} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'reports' }))}>
                        Reports
                    </Button>
                    <Button variant="primary" icon={Download} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'reports' }))}>
                        Export Dashboard
                    </Button>
                </div>
            </div>

            {/* KPI Cards — Blue themed with gradients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <KPICardV2 
                    title="Total Employees" 
                    value={kpis?.total_employees ?? 0} 
                    subtext="Active headcount" 
                    icon={Users} 
                    gradient="from-blue-500 to-blue-600"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <KPICardV2 
                    title="Headcount" 
                    value={kpis?.headcount ?? 0} 
                    subtext="Present + OT adjusted" 
                    icon={Users} 
                    gradient="from-sky-500 to-sky-600"
                    iconBg="bg-sky-50"
                    iconColor="text-sky-500"
                />
                <KPICardV2 
                    title="Present" 
                    value={kpis?.present ?? 0} 
                    subtext={`${kpis?.attendance_rate ?? 0}% rate`} 
                    icon={UserCheck} 
                    gradient="from-emerald-500 to-emerald-600"
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-500"
                />
                <KPICardV2 
                    title="Absent" 
                    value={kpis?.absent ?? 0} 
                    subtext="Requires attention" 
                    icon={UserX} 
                    gradient="from-rose-500 to-rose-600"
                    iconBg="bg-rose-50"
                    iconColor="text-rose-500"
                />
                <KPICardV2 
                    title="Late Punch" 
                    value={kpis?.late_punches ?? 0} 
                    subtext="Beyond grace period" 
                    icon={Clock4} 
                    gradient="from-amber-500 to-amber-600"
                    iconBg="bg-amber-50"
                    iconColor="text-amber-500"
                />
                <KPICardV2 
                    title="OT Employees" 
                    value={kpis?.ot_eligible ?? 0} 
                    subtext="Eligible for OT" 
                    icon={Zap} 
                    gradient="from-indigo-500 to-indigo-600"
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-500"
                />
                <KPICardV2 
                    title="OT Hours" 
                    value={formatHours(kpis?.ot_hours)} 
                    subtext="Total OT hours" 
                    icon={BarChart3} 
                    gradient="from-cyan-500 to-cyan-600"
                    iconBg="bg-cyan-50"
                    iconColor="text-cyan-500"
                />
            </div>

            {/* Secondary KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MiniKPICard title="Early Departure" value={kpis?.early_departure ?? 0} icon={TrendingDown} color="text-orange-500" />
                <MiniKPICard title="Single Punch" value={kpis?.single_punch ?? 0} icon={AlertTriangle} color="text-purple-500" />
                <MiniKPICard title="Alternate Shift" value={kpis?.alternate_shift ?? 0} icon={ArrowRightLeft} color="text-orange-500" />
                <MiniKPICard title="New Joinees" value={kpis?.new_joiners ?? 0} icon={Briefcase} color="text-teal-500" />
                <MiniKPICard title="No Data" value={kpis?.no_data ?? 0} icon={Activity} color="text-slate-500" />
                <OTThresholdCard month={selectedDate?.slice(0, 7)} onClick={() => navigate("/ot-alerts")} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Trend — Fixed & Blue Themed */}
                <Card className="lg:col-span-2 p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Attendance Trend</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Daily present vs absent — last 30 days</p>
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Live</span>
                    </div>
                    <div className="h-80">
                        {trends.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 gap-2">
                                <Activity size={32} className="text-slate-200" />
                                <span>No attendance data yet — upload and reconcile to see trends here.</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(str) => {
                                            if (!str) return '';
                                            const d = new Date(str);
                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                        }} 
                                        tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        dy={8}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        dx={-8}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        iconType="circle" 
                                        iconSize={8} 
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="present" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2.5} 
                                        fillOpacity={1} 
                                        fill="url(#gradPresent)" 
                                        name="Present"
                                        activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="absent" 
                                        stroke="#ef4444" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#gradAbsent)" 
                                        name="Absent"
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="late_punches" 
                                        stroke="#f59e0b" 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#gradLate)" 
                                        name="Late"
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Attendance Distribution Pie Chart */}
                <Card className="p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-800">Attendance Distribution</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Today's breakdown</p>
                    </div>
                    <div className="h-64">
                        {attendancePieData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                No data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={attendancePieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {attendancePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* HR Actions */}
            <Card className="p-6 bg-white border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">HR Actions</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Pending items requiring attention</p>
                    </div>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'actions' }))} className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">View all</button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {actions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                            <CheckCircle2 size={28} className="text-emerald-300" />
                            <p className="text-sm">No open actions — all caught up!</p>
                        </div>
                    ) : actions.slice(0, 10).map((action) => (
                        <div key={action.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors" />
                                    <span className="text-xs font-semibold text-slate-700">{action.type}</span>
                                </div>
                                <PriorityBadge priority={action.priority} />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pl-4">{action.description}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Breakdown Charts — Blue Themed */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                    { title: 'Vendor-wise Attendance', data: vendors, icon: Briefcase },
                    { title: 'Store-wise Attendance', data: stores, icon: MapPin },
                    { title: 'Department-wise', data: departments, icon: Layers },
                    { title: 'Shift-wise', data: shifts, icon: Activity }
                ].map((chart, idx) => (
                    <Card key={idx} className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <chart.icon size={14} className="text-blue-400" />
                                <h3 className="text-sm font-bold text-slate-700">{chart.title}</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{selectedDate}</span>
                        </div>
                        <div className="h-52">
                            {chart.data.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chart.data} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={75} 
                                            tick={{ fontSize: 10, fill: '#64748b' }} 
                                            axisLine={false} 
                                            tickLine={false}
                                        />
                                        <Tooltip content={<BreakdownTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }} />
                                        <Bar dataKey="present" radius={[0, 6, 6, 0]} barSize={18}>
                                            {chart.data.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={index === 0 ? '#3b82f6' : index === 1 ? '#60a5fa' : index === 2 ? '#93c5fd' : '#bfdbfe'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Enhanced KPICard with gradient background
function KPICardV2({ title, value, subtext, icon: Icon, gradient, iconBg, iconColor }: any) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-start justify-between">
                <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon size={20} className={iconColor} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{title}</p>
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 font-medium">{subtext}</p>
        </div>
    );
}

// Compact mini card for secondary metrics
function MiniKPICard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-colors">
            <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{title}</p>
            </div>
        </div>
    );
}