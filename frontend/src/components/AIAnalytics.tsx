import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Calendar, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import {
    api,
    WeekdayStat,
    DayOfWeekResponse,
    BestMeetingDaysResponse,
    ForecastResponse,
    OtTrendResponse,
} from '../services/api';

// ============================================================================
// Small display helpers
// ============================================================================

function confidenceClasses(confidence: string): { text: string; bg: string; bar: string } {
    if (confidence === 'high') return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
    if (confidence === 'moderate') return { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    return { text: 'text-slate-500', bg: 'bg-slate-100', bar: 'bg-slate-400' };
}

function TrendIcon({ trend }: { trend?: string }) {
    if (trend === 'rising' || trend === 'improving') return <TrendingUp size={14} className="text-emerald-600" />;
    if (trend === 'falling' || trend === 'declining') return <TrendingDown size={14} className="text-rose-600" />;
    return <Minus size={14} className="text-slate-400" />;
}

// ============================================================================
// Day-of-week bar chart (plain SVG, no chart library dependency)
// ============================================================================

function DayOfWeekChart({ weekdays }: { weekdays: WeekdayStat[] }) {
    if (weekdays.length === 0) {
        return <p className="text-sm text-slate-400 italic">No attendance data ingested yet.</p>;
    }
    const maxPct = Math.max(...weekdays.map((d) => d.avg_attendance_pct), 100);
    const barW = 88;
    const gap = 20;
    const chartH = 160;
    const width = weekdays.length * (barW + gap);

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${chartH + 48}`} style={{ maxWidth: width }}>
            {weekdays.map((d, i) => {
                const barH = (d.avg_attendance_pct / maxPct) * chartH;
                const x = i * (barW + gap);
                const y = chartH - barH;
                const c = confidenceClasses(d.confidence);
                return (
                    <g key={d.weekday}>
                        <rect x={x} y={y} width={barW} height={barH} rx={5} className={c.bar} fill="currentColor" opacity={0.85} />
                        <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="13" fontWeight={700} fill="#334155">
                            {d.avg_attendance_pct}%
                        </text>
                        <text x={x + barW / 2} y={chartH + 20} textAnchor="middle" fontSize="12" fill="#475569">
                            {d.weekday.slice(0, 3)}
                        </text>
                        <text x={x + barW / 2} y={chartH + 36} textAnchor="middle" fontSize="10" fill="#94A3B8">
                            n={d.occurrences_observed}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ============================================================================
// OT trend line chart (plain SVG)
// ============================================================================

function OtTrendChart({ weeklyTotals }: { weeklyTotals: OtTrendResponse['weekly_totals'] }) {
    if (weeklyTotals.length === 0) return null;
    const values = weeklyTotals.map((d) => d.ot_hours);
    const maxVal = Math.max(...values, 1);
    const width = 640;
    const height = 150;
    const padding = 28;
    const stepX = (width - padding * 2) / Math.max(weeklyTotals.length - 1, 1);

    const points = weeklyTotals.map((d, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (d.ot_hours / maxVal) * (height - padding * 2);
        return { x, y, val: d.ot_hours, label: `W${d.iso_week}` };
    });
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height + 20}`} style={{ maxWidth: width }}>
            <path d={path} fill="none" stroke="#2563EB" strokeWidth={2.5} />
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r={4} fill="#2563EB" />
                    <text x={p.x} y={height + 14} fontSize="10" textAnchor="middle" fill="#94A3B8">
                        {p.label}
                    </text>
                    <text x={p.x} y={p.y - 10} fontSize="10" textAnchor="middle" fill="#334155" fontWeight={600}>
                        {p.val}
                    </text>
                </g>
            ))}
        </svg>
    );
}

// ============================================================================
// Main component
// ============================================================================

