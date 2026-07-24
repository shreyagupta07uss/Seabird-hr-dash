"""
analytics_routes.py
--------------------
Drop this into your existing FastAPI app (e.g. `app.include_router(analytics_router)`
in main.py). Adjust `get_db_path()` to however you already resolve your SQLite path.
"""

from fastapi import APIRouter, HTTPException
from day_pattern_analytics import load_attendance, day_of_week_summary, forecast_next_weekday, best_meeting_days

analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])

DB_PATH = "attendance.db"  # <-- adjust to match your existing config


@analytics_router.get("/day-of-week")
def get_day_of_week_summary():
    """Historical attendance % by weekday, with sample size and spread."""
    df = load_attendance(DB_PATH)
    summary = day_of_week_summary(df)
    return summary.to_dict(orient="records")


@analytics_router.get("/best-meeting-days")
def get_best_meeting_days(top_n: int = 3):
    """Ranked weekdays safest for scheduling important meetings."""
    df = load_attendance(DB_PATH)
    result = best_meeting_days(df, top_n=top_n)
    return result.to_dict(orient="records")


@analytics_router.get("/forecast")
def get_forecast(target_date: str):
    """
    Forecast expected attendance % for a specific future date.
    Example: GET /analytics/forecast?target_date=2026-07-27
    """
    df = load_attendance(DB_PATH)
    try:
        result = forecast_next_weekday(df, target_date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse target_date: {e}")
    return result