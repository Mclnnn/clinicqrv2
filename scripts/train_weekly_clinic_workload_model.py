import csv
import math
from datetime import datetime, timedelta
from pathlib import Path


WEEKLY_WORKLOAD = Path("data/ml/weekly_clinic_workload.csv")
CALENDAR_IN = Path("data/ml/dummy_school_calendar.csv")
PREDICTIONS_OUT = Path("data/ml/weekly_clinic_workload_predictions.csv")
MODEL_OUT = Path("data/ml/weekly_clinic_workload_model.joblib")
METRICS_OUT = Path("data/ml/weekly_clinic_workload_model_metrics.txt")
COMPARISON_OUT = Path("data/ml/weekly_clinic_workload_model_comparison.csv")

COMPONENT_COLUMNS = [
    "health_visits",
    "non_health_visits",
    "medical_certificate_visits",
    "enrollment_requirement_visits",
    "supply_medicine_visits",
    "consultation_assessment_visits",
    "unknown_other_visits",
    "unique_departments",
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


def parse_date(value: str):
    return datetime.strptime(value.strip(), "%Y-%m-%d").date()


def next_week(value):
    return value + timedelta(days=7)


def week_key(value) -> str:
    iso = value.isocalendar()
    return f"{iso.year:04d}-W{iso.week:02d}"


def average(values):
    return sum(values) / len(values) if values else 0.0


def read_calendar():
    if not CALENDAR_IN.exists():
        return []

    events = []
    with CALENDAR_IN.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"start_date", "end_date", "event_type"}
        if not required.issubset(reader.fieldnames or []):
            return []

        for row in reader:
            events.append(
                {
                    "start": parse_date(row["start_date"]),
                    "end": parse_date(row["end_date"]),
                    "event_type": (row.get("event_type") or "Other").strip(),
                }
            )

    return events


def calendar_features(week_start, events):
    week_end = week_start + timedelta(days=6)
    matched = [
        event["event_type"]
        for event in events
        if event["start"] <= week_end and event["end"] >= week_start
    ]

    unique = sorted(set(matched))
    event_text = "|".join(unique) if unique else "Regular"
    lower = {item.lower() for item in unique}

    return {
        "calendar_event": event_text,
        "calendar_event_count": len(unique),
        "is_exam_week": int(any("exam" in item or "assessment" in item for item in lower)),
        "is_break_week": int(any("break" in item or "holiday" in item for item in lower)),
        "is_school_start": int(any("start" in item or "resume" in item for item in lower)),
        "is_enrollment_period": int(any("enrollment" in item for item in lower)),
    }


def read_weekly_workload():
    if not WEEKLY_WORKLOAD.exists():
        raise SystemExit(f"Missing input file: {WEEKLY_WORKLOAD}")

    rows = []
    with WEEKLY_WORKLOAD.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"week_start", "total_visits", *COMPONENT_COLUMNS}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing required column(s): {', '.join(sorted(missing))}")

        for row in reader:
            week_start = parse_date(row["week_start"])
            parsed = {"week_start": week_start}
            parsed["total_visits"] = int(float(row.get("total_visits") or 0))
            for column in COMPONENT_COLUMNS:
                parsed[column] = int(float(row.get(column) or 0))
            rows.append(parsed)

    if len(rows) < 20:
        raise SystemExit("Not enough weekly workload rows found.")

    return sorted(rows, key=lambda row: row["week_start"])


def build_training_rows(rows, events):
    features, targets, labels = [], [], []
    totals = [row["total_visits"] for row in rows]

    for index in range(12, len(rows) - 1):
        target_index = index + 1
        features.append(make_features(rows, totals, index, rows[target_index]["week_start"], events))
        targets.append(totals[target_index])
        labels.append(rows[index]["week_start"])

    return features, targets, labels


def make_features(rows, totals, index, target_week, events):
    source = rows[index]
    source_week = source["week_start"]
    source_iso = source_week.isocalendar()
    target_iso = target_week.isocalendar()
    target_cal = calendar_features(target_week, events)
    source_cal = calendar_features(source_week, events)

    feature = {
        "source_year": source_week.year,
        "source_month": source_week.month,
        "source_week_of_year": source_iso.week,
        "target_month": target_week.month,
        "target_week_of_year": target_iso.week,
        "current_total_visits": source["total_visits"],
        "rolling_4_average": round(average(totals[max(0, index - 3): index + 1]), 4),
        "rolling_8_average": round(average(totals[max(0, index - 7): index + 1]), 4),
        "rolling_12_average": round(average(totals[max(0, index - 11): index + 1]), 4),
        "previous_year_total": totals[index - 52] if index >= 52 else 0,
        "target_calendar_event": target_cal["calendar_event"],
        "target_calendar_event_count": target_cal["calendar_event_count"],
        "target_is_exam_week": target_cal["is_exam_week"],
        "target_is_break_week": target_cal["is_break_week"],
        "target_is_school_start": target_cal["is_school_start"],
        "target_is_enrollment_period": target_cal["is_enrollment_period"],
        "source_calendar_event": source_cal["calendar_event"],
        "source_is_exam_week": source_cal["is_exam_week"],
        "source_is_break_week": source_cal["is_break_week"],
    }

    for lag in range(1, 13):
        feature[f"lag_{lag}"] = totals[index - lag] if index >= lag else 0

    for column in COMPONENT_COLUMNS:
        feature[f"current_{column}"] = source[column]

    return feature


