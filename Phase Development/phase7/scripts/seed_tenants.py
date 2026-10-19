"""
YOUVA-EdAI — Phase 7: Multi-Tenant Seeder
Provisions and seeds 3 isolated institutional tenants for scale testing.
"""

from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from phase7.models.tenant_isolation import TenantContext, TenantIsolationEngine
from phase7.models.licensing_engine import LicensingEngine


def seed_tenants() -> dict:
    db = TenantIsolationEngine()
    licensing = LicensingEngine()
    future = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()

    institutions = [
        {
            "tenantId": "tenant-dps-rkpuram",
            "name": "Delhi Public School, R.K. Puram",
            "contractId": "CONTRACT-DPSRKP-2026-SCALE",
            "studentSeats": 250,
            "teacherSeats": 20,
            "sampleStudents": [f"anon_cbse8_{i:03d}" for i in range(1, 31)]
        },
        {
            "tenantId": "tenant-modern-school",
            "name": "Modern School, Barakhamba Road",
            "contractId": "CONTRACT-MODERN-2026-SCALE",
            "studentSeats": 150,
            "teacherSeats": 12,
            "sampleStudents": [f"anon_cbse10_{i:03d}" for i in range(1, 26)]
        },
        {
            "tenantId": "tenant-sanskriti-school",
            "name": "Sanskriti School, Chanakyapuri",
            "contractId": "CONTRACT-SANSKRITI-2026-SCALE",
            "studentSeats": 100,
            "teacherSeats": 8,
            "sampleStudents": [f"anon_jr_{i:03d}" for i in range(1, 16)]
        }
    ]

    manifest = {"seededAt": datetime.now(timezone.utc).isoformat(), "tenants": []}

    for inst in institutions:
        t_id = inst["tenantId"]
        with TenantContext(t_id, user_id="system_seeder", role="ADMIN"):
            db.insert("institutions", t_id, {
                "name": inst["name"],
                "contractId": inst["contractId"],
                "status": "ACTIVE"
            })

            # Create license
            lic_id = f"LIC-{t_id.upper()}-2026"
            lic = licensing.create_license(
                license_id=lic_id,
                contract_id=inst["contractId"],
                tenant_id=t_id,
                student_seats=inst["studentSeats"],
                teacher_seats=inst["teacherSeats"],
                expires_at_iso=future
            )

            # Allocate sample student seats
            for std in inst["sampleStudents"]:
                licensing.allocate_student_seat(lic_id, std)
                db.insert("students", std, {"enrolledAt": datetime.now(timezone.utc).isoformat()})

            util = licensing.get_license_utilization(lic_id)
            manifest["tenants"].append({
                "tenantId": t_id,
                "name": inst["name"],
                "seatsAllocated": util["studentSeats"]["used"],
                "seatsTotal": util["studentSeats"]["total"],
                "recordsCount": db.get_tenant_record_count(t_id)
            })

    print(f"Successfully seeded {len(institutions)} isolated institutional tenants.")
    return manifest


if __name__ == "__main__":
    res = seed_tenants()
    print(json.dumps(res, indent=2))
