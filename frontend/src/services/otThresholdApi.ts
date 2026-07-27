const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface OTThresholdAlert {
  id: number;
  pr_number: string;
  name: string;
  date: string;
  action_type: "OT Weekly Threshold" | "OT Monthly Threshold";
  description: string;
  priority: string;
  status: string;
}

export interface OTThresholdSummary {
  month: string;
  weekly_breaches: number;
  monthly_breaches: number;
  total_breaches: number;
}

export interface OTThresholdCalculateResponse {
  status: string;
  month: string;
  alerts_created: number;
  details: Array<{
    pr_number: string;
    name: string;
    date: string;
    alerts: Array<{
      type: string;
      hours: number;
      threshold: number;
    }>;
  }>;
}

function getToken(): string {
  return localStorage.getItem("token") || "";
}

export async function getOTThresholdSummary(month: string): Promise<OTThresholdSummary> {
  const res = await fetch(`${API_BASE_URL}/alerts/ot-thresholds/summary?month=${month}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch OT threshold summary");
  return res.json();
}

export async function getOTThresholdAlerts(month: string): Promise<{ total: number; data: OTThresholdAlert[] }> {
  const res = await fetch(`${API_BASE_URL}/alerts/ot-thresholds?month=${month}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch OT threshold alerts");
  return res.json();
}

export async function calculateOTThresholdAlerts(month: string): Promise<OTThresholdCalculateResponse> {
  const res = await fetch(`${API_BASE_URL}/alerts/ot-thresholds/calculate?month=${month}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to calculate OT threshold alerts");
  return res.json();
}