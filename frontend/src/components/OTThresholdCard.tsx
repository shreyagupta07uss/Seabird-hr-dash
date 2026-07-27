import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { getOTThresholdSummary } from "../services/otThresholdApi";

interface OTThresholdCardProps {
  month?: string;
  onClick?: () => void;
}

export default function OTThresholdCard({ month, onClick }: OTThresholdCardProps) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const [summary, setSummary] = useState({ weekly_breaches: 0, monthly_breaches: 0, total_breaches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOTThresholdSummary(targetMonth)
      .then(setSummary)
      .catch(() => setSummary({ weekly_breaches: 0, monthly_breaches: 0, total_breaches: 0 }))
      .finally(() => setLoading(false));
  }, [targetMonth]);

  const hasBreaches = summary.total_breaches > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${
        hasBreaches ? "border-amber-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            hasBreaches ? "bg-amber-50" : "bg-slate-50"
          }`}>
            <AlertTriangle className={`w-4 h-4 ${hasBreaches ? "text-amber-500" : "text-slate-400"}`} />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">OT Thresholds</h3>
        </div>
        {hasBreaches && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {summary.total_breaches}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-12 flex items-center justify-center text-slate-300 text-xs">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-slate-500">Weekly &gt;12h</span>
            </div>
            <p className={`text-lg font-bold ${summary.weekly_breaches > 0 ? "text-amber-600" : "text-slate-400"}`}>
              {summary.weekly_breaches}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-red-500" />
              <span className="text-xs text-slate-500">Monthly &gt;48h</span>
            </div>
            <p className={`text-lg font-bold ${summary.monthly_breaches > 0 ? "text-red-600" : "text-slate-400"}`}>
              {summary.monthly_breaches}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}