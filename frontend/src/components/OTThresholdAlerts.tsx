import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Calendar, RefreshCw, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { getOTThresholdAlerts, getOTThresholdSummary, calculateOTThresholdAlerts, OTThresholdAlert } from "../services/otThresholdApi";

interface OTThresholdAlertsProps {
  month?: string;
}

function getMonthInputValue(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return getMonthInputValue(d);
}

export default function OTThresholdAlerts({ month }: OTThresholdAlertsProps) {
  const [selectedMonth, setSelectedMonth] = useState(month || getMonthInputValue(new Date()));
  const [alerts, setAlerts] = useState<OTThresholdAlert[]>([]);
  const [summary, setSummary] = useState({ weekly_breaches: 0, monthly_breaches: 0, total_breaches: 0 });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        getOTThresholdAlerts(selectedMonth),
        getOTThresholdSummary(selectedMonth),
      ]);
      setAlerts(alertsRes.data || []);
      setSummary(summaryRes);
    } catch (err: any) {
      setError(err.message || "Failed to load OT alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setError("");
    try {
      await calculateOTThresholdAlerts(selectedMonth);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to calculate OT alerts");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const weeklyAlerts = alerts.filter((a) => a.action_type === "OT Weekly Threshold");
  const monthlyAlerts = alerts.filter((a) => a.action_type === "OT Monthly Threshold");

  return (
    <div className="space-y-6">
      {/* Header + Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            OT Threshold Alerts
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Weekly limit: 12 hrs | Monthly limit: 48 hrs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              className="px-2 py-2 hover:bg-slate-50 text-slate-500 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-1">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none py-2 px-1 cursor-pointer"
              />
            </div>
            <button
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              className="px-2 py-2 hover:bg-slate-50 text-slate-500 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
            {calculating ? "Calculating..." : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Weekly Breaches</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.weekly_breaches}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">&gt; 12 hrs / rolling 7 days</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Monthly Breaches</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{summary.monthly_breaches}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">&gt; 48 hrs / calendar month</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Breaches</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary.total_breaches}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">For {selectedMonth}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Alert Details</h3>
          <span className="text-xs text-slate-400">{alerts.length} open alerts</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No OT threshold breaches for {selectedMonth}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">PR Number</th>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Type</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Priority</th>
                  <th className="px-5 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-600">{alert.pr_number}</td>
                    <td className="px-5 py-3 text-slate-800 font-medium">{alert.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.action_type === "OT Weekly Threshold"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {alert.action_type === "OT Weekly Threshold" ? "Weekly" : "Monthly"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{alert.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.priority === "Critical"
                            ? "bg-red-100 text-red-700"
                            : alert.priority === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={alert.description}>
                      {alert.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weekly vs Monthly breakdown */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Weekly Breaches ({weeklyAlerts.length})
            </h4>
            <div className="space-y-3">
              {weeklyAlerts.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.pr_number} · {a.date}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                    &gt;12h
                  </span>
                </div>
              ))}
              {weeklyAlerts.length > 5 && (
                <p className="text-xs text-slate-400 text-center">+{weeklyAlerts.length - 5} more</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              Monthly Breaches ({monthlyAlerts.length})
            </h4>
            <div className="space-y-3">
              {monthlyAlerts.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.pr_number} · {a.date}</p>
                  </div>
                  <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                    &gt;48h
                  </span>
                </div>
              ))}
              {monthlyAlerts.length > 5 && (
                <p className="text-xs text-slate-400 text-center">+{monthlyAlerts.length - 5} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}