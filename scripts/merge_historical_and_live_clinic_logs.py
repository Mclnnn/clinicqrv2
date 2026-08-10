import csv
from pathlib import Path


HISTORICAL_LOGS = Path("data/ml/clinic_logbook_clean_for_ml.csv")
LIVE_LOGS = Path("data/ml/live_clinic_logs_for_ml.csv")
COMBINED_LOGS = Path("data/ml/clinic_logbook_combined_for_ml.csv")


def read_rows(path):
    if not path.exists():
        return [], []

    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        return reader.fieldnames or [], rows


def dedupe_key(row):
    return (
        (row.get("visit_date") or "").strip(),
        (row.get("department") or "").strip().upper(),
        (row.get("purpose") or "").strip().upper(),
        (row.get("complaint_raw") or "").strip().upper(),
        (row.get("complaint_category") or "").strip().upper(),
        (row.get("source_sheet") or "").strip().upper(),
        (row.get("source_row") or "").strip(),
    )


def main():
    historical_headers, historical_rows = read_rows(HISTORICAL_LOGS)
    live_headers, live_rows = read_rows(LIVE_LOGS)

    if not historical_rows and not live_rows:
        raise SystemExit(
            "No input rows found. Run clean_clinic_logbook.py and/or "
            "php artisan ml:export-live-clinic-logs first."
        )

    headers = historical_headers or live_headers
    for header in live_headers:
        if header not in headers:
            headers.append(header)

    combined = []
    seen = set()

    for row in historical_rows + live_rows:
        key = dedupe_key(row)
        if key in seen:
            continue

        seen.add(key)
        combined.append({header: row.get(header, "") for header in headers})

    combined.sort(key=lambda row: ((row.get("visit_date") or ""), (row.get("source_sheet") or ""), (row.get("source_row") or "")))

    COMBINED_LOGS.parent.mkdir(parents=True, exist_ok=True)
    with COMBINED_LOGS.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(combined)

    print("Combined ClinicQR ML log dataset created successfully.")
    print(f"Historical rows: {len(historical_rows):,}")
    print(f"Live rows: {len(live_rows):,}")
    print(f"Combined rows: {len(combined):,}")
    print(f"Output: {COMBINED_LOGS}")


if __name__ == "__main__":
    main()
