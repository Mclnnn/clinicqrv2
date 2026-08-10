
mport csv
from collections import Counter
from datetime import date, timedelta
from pathlib import Path


CLEAN_LOGS = Path("data/ml/clinic_logbook_clean_for_ml.csv")
WEEKLY_TRENDS = Path("data/ml/weekly_health_trends.csv")

# Keep this list aligned with the existing monthly ML training script.
HEALTH_CATEGORIES = [
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
]


def monday_of(value: date) -> date:
    """Return the Monday that starts the calendar week containing value."""
    return value - timedelta(days=value.weekday())


def read_clean_rows():
    if not CLEAN_LOGS.exists():
        raise SystemExit(f"Missing input file: {CLEAN_LOGS}")

    rows = []
    with CLEAN_LOGS.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"visit_date", "complaint_category"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(
                f"Missing required column(s) in {CLEAN_LOGS}: "
                f"{', '.join(sorted(missing))}"
            )

        for row in reader:
            raw_date = (row.get("visit_date") or "").strip()
            category = (row.get("complaint_category") or "").strip()
            if not raw_date:
                continue

            try:
                visit_date = date.fromisoformat(raw_date[:10])
            except ValueError:
                continue

            rows.append((visit_date, category))

    if not rows:
        raise SystemExit("No usable clinic records found.")

    return rows


def main():
    rows = read_clean_rows()

    first_date = min(visit_date for visit_date, _ in rows)
    last_date = max(visit_date for visit_date, _ in rows)

    first_week = monday_of(first_date)
    last_week = monday_of(last_date)

    weeks = []
    current = first_week
    while current <= last_week:
        weeks.append(current)
        current += timedelta(days=7)

    counts = Counter(
        (
            monday_of(visit_date),
            category,
        )
        for visit_date, category in rows
        if category in HEALTH_CATEGORIES
    )

    WEEKLY_TRENDS.parent.mkdir(parents=True, exist_ok=True)

    with WEEKLY_TRENDS.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "week_key",
                "week_start",
                "week_end",
                "complaint_category",
                "case_count",
            ],
        )
        writer.writeheader()

        for week_start in weeks:
            iso_year, iso_week, _ = week_start.isocalendar()
            week_key = f"{iso_year:04d}-W{iso_week:02d}"
            week_end = week_start + timedelta(days=6)

            for category in HEALTH_CATEGORIES:
                writer.writerow(
                    {
                        "week_key": week_key,
                        "week_start": week_start.isoformat(),
                        "week_end": week_end.isoformat(),
                        "complaint_category": category,
                        "case_count": counts[(week_start, category)],
                    }
                )

    total_health_cases = sum(counts.values())
    weeks_with_health_cases = sum(
        any(counts[(week, category)] > 0 for category in HEALTH_CATEGORIES)
        for week in weeks
    )
    zero_health_weeks = len(weeks) - weeks_with_health_cases

    print("Weekly health-trend dataset created successfully.")
    print(f"Input records: {len(rows):,}")
    print(f"Health cases included: {total_health_cases:,}")
    print(f"Date range: {first_date} to {last_date}")
    print(f"Calendar weeks: {len(weeks):,}")
    print(f"Weeks with health cases: {weeks_with_health_cases:,}")
    print(f"Zero-health-case weeks: {zero_health_weeks:,}")
    print(f"Categories: {len(HEALTH_CATEGORIES)}")
    print(f"Output: {WEEKLY_TRENDS}")


if __name__ == "__main__":
    main()
