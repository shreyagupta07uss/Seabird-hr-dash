// Real API Service - Connects to SeaBird FastAPI Backend
// Base URL: http://localhost:8000/api/v1

const API_BASE = "http://localhost:8000/api/v1";

// Helper to handle fetch with error handling, timeout, and abort support
async function fetchJSON<T>(url: string, options?: RequestInit & { timeout?: number }): Promise<T> {
    const timeout = options?.timeout || 300000; // 5 minutes default for uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        return res.json();
    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout / 1000}s. The file may be too large or the server is busy.`);
        }
        throw e;
    }
}

// ============================================================================
// TYPES (matching backend Pydantic/JSON responses exactly)
// ============================================================================

export interface KPIData {
    total_employees: number;
    present: number;
    absent: number;
    on_leave: number;
    late_punches: number;
    ot_hours: number;
    attendance_rate: number;
    vendor_count: number;
    store_count: number;
    department_count: number;
    shift_count: number;
    pending_actions: number;
    pending_ot: number;
    early_departure: number;
    single_punch: number;
    less_working_hours: number;
    alternate_shift: number;
    ot_eligible: number;
    headcount: number;  // Present + OT adjusted (+0.25 for 2hrs, +0.5 for 4hrs)
    new_joiners: number;
    no_data: number;
    selected_date: string;
    
}

export interface TrendData {
    date: string;
    present: number;
    absent: number;
    late: number;
    ot: number;
}

export interface BreakdownItem {
    name: string;
    present: number;
    total: number;
    ot: number;
}

export interface HRActionItem {
    id: number;
    type: string;
    description: string;
    priority: string;
    status: string;
    assigned_to: string;
}

export interface ReconciliationRecord {
    id: number;
    pr_number: string;
    date: string;
    essl_in: string | null;
    essl_out: string | null;
    tata_in: string | null;
    tata_out: string | null;
    in_delta_minutes: number;
    out_delta_minutes: number;
    match_status: string;
    severity: string;
}

export interface Employee {
    id: number;
    pr_number: string;
    bio_id: string | null;   // ADDED: Master's real 'Bio' column, now returned by /employees
    emp_code: string | null; // backend only populates this once ESSL matches a PayCode - can be null
    name: string;
    vendor: string | null;
    store: string | null;
    department: string | null; // backend backfills this from Tata - null until a Tata upload has run
    designation: string | null;
    status: string;
    shift: string | null;
    wc: string | null;
    bc: string | null;
}

export interface AttendanceRecord {
    id: number;
    pr_number: string;
    name: string;
    vendor: string;
    store: string;
    department: string;
    shift: string;
    assigned_shift?: string;
    worked_shift: string;
    category?: string;
    essl_in: string | null;
    essl_out: string | null;
    tata_in: string | null;
    tata_out: string | null;
    final_in: string | null;
    final_out: string | null;
    worked_hours: number;
    man_hrs: number;
    attendance_status: string;
    ot_hours: number;
    ot_headcount: number;
    late_minutes: number;
    early_minutes: number;
    single_punch: string;
    is_match: string;
    issue?: string;
    remark: string;
}

export interface UploadLog {
    id: number;
    type: string;
    filename: string;
    rows_processed: number;
    status: string;
    uploaded_at: string;
}

// ADDED: typed upload response so UploadCenter.tsx can show real row/sheet counts instead
// of a generic "uploaded successfully!" alert (previously typed as Promise<any>).
// EXTENDED: added the fields returned by the new /upload/daywise endpoint (date, per-source
// row counts, and which of the three expected sheets were actually found).
export interface UploadResult {
    status: string;
    type: string;
    rows_processed?: number;
    sheets_read?: number;
    sheets_skipped?: number;
    monthly_records_created?: number;
    filename?: string;
    message?: string;
    // daywise-only fields (present when type === 'daywise')
    date?: string;
    essl_rows_processed?: number;
    tata_rows_processed?: number;
    sheets_found?: {
        essl_in: boolean;
        essl_out: boolean;
        tata: boolean;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    total_pages: number;
}

export interface AIInsight {
    id: number;
    title: string;
    description: string;
    severity: string;
    recommendation: string;
}

export interface OTRequest {
    id: number;
    pr_number: string;
    name: string;
    store: string;
    worked_hours: number;
    ot_hours: number;
    calc_headcount: number;
    status: string;
}

export interface ReconciliationSummary {
    total: number;
    matched: number;
    mismatched: number;
    missing_essl: number;
    missing_tata: number;
    no_data: number;
    critical: number;
}

export interface MonthlyAttendance {
    pr_number: string;
    name: string;
    days: any[];
    summary: {
        present: number;
        absent: number;
        half_day: number;
        late: number;
        total_ot: number;
        single_punch_days: number;
    };
}

export interface LatePunchPenalty {
    pr_number: string;
    month: string;
    late_count: number;
    penalty_days: number;
}

export interface DumpRecord {
    id: number;
    bio_id: string;
    pr_number: string;
    category: string;
    vendor: string;
    name: string;
    essl_in: string;
    essl_out: string;
    shift: string;
    total_hours: number;
    remark: string;
    tata_in: string;
    tata_out: string;
    attendance_status: string;
    ot_hours: number;
    ot_headcount: number;
    late_minutes: number;
    early_minutes: number;
    single_punch: string;
    is_match: string;
    match_status: string;
}

export interface ReportItem {
    id: number;
    name: string;
    description: string;
    type: string;
}

export interface SettingsData {
    company: { name: string; client: string; location: string };
    shift_rules: Record<string, any>;
    late_punch_rules: any;
    category_rules: Record<string, any>;
}

// ADDED: matches the new /api/v1/data-quality/unmatched endpoint
export interface UnmatchedRecord {
    pr_number: string;
    name: string;
    record_count: number;
}

// ADDED: matches the new /api/v1/analytics/* predictive analytics endpoints
export interface WeekdayStat {
    weekday: string;
    avg_attendance_pct: number;
    avg_present_headcount: number;
    std_dev: number;
    occurrences_observed: number;
    confidence: 'low' | 'moderate' | 'high';
}

export interface DayOfWeekResponse {
    months_back: number;
    vendor: string | null;
    store: string | null;
    weekdays: WeekdayStat[];
}

export interface BestMeetingDaysResponse {
    top_n: number;
    best_days: WeekdayStat[];
}

export interface ForecastResponse {
    target_date: string;
    weekday: string;
    forecast_attendance_pct: number | null;
    based_on_occurrences?: number;
    historical_avg_pct?: number;
    trend?: 'improving' | 'declining';
    confidence?: string;
    note?: string;
}

export interface OtWeekTotal {
    iso_year: number;
    iso_week: number;
    ot_hours: number;
}

export interface OtTrendResponse {
    weeks_back: number;
    vendor: string | null;
    store: string | null;
    weekly_totals: OtWeekTotal[];
    trend?: 'rising' | 'falling' | 'stable';
    slope_hours_per_week?: number;
    next_week_forecast_hours?: number;
    flag?: string | null;
    note?: string;
}


export interface EmployeeSummary {
  pr_number: string;
  name: string;
  month: string;
  employee: {
    name: string;
    vendor: string;
    store: string;
    department: string;
    designation: string;
    category: string;
    shift: string;
    status: string;
  };
  summary: {
    total_days: number;
    present: number;
    absent: number;
    half_day: number;
    leave: number;
    weekoff: number;
    single_punch: number;
    late_punch: number;
    early_departure: number;
    less_working_hours: number;
    no_data: number;
    attendance_percentage: number;
    effective_present_days: number;
  };
  penalty: {
    late_punch_penalty_days: number;
    late_punch_count: number;
    late_punch_label: string;
    next_penalty_at: number;
    half_day_penalty_days: number;
    total_penalty_days: number;
    action_required: boolean;
  };
  days: Array<{
    date: string;
    attendance_status: string;
    issue: string;
    essl_in: string | null;
    essl_out: string | null;
    tata_in: string | null;
    tata_out: string | null;
    final_in: string | null;
    final_out: string | null;
    worked_hours: number | null;
    ot_hours: number | null;
    late_minutes: number | null;
    early_minutes: number | null;
    single_punch: string;
    shift: string | null;
    remark: string | null;
  }>;
}

// ============================================================================
// REAL API FUNCTIONS - Direct fetch to FastAPI backend
// ============================================================================

export const api = {
    // Health
    health: async (): Promise<any> => {
        return fetchJSON(`${API_BASE}/health`);
    },

    // KPIs
    getKPIs: async (target_date: string): Promise<KPIData> => {
        return fetchJSON(`${API_BASE}/kpis?target_date=${target_date}`);
    },

    // Trends
    getTrends: async (target_date: string, days: number = 30): Promise<TrendData[]> => {
        return fetchJSON(`${API_BASE}/trends?target_date=${target_date}&days=${days}`);
    },

    // Breakdowns
    getBreakdown: async (type: 'vendors' | 'stores' | 'departments' | 'shifts', target_date: string): Promise<BreakdownItem[]> => {
        return fetchJSON(`${API_BASE}/breakdown/${type}?target_date=${target_date}`);
    },

    // HR Actions
    getActionSummary: async (): Promise<any> => {
        return fetchJSON(`${API_BASE}/actions/summary`);
    },

    getActionQueue: async (page: number = 1, page_size: number = 50): Promise<PaginatedResponse<HRActionItem>> => {
        return fetchJSON(`${API_BASE}/actions/queue?page=${page}&page_size=${page_size}`);
    },

    resolveAction: async (action_id: number, resolution: string): Promise<any> => {
        const formData = new FormData();
        formData.append('resolution', resolution);
        return fetchJSON(`${API_BASE}/actions/${action_id}/resolve`, {
            method: 'POST',
            body: formData
        });
    },

    // AI Insights
    getAIInsights: async (): Promise<AIInsight[]> => {
        return fetchJSON(`${API_BASE}/ai-insights`);
    },

    // Attendance
    getDailyAttendance: async (
        date: string,
        vendor?: string,
        store?: string,
        department?: string,
        status?: string,
        search?: string,
        page: number = 1,
        page_size: number = 50,
        issue?: string
    ): Promise<PaginatedResponse<AttendanceRecord>> => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        if (department) params.append('department', department);
        if (status) params.append('status', status);
        if (issue) params.append('issue', issue);  // FIX v3.2.5: Pass issue filter
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        return fetchJSON(`${API_BASE}/attendance/daily?${params.toString()}`);
    },

    getMonthlyAttendance: async (pr_number: string, month?: string): Promise<MonthlyAttendance> => {
        const url = month
            ? `${API_BASE}/attendance/monthly/${pr_number}?month=${month}`
            : `${API_BASE}/attendance/monthly/${pr_number}`;
        return fetchJSON(url);
    },

    // Employees
    getEmployees: async (
        search?: string,
        vendor?: string,
        store?: string,
        department?: string,
        status?: string,
        page: number = 1,
        page_size: number = 50
    ): Promise<PaginatedResponse<Employee>> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        if (department) params.append('department', department);
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        return fetchJSON(`${API_BASE}/employees?${params.toString()}`);
    },

    // Master Data Lists
    getVendors: async (): Promise<BreakdownItem[]> => {
        return fetchJSON(`${API_BASE}/vendors`);
    },

    getStores: async (): Promise<BreakdownItem[]> => {
        return fetchJSON(`${API_BASE}/stores`);
    },

    getDepartments: async (): Promise<BreakdownItem[]> => {
        return fetchJSON(`${API_BASE}/departments`);
    },

    // ADDED: thin wrappers around getVendors/getStores/getDepartments above, returning just
    // the names. Employees.tsx, Attendance.tsx and Reports.tsx use these for filter dropdowns
    // that used to be hardcoded to fake values ("Store A/B/C/D", "SeaBird, Venus, Apex") which
    // never matched a real record (real vendors are SLL/SG/SSE).
    getVendorNames: async (): Promise<string[]> => {
        const vendors = await api.getVendors();
        return vendors.map(v => v.name).filter(Boolean).sort();
    },

    getStoreNames: async (): Promise<string[]> => {
        const stores = await api.getStores();
        return stores.map(s => s.name).filter(Boolean).sort();
    },

    getDepartmentNames: async (): Promise<string[]> => {
        const departments = await api.getDepartments();
        return departments.map(d => d.name).filter(Boolean).sort();
    },

    // Overtime
    getOTSummary: async (): Promise<any> => {
        return fetchJSON(`${API_BASE}/overtime/summary`);
    },

    getOTRequests: async (page: number = 1, page_size: number = 50): Promise<PaginatedResponse<OTRequest>> => {
        return fetchJSON(`${API_BASE}/overtime/requests?page=${page}&page_size=${page_size}`);
    },

    approveOT: async (ot_id: number, action: 'approve' | 'reject'): Promise<any> => {
        const formData = new FormData();
        formData.append('action', action);
        return fetchJSON(`${API_BASE}/overtime/${ot_id}/approve`, {
            method: 'POST',
            body: formData
        });
    },

    // Reports
    getReports: async (): Promise<ReportItem[]> => {
        return fetchJSON(`${API_BASE}/reports`);
    },

    // Settings
    getSettings: async (): Promise<SettingsData> => {
        return fetchJSON(`${API_BASE}/settings`);
    },

    // Upload History
    getUploadHistory: async (): Promise<UploadLog[]> => {
        return fetchJSON(`${API_BASE}/upload/history`);
    },

    // Upload Endpoints
    // CHANGED: return type is now UploadResult instead of `any`, so UploadCenter.tsx can
    // show real rows_processed / sheets_read / sheets_skipped instead of a blind alert.
    uploadMaster: async (file: File, force: boolean = false): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        return fetchJSON(`${API_BASE}/upload/master`, {
            method: 'POST',
            body: formData
        });
    },

    uploadESSL: async (file: File, force: boolean = false): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        return fetchJSON(`${API_BASE}/upload/essl`, {
            method: 'POST',
            body: formData,
            timeout: 600000, // 10 minutes for large ESSL files
        });
    },

    uploadTata: async (file: File, force: boolean = false): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        return fetchJSON(`${API_BASE}/upload/tata`, {
            method: 'POST',
            body: formData
        });
    },

    uploadTataAll: async (file: File, force: boolean = false): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        return fetchJSON(`${API_BASE}/upload/tata-all`, {
            method: 'POST',
            body: formData
        });
    },

    // ADDED: matches the new backend /api/v1/upload/daywise endpoint - one workbook with
    // 'Essl In' / 'Essl Out' / 'Tata' sheets for a single day. target_date is optional; the
    // backend auto-detects it from the Tata sheet's own Date column, and only needs it as an
    // explicit override (format 'DD/MM/YYYY' or 'YYYY-MM-DD') if that auto-detection fails.
    uploadDaywise: async (file: File, targetDate?: string, force: boolean = false): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        if (targetDate) formData.append('target_date', targetDate);
        return fetchJSON(`${API_BASE}/upload/daywise`, {
            method: 'POST',
            body: formData,
            timeout: 600000, // 10 minutes - this file carries ESSL-sized row counts too
        });
    },

    // Reconciliation
    runReconciliation: async (target_date: string): Promise<any> => {
        const formData = new FormData();
        formData.append('target_date', target_date);
        return fetchJSON(`${API_BASE}/reconciliation/run`, {
            method: 'POST',
            body: formData
        });
    },

    // ADDED: Tata_-_June.xlsx covers a full month across 30 sheets - reconciling one day at
    // a time meant 30 manual clicks. This calls the new backend /reconciliation/run-month
    // endpoint, which loops every day in the given month server-side.
    runReconciliationMonth: async (month: string): Promise<{
        status: string; month: string; days_processed: number;
        attendance_records_created: number; reconciliation_issues: number; hr_actions_created: number;
    }> => {
        const formData = new FormData();
        formData.append('month', month);
        return fetchJSON(`${API_BASE}/reconciliation/run-month`, {
            method: 'POST',
            body: formData
        });
    },

    getReconciliationSummary: async (target_date?: string): Promise<ReconciliationSummary> => {
        const url = target_date
            ? `${API_BASE}/reconciliation/summary?target_date=${target_date}`
            : `${API_BASE}/reconciliation/summary`;
        return fetchJSON(url);
    },

    getReconciliationRecords: async (
        target_date?: string,
        page: number = 1,
        page_size: number = 50
    ): Promise<PaginatedResponse<ReconciliationRecord>> => {
        const params = new URLSearchParams();
        if (target_date) params.append('target_date', target_date);
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        return fetchJSON(`${API_BASE}/reconciliation/records?${params.toString()}`);
    },

    // Dump Report
    getDumpReport: async (
        month?: string,
        vendor?: string,
        store?: string,
        department?: string,
        page: number = 1,
        page_size: number = 50
    ): Promise<PaginatedResponse<DumpRecord>> => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        if (department) params.append('department', department);
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        return fetchJSON(`${API_BASE}/reports/dump?${params.toString()}`);
    },

    downloadDumpReport: async (params: {
        month?: string;
        targetDate?: string;
        vendor?: string;
        store?: string;
        department?: string;
    }): Promise<Blob> => {
        const query = new URLSearchParams();
        if (params.month) query.append('month', params.month);
        // CRITICAL: convert camelCase to snake_case for backend
        if (params.targetDate) query.append('target_date', params.targetDate);
        if (params.vendor) query.append('vendor', params.vendor);
        if (params.store) query.append('store', params.store);
        if (params.department) query.append('department', params.department);
        const res = await fetch(`${API_BASE}/reports/dump/download?${query.toString()}`);
        if (!res.ok) {
            const text = await res.text().catch(() => `HTTP ${res.status}`);
            throw new Error(text || `HTTP ${res.status}`);
        }
        return res.blob();
    },

    // ADDED: Reports.tsx had UI for these three but nothing was implemented behind them -
    // it just showed a fake success alert(). The backend now has real CSV endpoints for all three.
    downloadOtReport: async (month?: string, vendor?: string, store?: string): Promise<Blob> => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        const res = await fetch(`${API_BASE}/reports/ot/download?${params.toString()}`);
        return res.blob();
    },

    downloadLateReport: async (month?: string, vendor?: string, store?: string): Promise<Blob> => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        const res = await fetch(`${API_BASE}/reports/late/download?${params.toString()}`);
        return res.blob();
    },

    downloadMonthlyReport: async (month?: string): Promise<Blob> => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        const res = await fetch(`${API_BASE}/reports/monthly/download?${params.toString()}`);
        return res.blob();
    },

    // Employee Summary
    getEmployeeSummary: async (pr_number: string, month?: string): Promise<EmployeeSummary> => {
        const url = month
            ? `${API_BASE}/employee/summary/${pr_number}?month=${month}`
            : `${API_BASE}/employee/summary/${pr_number}`;
        return fetchJSON(url);
    },

    // Late Punch
    calculateLatePunch: async (pr_number: string, month: string): Promise<any> => {
        const formData = new FormData();
        formData.append('pr_number', pr_number);
        formData.append('month', month);
        return fetchJSON(`${API_BASE}/late-punch/calculate`, {
            method: 'POST',
            body: formData
        });
    },

    calculateAllLatePunches: async (month: string): Promise<any> => {
        return fetchJSON(`${API_BASE}/late-punch/calculate-all?month=${month}`, {
            method: 'POST'
        });
    },

    // ADDED: matches the new backend /api/v1/data-quality/unmatched endpoint - surfaces
    // ESSL/Tata rows that couldn't be linked to a Master employee (PayCode mismatch, etc.)
    getUnmatched: async (source: 'essl' | 'tata'): Promise<UnmatchedRecord[]> => {
        return fetchJSON(`${API_BASE}/data-quality/unmatched?source=${source}`);
    },

    // ADDED: Predictive Analytics - matches the new /api/v1/analytics/* endpoints.
    // Used by AIAnalytics.tsx for meeting-day planning and OT trend forecasting.
    getDayOfWeekAnalytics: async (
        monthsBack: number = 6,
        vendor?: string,
        store?: string
    ): Promise<DayOfWeekResponse> => {
        const params = new URLSearchParams();
        params.append('months_back', monthsBack.toString());
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        return fetchJSON(`${API_BASE}/analytics/day-of-week?${params.toString()}`);
    },

    getBestMeetingDays: async (
        topN: number = 3,
        monthsBack: number = 6,
        vendor?: string,
        store?: string
    ): Promise<BestMeetingDaysResponse> => {
        const params = new URLSearchParams();
        params.append('top_n', topN.toString());
        params.append('months_back', monthsBack.toString());
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        return fetchJSON(`${API_BASE}/analytics/best-meeting-days?${params.toString()}`);
    },

    getAttendanceForecast: async (
        targetDate: string,
        monthsBack: number = 6,
        vendor?: string,
        store?: string
    ): Promise<ForecastResponse> => {
        const params = new URLSearchParams();
        params.append('target_date', targetDate);
        params.append('months_back', monthsBack.toString());
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        return fetchJSON(`${API_BASE}/analytics/forecast?${params.toString()}`);
    },

    getOtTrend: async (
        weeksBack: number = 8,
        vendor?: string,
        store?: string
    ): Promise<OtTrendResponse> => {
        const params = new URLSearchParams();
        params.append('weeks_back', weeksBack.toString());
        if (vendor) params.append('vendor', vendor);
        if (store) params.append('store', store);
        return fetchJSON(`${API_BASE}/analytics/ot-trend?${params.toString()}`);
    }
};