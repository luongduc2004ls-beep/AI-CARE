"""
Gemini Function Calling Tools Suite for ElderlyCare AI
Provides direct, typed database query functions for AI tools.
"""

from .patient_tools import get_patient_profile, get_patient_full_profile, search_patients, search_patients_advanced
from .health_tools import get_latest_vitals, get_health_history, get_health_summary, get_health_trend
from .medicine_tools import get_current_medications, get_medication_schedule, get_medication_history, get_medication_adherence
from .camera_tools import get_camera_status, get_camera_events, get_recent_fall_events
from .alert_tools import get_active_alerts, get_alert_history
from .analytics_tools import get_patient_risk, get_high_risk_patients, get_system_statistics

ALL_AI_TOOLS = [
    get_patient_profile,
    get_patient_full_profile,
    search_patients,
    search_patients_advanced,
    get_latest_vitals,
    get_health_history,
    get_health_summary,
    get_health_trend,
    get_current_medications,
    get_medication_schedule,
    get_medication_history,
    get_medication_adherence,
    get_camera_status,
    get_camera_events,
    get_recent_fall_events,
    get_active_alerts,
    get_alert_history,
    get_patient_risk,
    get_high_risk_patients,
    get_system_statistics
]
