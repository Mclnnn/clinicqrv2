import csv
import math
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

WEEKLY_TRENDS = Path("data/ml/weekly_health_trends.csv")
CALENDAR_IN = Path("data/ml/dummy_school_calendar.csv")
PREDICTIONS_OUT = Path("data/ml/weekly_health_trend_predictions.csv")
MODEL_OUT = Path("data/ml/weekly_health_trend_model.joblib")
METRICS_OUT = Path("data/ml/weekly_model_metrics.txt")
COMPARISON_OUT = Path("data/ml/weekly_model_comparison.csv")

HEALTH_CATEGORIES = [
    "Allergy", "Blood Pressure", "Body Pain", "Dental", "Dizziness",
    "Dysmenorrhea", "Fever", "Gastrointestinal", "Headache",
    "Respiratory", "Wound/Injury",
]


def require_ml_libraries():
    try:
        from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
        from sklearn.feature_extraction import DictVectorizer
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        from sklearn.pipeline import Pipeline
        import joblib
    except ModuleNotFoundError as exc:
        raise SystemExit(
            f"Missing Python package: {exc.name}. Install with: "
            "python -m pip install scikit-learn joblib"
        )
    return {
        "RandomForestRegressor": RandomForestRegressor,
        "ExtraTreesRegressor": ExtraTreesRegressor,
        "DictVectorizer": DictVectorizer,
        "mean_absolute_error": mean_absolute_error,
        "mean_squared_error": mean_squared_error,
        "r2_score": r2_score,
        "Pipeline": Pipeline,
        "joblib": joblib,
    }


def parse_date(value):
    return datetime.strptime(value.strip(), "%Y-%m-%d").date()


def monday_of(value):
    return value - timedelta(days=value.weekday())


def next_week(value):
    return value + timedelta(days=7)


def week_key(value):
    iso = value.isocalendar()
    return f"{iso.year:04d}-W{iso.week:02d}"


def average(values):
    return sum(values) / len(values) if values else 0.0


def read_calendar():
    if not CALENDAR_IN.exists():
        raise SystemExit(f"Missing calendar file: {CALENDAR_IN}")

    events = []
    with CALENDAR_IN.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        required = {"start_date", "end_date", "event_type"}
        if not required.issubset(reader.fieldnames or []):
            raise SystemExit(f"Calendar must contain columns: {sorted(required)}")
        for row in reader:
            events.append({
                "start": parse_date(row["start_date"]),
                "end": parse_date(row["end_date"]),
                "event_type": row["event_type"].strip() or "Other",
            })
    return events


def calendar_features(week_start, events):
    week_end = week_start + timedelta(days=6)
    matched = []
    for event in events:
        overlaps = event["start"] <= week_end and event["end"] >= week_start
        if overlaps:
            matched.append(event["event_type"])

    unique = sorted(set(matched))
    event_text = "|".join(unique) if unique else "Regular"
    lower = {item.lower() for item in unique}
    return {
        "calendar_event": event_text,
        "calendar_event_count": len(unique),
        "is_exam_week": int(any("exam" in item for item in lower)),
        "is_break_week": int(any("break" in item or "holiday" in item for item in lower)),
        "is_school_start": int(any("start" in item or "resume" in item for item in lower)),
    }


def read_weekly_counts():
    if not WEEKLY_TRENDS.exists():
        raise SystemExit(f"Missing input file: {WEEKLY_TRENDS}")
    counts = defaultdict(int)
    week_starts = set()
    with WEEKLY_TRENDS.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = row["complaint_category"].strip()
            if category not in HEALTH_CATEGORIES:
                continue
            start = parse_date(row["week_start"])
            week_starts.add(start)
            counts[(start, category)] = int(row["case_count"])
    if not counts:
        raise SystemExit("No usable weekly health trend rows found.")
    return counts, sorted(week_starts)


def build_series(counts, weeks):
    start, end = weeks[0], weeks[-1]
    full_weeks = []
    current = monday_of(start)
    while current <= end:
        full_weeks.append(current)
        current += timedelta(days=7)

    series = {
        category: [counts.get((week, category), 0) for week in full_weeks]
        for category in HEALTH_CATEGORIES
    }
    return full_weeks, series