def chronological_split(features, targets, labels, validation_weeks=16):
    source_weeks = sorted(set(labels))
    if len(source_weeks) <= validation_weeks:
        raise SystemExit("Not enough weekly history for chronological validation.")

    validation_start = source_weeks[-validation_weeks]
    train_idx = [i for i, label in enumerate(labels) if label < validation_start]
    test_idx = [i for i, label in enumerate(labels) if label >= validation_start]

    return (
        [features[i] for i in train_idx],
        [features[i] for i in test_idx],
        [targets[i] for i in train_idx],
        [targets[i] for i in test_idx],
        validation_start,
    )


def metrics_for(libs, actual, predicted):
    mae = libs["mean_absolute_error"](actual, predicted)
    rmse = math.sqrt(libs["mean_squared_error"](actual, predicted))
    r2 = libs["r2_score"](actual, predicted) if len(set(actual)) > 1 else 0
    return {"mae": mae, "rmse": rmse, "r2": r2}


def build_model(libs, estimator):
    return libs["Pipeline"](
        [
            ("vectorizer", libs["DictVectorizer"]()),
            ("regressor", estimator),
        ]
    )


def classify_workload(predicted_total, rolling_average):
    if predicted_total >= max(rolling_average * 1.35, rolling_average + 15):
        return "High"

    if predicted_total >= max(rolling_average * 1.15, rolling_average + 8):
        return "Moderate"

    if predicted_total <= max(rolling_average * 0.70, rolling_average - 10):
        return "Low"

    return "Typical"


def priority_score(predicted_total, rolling_average, current_total):
    if rolling_average <= 0:
        return min(100, predicted_total * 2)

    volume_score = min(55, predicted_total * 1.2)
    increase_score = max(0, predicted_total - rolling_average) * 2
    current_pressure_score = min(20, current_total)
    return min(100, round(volume_score + increase_score + current_pressure_score))


def main_driver(row):
    drivers = {
        "Health visits": row["health_visits"],
        "Medical certificates": row["medical_certificate_visits"],
        "Enrollment/requirements": row["enrollment_requirement_visits"],
        "Medicine/supply requests": row["supply_medicine_visits"],
        "Consultation/assessment": row["consultation_assessment_visits"],
        "Other/unclear visits": row["unknown_other_visits"],
    }
    label, value = max(drivers.items(), key=lambda item: item[1])
    return label if value > 0 else "No dominant driver"


def recommendation_for(level, driver):
    if level == "High":
        return f"Prepare for a high-volume clinic week. Main recent driver: {driver}. Consider staff scheduling, medicine/forms readiness, and faster queue handling."

    if level == "Moderate":
        return f"Monitor workload closely and prepare basic clinic resources. Main recent driver: {driver}."

    if level == "Low":
        return "Expected workload is lower than usual. Continue regular monitoring."

    return "Expected workload is typical. Maintain regular clinic operations."


def predict_with_selected(selected, model, feature):
    name = selected["model"]
    if name == "Persistence baseline (current week)":
        return feature["current_total_visits"]
    if name == "4-week moving-average baseline":
        return feature["rolling_4_average"]
    return float(model.predict([feature])[0])


