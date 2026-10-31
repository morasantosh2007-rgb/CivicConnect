import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.core.security import require_officer_or_admin, require_admin
from app.schemas.schemas import GrievanceStatusUpdate

router = APIRouter(prefix="/admin", tags=["Officer & Admin Portal"])

VALID_STATUSES = [
    "Submitted",
    "AI Analyzed",
    "Department Suggested",
    "Assigned",
    "Acknowledged",
    "In Progress",
    "Resolution Submitted",
    "Resolved",
    "Rejected"
]

@router.get("/grievances")
def admin_list_grievances(
    status: Optional[str] = None,
    department: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_officer_or_admin)
):
    conn = get_db_connection()
    query = """
        SELECT g.*, u.full_name as author_name, u.phone as author_phone,
               o.full_name as assigned_officer_name
        FROM grievances g
        JOIN users u ON g.user_id = u.id
        LEFT JOIN users o ON g.assigned_officer_id = o.id
        WHERE 1=1
    """
    params = []

    # If Municipal Officer, restrict to their department/jurisdiction unless platform admin
    if current_user["role"] == "municipal_officer" and current_user.get("department"):
        query += " AND g.department = ?"
        params.append(current_user["department"])

    if status:
        query += " AND g.status = ?"
        params.append(status)
    if department:
        query += " AND g.department = ?"
        params.append(department)
    if severity:
        query += " AND g.severity = ?"
        params.append(severity)

    query += " ORDER BY g.created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict_from_row(r)
        if d.get("cv_analysis_json"):
            try:
                d["cv_analysis"] = json.loads(d["cv_analysis_json"])
            except Exception:
                d["cv_analysis"] = None
        items.append(d)

    return {"total": len(items), "items": items}

@router.put("/grievances/{grievance_id}/status")
def update_grievance_status(
    grievance_id: int,
    update_in: GrievanceStatusUpdate,
    current_user: Dict[str, Any] = Depends(require_officer_or_admin)
):
    if update_in.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{update_in.status}'. Valid statuses: {', '.join(VALID_STATUSES)}"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    curr_row = cursor.execute("SELECT * FROM grievances WHERE id = ?", (grievance_id,)).fetchone()
    if not curr_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Grievance not found.")

    curr = dict_from_row(curr_row)
    now = datetime.utcnow().isoformat()
    resolved_at = now if update_in.status == "Resolved" else curr.get("resolved_at")

    cursor.execute("""
        UPDATE grievances
        SET status = ?,
            assigned_officer_id = COALESCE(?, assigned_officer_id),
            department = COALESCE(?, department),
            severity = COALESCE(?, severity),
            resolution_notes = COALESCE(?, resolution_notes),
            resolution_image_url = COALESCE(?, resolution_image_url),
            resolved_at = ?,
            updated_at = ?
        WHERE id = ?
    """, (
        update_in.status,
        update_in.assigned_officer_id,
        update_in.department,
        update_in.severity,
        update_in.resolution_notes,
        update_in.resolution_image_url,
        resolved_at,
        now,
        grievance_id
    ))

    # Add audit log
    notes = update_in.notes or f"Status transitioned from {curr['status']} to {update_in.status} by {current_user['full_name']} ({current_user['role']})."
    cursor.execute("""
        INSERT INTO grievance_audit_logs (
            grievance_id, actor_id, action, previous_status, new_status, notes, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        grievance_id,
        current_user["id"],
        "Status Update",
        curr["status"],
        update_in.status,
        notes,
        now
    ))

    conn.commit()
    updated_row = cursor.execute("SELECT * FROM grievances WHERE id = ?", (grievance_id,)).fetchone()
    conn.close()

    return {"status": "success", "grievance": dict_from_row(updated_row)}

@router.get("/officers")
def list_department_officers(current_user: Dict[str, Any] = Depends(require_officer_or_admin)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, full_name, email, role, department, jurisdiction
        FROM users
        WHERE role IN ('municipal_officer', 'department_admin')
    """).fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]

@router.get("/analytics")
def get_public_accountability_analytics():
    """
    Live public accountability metrics calculated strictly from actual database records.
    Zero fabricated data.
    """
    conn = get_db_connection()
    
    total = conn.execute("SELECT COUNT(*) FROM grievances").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM grievances WHERE status IN ('Submitted', 'AI Analyzed', 'Department Suggested')").fetchone()[0]
    acknowledged = conn.execute("SELECT COUNT(*) FROM grievances WHERE status = 'Acknowledged'").fetchone()[0]
    in_progress = conn.execute("SELECT COUNT(*) FROM grievances WHERE status = 'In Progress'").fetchone()[0]
    resolved = conn.execute("SELECT COUNT(*) FROM grievances WHERE status = 'Resolved'").fetchone()[0]
    critical_unresolved = conn.execute("SELECT COUNT(*) FROM grievances WHERE severity = 'Critical' AND status != 'Resolved'").fetchone()[0]

    # Department breakdown
    dept_rows = conn.execute("""
        SELECT department, COUNT(*) as count,
               SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
        FROM grievances
        GROUP BY department
    """).fetchall()

    dept_stats = [
        {
            "department": r["department"],
            "total": r["count"],
            "resolved": r["resolved_count"],
            "pending": r["count"] - r["resolved_count"]
        }
        for r in dept_rows
    ]

    # Severity breakdown
    sev_rows = conn.execute("""
        SELECT severity, COUNT(*) as count
        FROM grievances
        GROUP BY severity
    """).fetchall()
    severity_stats = {r["severity"]: r["count"] for r in sev_rows}

    # Resolution rate
    resolution_rate = round((resolved / total * 100.0), 1) if total > 0 else 100.0

    conn.close()

    return {
        "total_grievances": total,
        "pending_triaged": pending,
        "acknowledged": acknowledged,
        "in_progress": in_progress,
        "resolved": resolved,
        "critical_unresolved": critical_unresolved,
        "resolution_rate_percent": resolution_rate,
        "department_distribution": dept_stats,
        "severity_distribution": severity_stats,
        "calculated_timestamp": datetime.utcnow().isoformat()
    }