export default function AIAnalytics() {
    const [vendor, setVendor] = useState('');
    const [store, setStore] = useState('');
    const [monthsBack, setMonthsBack] = useState(6);
    const [vendorOptions, setVendorOptions] = useState<string[]>([]);
    const [storeOptions, setStoreOptions] = useState<string[]>([]);

    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekResponse | null>(null);
    const [bestDays, setBestDays] = useState<BestMeetingDaysResponse | null>(null);
    const [otTrend, setOtTrend] = useState<OtTrendResponse | null>(null);

    const [forecastDate, setForecastDate] = useState('');
    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [forecastLoading, setForecastLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getVendorNames().then(setVendorOptions).catch(() => {});
        api.getStoreNames().then(setStoreOptions).catch(() => {});
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dow, best, ot] = await Promise.all([
                api.getDayOfWeekAnalytics(monthsBack, vendor || undefined, store || undefined),
                api.getBestMeetingDays(3, monthsBack, vendor || undefined, store || undefined),
                api.getOtTrend(8, vendor || undefined, store || undefined),
            ]);
            setDayOfWeek(dow);
            setBestDays(best);
            setOtTrend(ot);
        } catch (e: any) {
            setError(e?.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, [monthsBack, vendor, store]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    async function runForecast() {
        if (!forecastDate) return;
        setForecastLoading(true);
        setForecast(null);
        try {
            const result = await api.getAttendanceForecast(forecastDate, monthsBack, vendor || undefined, store || undefined);
            setForecast(result);
        } catch (e: any) {
            setError(e?.message || 'Forecast request failed.');
        } finally {
            setForecastLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Sparkles size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">AI Analytics</h1>
                        <p className="text-xs text-slate-400">
                            Attendance patterns and OT trends computed live from your reconciled data
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">All Vendors</option>
                        {vendorOptions.map((v) => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                    <select
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">All Stores</option>
                        {storeOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={monthsBack}
                        onChange={(e) => setMonthsBack(Number(e.target.value))}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value={3}>Last 3 months</option>
                        <option value={6}>Last 6 months</option>
                        <option value={12}>Last 12 months</option>
                    </select>
                    <button
                        onClick={loadAll}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Best meeting days */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Best days to schedule meetings</h3>
                <p className="text-xs text-slate-400 mb-4">
                    Ranked by historical attendance % - highest headcount reliability first.
                </p>
                {loading && !bestDays ? (
                    <p className="text-sm text-slate-400 italic">Loading...</p>
                ) : bestDays && bestDays.best_days.length > 0 ? (
                    <div className="flex gap-4 flex-wrap">
                        {bestDays.best_days.map((d) => {
                            const c = confidenceClasses(d.confidence);
                            return (
                                <div key={d.weekday} className="flex-1 min-w-[160px] bg-slate-50 border-l-4 border-blue-600 rounded-lg px-4 py-3">
                                    <div className="text-base font-bold text-slate-800">{d.weekday}</div>
                                    <div className={`text-2xl font-bold mt-1 ${c.text}`}>{d.avg_attendance_pct}%</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        ~{d.avg_present_headcount} present · {d.occurrences_observed} days observed
                                    </div>
                                    <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                                        {d.confidence} confidence
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">Not enough data yet.</p>
                )}
            </div>

            {/* Day-of-week chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Attendance % by day of week</h3>
                <p className="text-xs text-slate-400 mb-4">
                    Bar color reflects confidence (green = high, amber = moderate, grey = low - build up more weeks
                    of data). "n" is how many of that weekday exist in your reconciled data so far.
                </p>
                {dayOfWeek && <DayOfWeekChart weekdays={dayOfWeek.weekdays} />}
            </div>

            {/* Forecast for a specific date */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Check a specific date</h3>
                <p className="text-xs text-slate-400 mb-4">
                    Weighted forecast using history of that date's weekday - recent weeks count more.
                </p>
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={forecastDate}
                            onChange={(e) => setForecastDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={runForecast}
                        disabled={!forecastDate || forecastLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {forecastLoading ? 'Checking...' : 'Check this date'}
                    </button>
                </div>
                {forecast && (
                    <div className="max-w-xs bg-slate-50 border-l-4 border-blue-600 rounded-lg px-4 py-3">
                        <div className="text-sm font-bold text-slate-800">
                            {forecast.weekday} · {forecast.target_date}
                        </div>
                        {forecast.forecast_attendance_pct !== null ? (
                            <>
                                <div className="text-2xl font-bold text-blue-700 mt-1">
                                    {forecast.forecast_attendance_pct}% expected
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    Historical avg {forecast.historical_avg_pct}% <TrendIcon trend={forecast.trend} /> {forecast.trend} ·{' '}
                                    {forecast.based_on_occurrences} occurrences
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">{forecast.note}</p>
                        )}
                    </div>
                )}
            </div>

            {/* OT trend */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Weekly OT hours trend</h3>
                <p className="text-xs text-slate-400 mb-4">
                    Last {otTrend?.weeks_back ?? 8} weeks of overtime, with a linear forecast for next week - use
                    this before the monthly approval sign-off, not after.
                </p>
                {otTrend?.flag && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2 text-sm font-medium mb-4">
                        <AlertTriangle size={14} />
                        {otTrend.flag}
                    </div>
                )}
                {otTrend && otTrend.weekly_totals.length > 0 ? (
                    <>
                        <OtTrendChart weeklyTotals={otTrend.weekly_totals} />
                        <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                            Trend: <span className="font-semibold flex items-center gap-1">{otTrend.trend} <TrendIcon trend={otTrend.trend} /></span>
                            ({otTrend.slope_hours_per_week} hrs/week) · Next week forecast:{' '}
                            <span className="font-semibold text-slate-800">{otTrend.next_week_forecast_hours} hrs</span>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-slate-400 italic">{otTrend?.note ?? 'Loading...'}</p>
                )}
            </div>
        </div>
    );
}