def make_features(weeks, series, category, index, target_index, events):
    values = series[category]
    current = values[index]
    lags = {f"lag_{n}": values[index - n] if index >= n else 0 for n in range(1, 13)}
    rolling_4 = average(values[max(0, index - 3): index + 1])
    rolling_8 = average(values[max(0, index - 7): index + 1])
    rolling_12 = average(values[max(0, index - 11): index + 1])
    previous_year = values[index - 52] if index >= 52 else 0
    previous_4 = values[index - 4] if index >= 4 else 0
    pct_change = (current - previous_4) / previous_4 if previous_4 > 0 else 0

    source = weeks[index]
    target = weeks[target_index]
    target_iso = target.isocalendar()
    source_iso = source.isocalendar()
    target_cal = calendar_features(target, events)
    source_cal = calendar_features(source, events)

    features = {
        "category": category,
        "source_year": source.year,
        "source_month": source.month,
        "source_week_of_year": source_iso.week,
        "target_month": target.month,
        "target_week_of_year": target_iso.week,
        "current_count": current,
        "rolling_4_average": round(rolling_4, 4),
        "rolling_8_average": round(rolling_8, 4),
        "rolling_12_average": round(rolling_12, 4),
        "previous_year_count": previous_year,
        "four_week_change": round(pct_change, 4),
        "source_is_rainy_season": int(source.month in {6, 7, 8, 9, 10, 11}),
        "target_is_rainy_season": int(target.month in {6, 7, 8, 9, 10, 11}),
        "target_calendar_event": target_cal["calendar_event"],
        "target_calendar_event_count": target_cal["calendar_event_count"],
        "target_is_exam_week": target_cal["is_exam_week"],
        "target_is_break_week": target_cal["is_break_week"],
        "target_is_school_start": target_cal["is_school_start"],
        "source_calendar_event": source_cal["calendar_event"],
        "source_is_exam_week": source_cal["is_exam_week"],
        "source_is_break_week": source_cal["is_break_week"],
    }
    features.update(lags)
    return features


def build_training_rows(weeks, series, events):
    features, targets, labels = [], [], []
    # Need enough history for lag-12 and previous-year features.
    for index in range(52, len(weeks) - 1):
        target_index = index + 1
        for category in HEALTH_CATEGORIES:
            features.append(make_features(weeks, series, category, index, target_index, events))
            targets.append(series[category][target_index])
            labels.append((weeks[index], category))
    return features, targets, labels


def chronological_split(features, targets, labels, validation_weeks=16):
    source_weeks = sorted({week for week, _ in labels})
    if len(source_weeks) <= validation_weeks:
        raise SystemExit("Not enough weekly history for chronological validation.")
    validation_start = source_weeks[-validation_weeks]
    train_idx = [i for i, label in enumerate(labels) if label[0] < validation_start]
    test_idx = [i for i, label in enumerate(labels) if label[0] >= validation_start]
    return (
        [features[i] for i in train_idx], [features[i] for i in test_idx],
        [targets[i] for i in train_idx], [targets[i] for i in test_idx],
        [labels[i] for i in test_idx], validation_start,
    )


def metrics_for(libs, actual, predicted):
    mae = libs["mean_absolute_error"](actual, predicted)
    rmse = math.sqrt(libs["mean_squared_error"](actual, predicted))
    r2 = libs["r2_score"](actual, predicted) if len(set(actual)) > 1 else 0
    return {"mae": mae, "rmse": rmse, "r2": r2}


def build_model(libs, estimator):
    return libs["Pipeline"]([
        ("vectorizer", libs["DictVectorizer"]()),
        ("regressor", estimator),
    ])


