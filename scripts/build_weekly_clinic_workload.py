import csv
from collections import Counter
from datetime import date, timedelta
from pathlib import Path


HISTORICAL_LOGS = Path("data/ml/clinic_logbook_clean_for_ml.csv")
COMBINED_LOGS = Path("data/ml/clinic_logbook_combined_for_ml.csv")
WEEKLY_WORKLOAD = Path("data/ml/weekly_clinic_workload.csv")

HEALTH_CATEGORIES = {
    "Allergy",
    "Blood Pressure",
    "Body Pain",
    "Dental",
    "Dizziness",
    "Dysmenorrhea",
    "Fever",
    "Gastrointestinal",
    "Headache",
    "Respiratory",
    "Wound/Injury",
}


def monday_of(value: date) -> date:
    return value - timedelta(days=value.weekday())


def week_key(value: date) -> str:
    iso_year, iso_week, _ = value.isocalendar()
    return f"{iso_year:04d}-W{iso_week:02d}"


def bucket_for(row: dict) -> str:
    category = (row.get("complaint_category") or "").strip()
    purpose = (row.get("purpose") or "").strip().lower()
    complaint = (row.get("complaint_raw") or "").strip().lower()

    combined = f"{category} {purpose} {complaint}".lower()

    if category in HEALTH_CATEGORIES:
        return "health"

    if "cert" in combined:
        return "medical_certificate"

    if "enrollment" in combined or "requirement" in combined or "clearance" in combined:
        return "enrollment_requirement"

    if "supply" in combined or "issuance" in combined or "medicine" in combined:
        return "supply_medicine"

    if "consult" in combined or "assessment" in combined or "bmi" in combined or "monitoring" in combined:
        return "consultation_assessment"

    return "unknown_other"


def read_clean_rows() -> list[dict]:
    input_path = COMBINED_LOGS if COMBINED_LOGS.exists() else HISTORICAL_LOGS

    if not input_path.exists():
        raise SystemExit(f"Missing input file: {input_path}")

    rows = []
    with input_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"visit_date", "complaint_category", "purpose", "department"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(
                f"Missing required column(s) in {input_path}: "
                f"{', '.join(sorted(missing))}"
            )

        for row in reader:
            raw_date = (row.get("visit_date") or "").strip()
            if not raw_date:
                continue

            try:
                visit_date = date.fromisoformat(raw_date[:10])
            except ValueError:
                continue

            row["parsed_visit_date"] = visit_date
            rows.append(row)

    if not rows:
        raise SystemExit("No usable clinic records found.")

    return rows, input_path


def main():
    rows, input_path = read_clean_rows()

    first_date = min(row["parsed_visit_date"] for row in rows)
    last_date = max(row["parsed_visit_date"] for row in rows)
    first_week = monday_of(first_date)
    last_week = monday_of(last_date)

    weeks = []
    current = first_week
    while current <= last_week:
        weeks.append(current)
        current += timedelta(days=7)

    weekly_counts = Counter()
    weekly_departments: dict[date, set[str]] = {}

    for row in rows:
        week_start = monday_of(row["parsed_visit_date"])
        bucket = bucket_for(row)
        department = (row.get("department") or "").strip()

        weekly_counts[(week_start, "total_visits")] += 1
        weekly_counts[(week_start, f"{bucket}_visits")] += 1

        if department:
            weekly_departments.setdefault(week_start, set()).add(department)

    fieldnames = [
        "week_key",
        "week_start",
        "week_end",
        "total_visits",
        "health_visits",
        "non_health_visits",
        "medical_certificate_visits",
        "enrollment_requirement_visits",
        "supply_medicine_visits",
        "consultation_assessment_visits",
        "unknown_other_visits",
        "unique_departments",
    ]

    WEEKLY_WORKLOAD.parent.mkdir(parents=True, exist_ok=True)
    with WEEKLY_WORKLOAD.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()

        for week_start in weeks:
            week_end = week_start + timedelta(days=6)
            total = weekly_counts[(week_start, "total_visits")]
            health = weekly_counts[(week_start, "health_visits")]

            writer.writerow(
                {
                    "week_key": week_key(week_start),
                    "week_start": week_start.isoformat(),
                    "week_end": week_end.isoformat(),
                    "total_visits": total,
                    "health_visits": health,
                    "non_health_visits": max(total - health, 0),
                    "medical_certificate_visits": weekly_counts[(week_start, "medical_certificate_visits")],
                    "enrollment_requirement_visits": weekly_counts[(week_start, "enrollment_requirement_visits")],
                    "supply_medicine_visits": weekly_counts[(week_start, "supply_medicine_visits")],
                    "consultation_assessment_visits": weekly_counts[(week_start, "consultation_assessment_visits")],
                    "unknown_other_visits": weekly_counts[(week_start, "unknown_other_visits")],
                    "unique_departments": len(weekly_departments.get(week_start, set())),
                }
            )

    busy_weeks = sum(1 for week in weeks if weekly_counts[(week, "total_visits")] > 0)

    print("Weekly clinic workload dataset created successfully.")
    print(f"Input file: {input_path}")
    print(f"Input records: {len(rows):,}")
    print(f"Date range: {first_date} to {last_date}")
    print(f"Calendar weeks: {len(weeks):,}")
    print(f"Weeks with clinic activity: {busy_weeks:,}")
    print(f"Output: {WEEKLY_WORKLOAD}")


if __name__ == "__main__":
    main()