def main():
    libs = require_ml_libraries()
    events = read_calendar()
    rows = read_weekly_workload()
    totals = [row["total_visits"] for row in rows]
    features, targets, labels = build_training_rows(rows, events)

    train_x, test_x, train_y, test_y, validation_start = chronological_split(
        features,
        targets,
        labels,
    )

    comparison = [
        {
            "model": "Persistence baseline (current week)",
            **metrics_for(libs, test_y, [row["current_total_visits"] for row in test_x]),
        },
        {
            "model": "4-week moving-average baseline",
            **metrics_for(libs, test_y, [row["rolling_4_average"] for row in test_x]),
        },
    ]

    trained_models = {}
    candidates = [
        (
            "RandomForestRegressor",
            libs["RandomForestRegressor"](
                n_estimators=600,
                random_state=42,
                min_samples_leaf=2,
                max_features=0.8,
                n_jobs=-1,
            ),
        ),
        (
            "ExtraTreesRegressor",
            libs["ExtraTreesRegressor"](
                n_estimators=600,
                random_state=42,
                min_samples_leaf=2,
                max_features=0.9,
                n_jobs=-1,
            ),
        ),
    ]

    for name, estimator in candidates:
        model = build_model(libs, estimator)
        model.fit(train_x, train_y)
        predicted = model.predict(test_x)
        comparison.append({"model": name, **metrics_for(libs, test_y, predicted)})
        trained_models[name] = model

    selected = min(comparison, key=lambda row: (row["mae"], row["rmse"]))
    selected_model = None
    if selected["model"] in trained_models:
        estimator_name = selected["model"]
        estimator = next(item[1] for item in candidates if item[0] == estimator_name)
        selected_model = build_model(libs, estimator)
        selected_model.fit(features, targets)

    latest = rows[-1]
    prediction_week = next_week(latest["week_start"])
    prediction_feature = make_features(rows, totals, len(rows) - 1, prediction_week, events)
    predicted_total = max(0, round(predict_with_selected(selected, selected_model, prediction_feature)))
    rolling_average = prediction_feature["rolling_8_average"]
    level = classify_workload(predicted_total, rolling_average)
    driver = main_driver(latest)
    score = priority_score(predicted_total, rolling_average, latest["total_visits"])
    calendar_event = calendar_features(prediction_week, events)["calendar_event"]

    prediction_rows = [
        {
            "source_week": week_key(latest["week_start"]),
            "prediction_week": week_key(prediction_week),
            "source_week_start": latest["week_start"].isoformat(),
            "prediction_week_start": prediction_week.isoformat(),
            "current_total_visits": latest["total_visits"],
            "predicted_total_visits": predicted_total,
            "current_health_visits": latest["health_visits"],
            "current_non_health_visits": latest["non_health_visits"],
            "workload_level": level,
            "priority_score": score,
            "main_recent_driver": driver,
            "recommendation": recommendation_for(level, driver),
            "forecast_method": selected["model"],
            "calendar_event": calendar_event,
            "rolling_8_average": round(rolling_average, 2),
        }
    ]

    PREDICTIONS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with PREDICTIONS_OUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(prediction_rows[0]))
        writer.writeheader()
        writer.writerows(prediction_rows)

    with COMPARISON_OUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["model", "mae", "rmse", "r2"])
        writer.writeheader()
        writer.writerows(comparison)

    with METRICS_OUT.open("w", encoding="utf-8") as handle:
        handle.write("ClinicQR Weekly Clinic Workload Forecast\n")
        handle.write(f"Input weeks: {len(rows)}\n")
        handle.write(f"Training rows: {len(train_x)}\n")
        handle.write(f"Validation rows: {len(test_x)}\n")
        handle.write(f"Validation starts: {validation_start.isoformat()}\n")
        handle.write(f"Latest observed week: {latest['week_start'].isoformat()}\n")
        handle.write(f"Prediction week: {prediction_week.isoformat()}\n")
        handle.write(f"Selected method: {selected['model']}\n")
        handle.write(f"MAE: {selected['mae']:.4f}\n")
        handle.write(f"RMSE: {selected['rmse']:.4f}\n")
        handle.write(f"R2: {selected['r2']:.4f}\n")
        handle.write("\nThis workload forecast uses all clinic records, not only health complaint categories.\n")

    artifact = {
        "selected_method": selected["model"],
        "features": list(features[0].keys()),
        "calendar_source": str(CALENDAR_IN),
        "note": "If selected_method is a baseline, model is None because the final forecast uses the baseline rule.",
        "model": selected_model,
    }
    libs["joblib"].dump(artifact, MODEL_OUT)

    print("Weekly clinic workload model training completed successfully.")
    print(f"Input weeks: {len(rows)}")
    print(f"Training rows: {len(train_x)}")
    print(f"Validation rows: {len(test_x)}")
    print(f"Validation start: {validation_start.isoformat()}")
    print("\nModel comparison:")
    for row in comparison:
        print(f"{row['model']}: MAE={row['mae']:.4f}, RMSE={row['rmse']:.4f}, R2={row['r2']:.4f}")
    print(f"\nSelected method: {selected['model']}")
    print(f"Prediction week: {week_key(prediction_week)} ({prediction_week.isoformat()})")
    print(f"Predicted workload: {predicted_total} visits ({level})")
    print("\nOutputs:")
    print(f"- {COMPARISON_OUT}")
    print(f"- {METRICS_OUT}")
    print(f"- {MODEL_OUT}")
    print(f"- {PREDICTIONS_OUT}")


if __name__ == "__main__":
    main()
