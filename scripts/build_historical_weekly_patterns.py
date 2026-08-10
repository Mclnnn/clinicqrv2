"""
Build a historical weekly clinic-activity pattern dataset.

This script derives recurring weekly patterns from the actual cleaned
ClinicQR health-trend data.

It does NOT claim that a high/low activity period was caused by an exam,
holiday, or other school event.

Instead, it records what the historical clinic data actually shows.

Input:
data/ml/weekly_health_trends.csv

Output:
data/ml/historical_weekly_patterns.csv
"""

import csv
from collections import defaultdict
from pathlib import Path
from statistics import mean, median


WEEKLY_TRENDS = Path("data/ml/weekly_health_trends.csv")
OUTPUT = Path("data/ml/historical_weekly_patterns.csv")


def read_weekly_data():
    if not WEEKLY_TRENDS.exists():
        raise SystemExit(
            f"Missing input file: {WEEKLY_TRENDS}\n"
            "Run build_weekly_health_trends.py first."
        )

    rows = []

    with WEEKLY_TRENDS.open(
        newline="",
        encoding="utf-8-sig",
    ) as handle:
        reader = csv.DictReader(handle)

        required = {
            "week_key",
            "week_start",
            "complaint_category",
            "case_count",
        }

        missing = required - set(reader.fieldnames or [])

        if missing:
            raise SystemExit(
                f"Missing required column(s): "
                f"{', '.join(sorted(missing))}"
            )

        for row in reader:
            week_key = (row.get("week_key") or "").strip()
            week_start = (row.get("week_start") or "").strip()
            category = (row.get("complaint_category") or "").strip()

            if not week_key or not week_start or not category:
                continue

            try:
                case_count = int(row.get("case_count") or 0)
            except ValueError:
                case_count = 0

            rows.append(
                {
                    "week_key": week_key,
                    "week_start": week_start,
                    "category": category,
                    "case_count": case_count,
                }
            )

    if not rows:
        raise SystemExit("No usable weekly health-trend data found.")

    return rows


def iso_week_number(week_key):
    """
    Extract ISO week number from values such as:
    2025-W14
    """
    try:
        return int(week_key.split("-W", 1)[1])
    except (IndexError, ValueError):
        return None


def classify_activity(relative_to_average):
    if relative_to_average >= 1.25:
        return "Historically High Activity"

    if relative_to_average <= 0.75:
        return "Historically Low Activity"

    return "Historically Typical Activity"


def main():
    rows = read_weekly_data()

    # First combine all 11 health categories into one total clinic
    # health-case count for each week.
    weekly_totals = defaultdict(int)
    weekly_dates = {}

    for row in rows:
        week_key = row["week_key"]

        weekly_totals[week_key] += row["case_count"]
        weekly_dates[week_key] = row["week_start"]

    # Group the historical weekly totals by ISO week number.
    #
    # Example:
    # 2023-W10
    # 2024-W10
    # 2025-W10
    #
    # all contribute to the historical pattern for week 10.
    week_number_values = defaultdict(list)

    for week_key, total in weekly_totals.items():
        week_number = iso_week_number(week_key)

        if week_number is None:
            continue

        week_number_values[week_number].append(total)

    # Overall historical weekly average.
    overall_average = mean(weekly_totals.values())

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as handle:

        fieldnames = [
            "week_number",
            "historical_average_cases",
            "historical_median_cases",
            "historical_min_cases",
            "historical_max_cases",
            "years_observed",
            "zero_case_years",
            "relative_to_overall_average",
            "historical_activity_pattern",
        ]

        writer = csv.DictWriter(
            handle,
            fieldnames=fieldnames,
        )

        writer.writeheader()

        for week_number in sorted(week_number_values):
            values = week_number_values[week_number]

            historical_average = mean(values)
            historical_median = median(values)
            historical_min = min(values)
            historical_max = max(values)

            zero_case_years = sum(
                value == 0
                for value in values
            )

            relative_to_overall_average = (
                historical_average / overall_average
                if overall_average > 0
                else 0
            )

            activity_pattern = classify_activity(
                relative_to_overall_average
            )

            writer.writerow(
                {
                    "week_number": week_number,
                    "historical_average_cases": round(
                        historical_average,
                        2,
                    ),
                    "historical_median_cases": round(
                        historical_median,
                        2,
                    ),
                    "historical_min_cases": historical_min,
                    "historical_max_cases": historical_max,
                    "years_observed": len(values),
                    "zero_case_years": zero_case_years,
                    "relative_to_overall_average": round(
                        relative_to_overall_average,
                        3,
                    ),
                    "historical_activity_pattern": activity_pattern,
                }
            )

    print("Historical weekly-pattern dataset created successfully.")
    print(f"Historical weeks analyzed: {len(weekly_totals):,}")
    print(f"ISO week patterns created: {len(week_number_values):,}")
    print(f"Overall average weekly health cases: {overall_average:.2f}")
    print(f"Output: {OUTPUT}")


if __name__ == "__main__":
    main()