def main():
    libs = require_ml_libraries()
    events = read_calendar()
    counts, observed_weeks = read_weekly_counts()
    weeks, series = build_series(counts, observed_weeks)
    features, targets, labels = build_training_rows(weeks, series, events)
    if len(features) < 100:
        raise SystemExit("Not enough weekly training rows. Check weekly_health_trends.csv.")

    train_x, test_x, train_y, test_y, test_labels, validation_start = chronological_split(
        features, targets, labels
    )

    persistence = [row["current_count"] for row in test_x]
    moving_average = [row["rolling_4_average"] for row in test_x]
    comparison = [
        {"model": "Persistence baseline (current week)", **metrics_for(libs, test_y, persistence)},
        {"model": "4-week moving-average baseline", **metrics_for(libs, test_y, moving_average)},
    ]

    candidates = [
        ("RandomForestRegressor", libs["RandomForestRegressor"](
            n_estimators=500, random_state=42, min_samples_leaf=2, max_features=0.8, n_jobs=-1
        )),
        ("ExtraTreesRegressor", libs["ExtraTreesRegressor"](
            n_estimators=500, random_state=42, min_samples_leaf=2, max_features=0.9, n_jobs=-1
        )),
    ]

    trained = []
    for name, estimator in candidates:
        model = build_model(libs, estimator)
        model.fit(train_x, train_y)
        metrics = metrics_for(libs, test_y, model.predict(test_x))
        comparison.append({"model": name, **metrics})
        trained.append((name, estimator, metrics))

    best_name, best_estimator, best_metrics = min(trained, key=lambda row: (row[2]["mae"], row[2]["rmse"]))
    model = build_model(libs, best_estimator)
    model.fit(features, targets)

    latest = weeks[-1]
    target = next_week(latest)
    prediction_rows = []
    for category in HEALTH_CATEGORIES:
        feature = make_features(weeks, series, category, len(weeks) - 1, len(weeks) - 1, events)
        # Rebuild target-aware features for the actual next week.
        feature = make_features(weeks + [target], {k: v + [v[-1]] for k, v in series.items()}, category, len(weeks) - 1, len(weeks), events)
        prediction = max(0, round(float(model.predict([feature])[0])))
        prediction_rows.append({
            "source_week": week_key(latest),
            "prediction_week": week_key(target),
            "source_week_start": latest.isoformat(),
            "prediction_week_start": target.isoformat(),
            "complaint_category": category,
            "current_cases": series[category][-1],
            "predicted_cases": prediction,
            "forecast_method": best_name,
            "calendar_event": calendar_features(target, events)["calendar_event"],
        })

    PREDICTIONS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with PREDICTIONS_OUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(prediction_rows[0]))
        writer.writeheader(); writer.writerows(prediction_rows)

    with COMPARISON_OUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "mae", "rmse", "r2"])
        writer.writeheader(); writer.writerows(comparison)

    with METRICS_OUT.open("w", encoding="utf-8") as f:
        f.write("ClinicQR Weekly Health Trend Model\n")
        f.write(f"Validation starts: {validation_start.isoformat()}\n")
        f.write(f"Latest observed week: {latest.isoformat()}\n")
        f.write(f"Prediction week: {target.isoformat()}\n")
        f.write(f"Selected ML model by validation MAE: {best_name}\n")
        f.write(f"Selected ML MAE: {best_metrics['mae']:.4f}\n")
        f.write(f"Selected ML RMSE: {best_metrics['rmse']:.4f}\n")
        f.write(f"Selected ML R2: {best_metrics['r2']:.4f}\n")
        f.write("\nIMPORTANT: dummy_school_calendar.csv contains illustrative dates only and must be replaced by the verified school calendar before thesis/production use.\n")

    libs["joblib"].dump({
        "model": model,
        "model_name": best_name,
        "features": list(features[0].keys()),
        "health_categories": HEALTH_CATEGORIES,
        "calendar_source": str(CALENDAR_IN),
    }, MODEL_OUT)

    print("Weekly health-trend model training completed successfully.")
    print(f"Input weeks: {len(weeks)}")
    print(f"Training rows: {len(train_x)}")
    print(f"Validation rows: {len(test_x)}")
    print(f"Validation start: {validation_start.isoformat()}")
    print("\nModel comparison:")
    for row in comparison:
        print(f"{row['model']}: MAE={row['mae']:.4f}, RMSE={row['rmse']:.4f}, R2={row['r2']:.4f}")
    print(f"\nSelected ML model: {best_name}")
    print(f"Prediction week: {week_key(target)} ({target.isoformat()})")
    print(f"Calendar event for prediction week: {calendar_features(target, events)['calendar_event']}")
    print("\nOutputs:")
    print(f"- {COMPARISON_OUT}")
    print(f"- {METRICS_OUT}")
    print(f"- {MODEL_OUT}")
    print(f"- {PREDICTIONS_OUT}")


if __name__ == "__main__":
    main()
