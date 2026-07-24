"""
day_pattern_analytics.py
-------------------------
Predictive + descriptive analytics on attendance data, built for the
Tata Motors HR attendance system.

What this gives you:
  1. day_of_week_summary()   -> historical attendance % by weekday, with
                                 sample size + std dev so you know how much
                                 to trust each number
  2. forecast_next_weekday() -> weighted forecast for a specific upcoming
                                 date (recent weeks weighted higher, so it
                                 adapts automatically as new monthly sheets
                                 get ingested)
  3. best_meeting_days()     -> ranked "safest" weekdays to schedule
                                 important meetings

*** ADJUST THE COLS DICT AND TABLE NAME BELOW TO MATCH YOUR ACTUAL SQLITE
    SCHEMA. Paste your schema (or the CREATE TABLE statement) and I'll
    rewrite this to match exactly instead of guessing. ***
"""

import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ---- adjust these to match your actual schema ----
TABLE = "attendance"
COLS = {
    "date": "date",       # date of the attendance record (YYYY-MM-DD or parseable)
    "pr": "pr",            # employee PR number
    "status": "status",    # 'Present' / 'Absent' / 'Week Off' etc.
    "shift": "shift",
}


def load_attendance(db_path: str) -> pd.DataFrame:
    conn = sqlite3.connect(db_path)
    df = pd.read_sql(f"SELECT * FROM {TABLE}", conn)
    conn.close()
    df[COLS["date"]] = pd.to_datetime(df[COLS["date"]])
    return df


def _daily_attendance(df: pd.DataFrame) -> pd.DataFrame:
    """Collapse row-per-employee-per-day into one row per calendar day."""
    df = df.copy()
    df["is_present"] = df[COLS["status"]].astype(str).str.lower().eq("present")

    daily = (
        df.groupby(df[COLS["date"]].dt.date)
        .agg(present=("is_present", "sum"), total=(COLS["pr"], "nunique"))
        .reset_index()
    )
    daily["date"] = pd.to_datetime(daily[COLS["date"]])
    daily["weekday"] = daily["date"].dt.day_name()
    daily["attendance_pct"] = daily["present"] / daily["total"] * 100
    return daily


def day_of_week_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Attendance % by weekday, with sample size and spread so you know how
    much to trust each number. Sorted highest attendance first.
    """
    daily = _daily_attendance(df)

    summary = (
        daily.groupby("weekday")["attendance_pct"]
        .agg(avg_attendance_pct="mean", std_dev="std", occurrences="count")
        .reindex(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
        .dropna(how="all")
        .reset_index()
    )
    summary["avg_attendance_pct"] = summary["avg_attendance_pct"].round(1)
    summary["std_dev"] = summary["std_dev"].round(1)
    return summary.sort_values("avg_attendance_pct", ascending=False)


def forecast_next_weekday(df: pd.DataFrame, target_date: str) -> dict:
    """
    Weighted forecast for a specific upcoming date, using history of that
    same weekday. Recent occurrences are weighted higher (exponential
    decay) so the forecast shifts as new monthly sheets get added, instead
    of treating week 1 and week 4 as equally relevant.
    """
    target = pd.to_datetime(target_date)
    weekday_name = target.day_name()

    daily = _daily_attendance(df)
    daily = daily[daily["weekday"] == weekday_name].sort_values("date")

    if daily.empty:
        return {"weekday": weekday_name, "forecast_pct": None,
                "note": "No historical data for this weekday yet."}

    n = len(daily)
    weights = np.exp(np.linspace(-1, 0, n))  # oldest -> smallest weight
    weighted_forecast = np.average(daily["attendance_pct"], weights=weights)

    return {
        "target_date": target.strftime("%Y-%m-%d"),
        "weekday": weekday_name,
        "forecast_attendance_pct": round(weighted_forecast, 1),
        "based_on_occurrences": int(n),
        "historical_avg_pct": round(daily["attendance_pct"].mean(), 1),
        "trend": "improving" if daily["attendance_pct"].iloc[-1] > daily["attendance_pct"].mean() else "declining",
        "confidence": "low (build up more weeks of data)" if n < 4 else "moderate",
    }


def best_meeting_days(df: pd.DataFrame, top_n: int = 3) -> pd.DataFrame:
    """Ranked weekdays safest for scheduling important meetings."""
    summary = day_of_week_summary(df)
    summary = summary[summary["avg_attendance_pct"] > 5]  # drop weekly-off days
    return summary.head(top_n)


if __name__ == "__main__":
    DB_PATH = "attendance.db"  # <-- point this to your actual SQLite file
    data = load_attendance(DB_PATH)

    print("=== Day-of-week attendance summary ===")
    print(day_of_week_summary(data).to_string(index=False))

    print("\n=== Best days to schedule meetings ===")
    print(best_meeting_days(data).to_string(index=False))

    print("\n=== Example forecast: next Monday ===")
    days_ahead = (7 - datetime.today().weekday()) % 7 or 7
    next_monday = datetime.today() + timedelta(days=days_ahead)
    print(forecast_next_weekday(data, next_monday.strftime("%Y-%m-%d")))