import csv
import math
from collections import defaultdict
from datetime import datetime
from pathlib import Path


MONTHLY_TRENDS = Path("data/ml/monthly_health_trends.csv")
PREDICTIONS_OUT = Path("data/ml/health_trend_predictions.csv")
MODEL_OUT = Path("data/ml/health_trend_model.joblib")
METRICS_OUT = Path("data/ml/model_metrics.txt")
MODEL_COMPARISON_OUT = Path("data/ml/model_comparison.csv")

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

RECOMMENDATIONS = {
    "Headache": "Conduct a symposium on responsible gadget use, eye strain prevention, sleep habits, hydration, posture, and stress management.",
    "Respiratory": "Conduct a hygiene and cough etiquette campaign, including early consultation reminders.",
    "Fever": "Issue a fever monitoring advisory and encourage early clinic consultation.",
    "Allergy": "Conduct an allergy-awareness campaign about common triggers and proper medicine use.",
    "Body Pain": "Conduct an ergonomics, stretching, posture, and physical wellness awareness activity.",
    "Gastrointestinal": "Conduct a food safety, handwashing, and sanitation awareness campaign.",
    "Dysmenorrhea": "Conduct a women’s health awareness session and promote proper consultation.",
    "Wound/Injury": "Conduct a first-aid and safety-prevention orientation.",
    "Dizziness": "Conduct a hydration, nutrition, rest, and heat-safety awareness campaign.",
    "Dental": "Conduct a dental hygiene and oral health awareness campaign.",
    "Blood Pressure": "Conduct a blood pressure monitoring and healthy lifestyle awareness activity.",
}

ACTION_TYPES = {
    "Headache": "Symposium",
    "Respiratory": "Health Campaign",
    "Fever": "Health Advisory",
    "Allergy": "Health Campaign",
    "Body Pain": "Wellness Activity",
    "Gastrointestinal": "Health Campaign",
    "Dysmenorrhea": "Awareness Session",
    "Wound/Injury": "Safety Orientation",
    "Dizziness": "Health Advisory",
    "Dental": "Health Campaign",
    "Blood Pressure": "Monitoring Activity",
}


def require_ml_libraries():
    try:
        from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
        from sklearn.feature_extraction import DictVectorizer
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        from sklearn.pipeline import Pipeline
        import joblib
    except ModuleNotFoundError as exc:
        missing = exc.name
        raise SystemExit(
            f"Missing Python package: {missing}\n\n"
            "Install the ML dependencies first:\n"
            "  python -m pip install scikit-learn joblib\n\n"
            "After installing, run this script again:\n"
            "  python scripts/train_health_trend_model.py"
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


def add_month(month_key, offset):
    date = datetime.strptime(month_key + "-01", "%Y-%m-%d")
    month_index = date.year * 12 + date.month - 1 + offset
    year = month_index // 12
    month = month_index % 12 + 1
    return f"{year:04d}-{month:02d}"


def month_range(start, end):
    months = []
    current = start
    while current <= end:
        months.append(current)
        current = add_month(current, 1)
    return months


def is_exam_month(month_number):
    # Adjust later if the clinic/school uses a different academic calendar.
    return month_number in {3, 4, 10, 11}


def is_rainy_season(month_number):
    # Philippine rainy season is commonly around June to November.
    return month_number in {6, 7, 8, 9, 10, 11}


def read_monthly_counts():
    if not MONTHLY_TRENDS.exists():
        raise SystemExit(f"Missing input file: {MONTHLY_TRENDS}")

    counts = defaultdict(int)
    with MONTHLY_TRENDS.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            category = row["complaint_category"].strip()
            if category not in HEALTH_CATEGORIES:
                continue
            counts[(row["month_key"], category)] = int(row["case_count"])

    if not counts:
        raise SystemExit("No usable health trend rows found.")
    return counts


def build_series(counts):
    months = sorted({month_key for month_key, _ in counts})
    full_months = month_range(months[0], months[-1])

    series = {}
    for category in HEALTH_CATEGORIES:
        series[category] = [counts.get((month_key, category), 0) for month_key in full_months]

    return full_months, series


def average(values):
    return sum(values) / len(values) if values else 0


def make_features(month_key, category, values, index):
    current_count = values[index]
    previous_count = values[index - 1] if index >= 1 else 0
    two_months_ago = values[index - 2] if index >= 2 else 0
    last_3_average = average(values[max(0, index - 2): index + 1])
    last_6_average = average(values[max(0, index - 5): index + 1])
    baseline_average = average(values[: index + 1])
    pct_change = 0
    if previous_count > 0:
        pct_change = (current_count - previous_count) / previous_count

    year, month_number = map(int, month_key.split("-"))
    return {
        "category": category,
        "year": year,
        "month_number": month_number,
        "current_count": current_count,
        "previous_count": previous_count,
        "two_months_ago": two_months_ago,
        "last_3_average": round(last_3_average, 4),
        "last_6_average": round(last_6_average, 4),
        "baseline_average": round(baseline_average, 4),
        "pct_change": round(pct_change, 4),
        "is_exam_month": int(is_exam_month(month_number)),
        "is_rainy_season": int(is_rainy_season(month_number)),
    }


def build_training_rows(months, series):
    features = []
    targets = []
    labels = []

    # Keep rows in calendar order. This is essential: the last months must be
    # held out for validation so the model is tested only on data it could not
    # have known at the time of a real prediction.
    for index in range(1, len(months) - 1):
        for category, values in series.items():
            # The target is the next month's case count.
            features.append(make_features(months[index], category, values, index))
            targets.append(values[index + 1])
            labels.append((months[index], category))

    return features, targets, labels


def chronological_split(features, targets, labels, validation_months=8):
    source_months = sorted({month_key for month_key, _ in labels})
    if len(source_months) <= validation_months:
        raise SystemExit("Not enough monthly history for chronological validation.")

    validation_start = source_months[-validation_months]
    train_indexes = [index for index, label in enumerate(labels) if label[0] < validation_start]
    test_indexes = [index for index, label in enumerate(labels) if label[0] >= validation_start]

    return (
        [features[index] for index in train_indexes],
        [features[index] for index in test_indexes],
        [targets[index] for index in train_indexes],
        [targets[index] for index in test_indexes],
        [labels[index] for index in test_indexes],
        validation_start,
    )


def metrics_for(libs, actual, predicted):
    mae = libs["mean_absolute_error"](actual, predicted)
    mse = libs["mean_squared_error"](actual, predicted)
    rmse = math.sqrt(mse)
    r2 = libs["r2_score"](actual, predicted) if len(set(actual)) > 1 else 0
    return {"mae": mae, "rmse": rmse, "r2": r2}


def build_model(libs, estimator):
    return libs["Pipeline"]([
        ("vectorizer", libs["DictVectorizer"]()),
        ("regressor", estimator),
    ])


def classify_trend(current_count, predicted_count, baseline_average):
    reference = max(baseline_average, current_count, 1)
    increase_ratio = (predicted_count - reference) / reference

    # Avoid scary labels for very small counts. For example, 2 to 3 cases is a
    # 50% increase mathematically, but it is not enough evidence for a
    # campus-wide "Critical" intervention.
    if predicted_count < 5:
        return "Low"
    if predicted_count < 10:
        if increase_ratio >= 0.50:
            return "Moderate"
        return "Stable"
    if predicted_count < 20:
        if increase_ratio >= 0.50:
            return "High"
        if increase_ratio >= 0.25:
            return "Moderate"
        return "Stable"

    if increase_ratio >= 0.50:
        return "Critical"
    if increase_ratio >= 0.25:
        return "High"
    if increase_ratio >= 0.10:
        return "Moderate"
    return "Stable"


def recommendation_for(category, trend_level):
    if trend_level in {"High", "Critical"}:
        return RECOMMENDATIONS.get(category, "Review the health trend and prepare an appropriate preventive action.")
    if trend_level == "Moderate":
        return "Monitor this trend and consider a targeted advisory if cases continue increasing."
    return "No major preventive activity needed; continue regular monitoring."


def action_type_for(category, trend_level):
    if trend_level in {"High", "Critical"}:
        return ACTION_TYPES.get(category, "Preventive Action")
    if trend_level == "Moderate":
        return "Targeted Advisory"
    return "Regular Monitoring"


def priority_score_for(current_count, predicted_count, baseline_average, trend_level):
    trend_weight = {
        "Critical": 40,
        "High": 30,
        "Moderate": 20,
        "Stable": 10,
        "Low": 5,
    }[trend_level]
    volume_score = min(predicted_count, 40)
    baseline_gap = max(0, predicted_count - baseline_average)
    baseline_score = min(round(baseline_gap * 2), 20)
    current_score = min(round(current_count / 2), 10)
    return min(100, int(trend_weight + volume_score + baseline_score + current_score))


def reason_for(category, current_count, predicted_count, baseline_average, trend_level):
    direction = "remain the same"
    if predicted_count > current_count:
        direction = "increase"
    elif predicted_count < current_count:
        direction = "decrease"

    if trend_level in {"High", "Critical"}:
        return (
            f"{category} cases are currently {current_count} and are predicted to {direction} "
            f"to {predicted_count}, which is above the normal average of {baseline_average:.2f}. "
            "A preventive action is recommended for clinic head review."
        )

    if trend_level == "Moderate":
        return (
            f"{category} cases are currently {current_count} and are predicted to {direction} "
            f"to {predicted_count}. This needs monitoring because the predicted value is near or above "
            f"the normal average of {baseline_average:.2f}."
        )

    return (
        f"{category} cases are currently {current_count} and are predicted to {direction} "
        f"to {predicted_count}. This does not require a major intervention based on the current threshold; "
        "continue regular monitoring."
    )


def main():
    libs = require_ml_libraries()
    counts = read_monthly_counts()
    months, series = build_series(counts)
    features, targets, labels = build_training_rows(months, series)

    if len(features) < 20:
        raise SystemExit("Not enough monthly training rows. Check monthly_health_trends.csv.")

    train_features, test_features, train_targets, test_targets, test_labels, validation_start = chronological_split(
        features, targets, labels
    )

    # Baselines make the evaluation meaningful. If ML cannot beat these simple
    # strategies, it should not be presented as an improvement.
    persistence_predictions = [feature["current_count"] for feature in test_features]
    moving_average_predictions = [feature["last_3_average"] for feature in test_features]
    comparison = [
        {"model": "Persistence baseline (current count)", **metrics_for(libs, test_targets, persistence_predictions)},
        {"model": "3-month moving-average baseline", **metrics_for(libs, test_targets, moving_average_predictions)},
    ]

    candidates = [
        (
            "RandomForestRegressor",
            libs["RandomForestRegressor"](
                n_estimators=500,
                random_state=42,
                min_samples_leaf=2,
                max_features=0.8,
            ),
        ),
        (
            "ExtraTreesRegressor",
            libs["ExtraTreesRegressor"](
                n_estimators=500,
                random_state=42,
                min_samples_leaf=2,
                max_features=0.9,
            ),
        ),
    ]

    trained_candidates = []
    for name, estimator in candidates:
        candidate_model = build_model(libs, estimator)
        candidate_model.fit(train_features, train_targets)
        candidate_metrics = metrics_for(libs, test_targets, candidate_model.predict(test_features))
        comparison.append({"model": name, **candidate_metrics})
        trained_candidates.append((name, estimator, candidate_metrics))

    # Baselines remain in the report as an accuracy benchmark. ClinicQR's
    # operational forecast remains an ML forecast, using the stronger of the
    # evaluated ML models.
    best_name, best_estimator, best_metrics = min(
        trained_candidates,
        key=lambda row: (row[2]["mae"], row[2]["rmse"]),
    )
    best_type = "machine_learning"

    # Retrain the selected ML estimator using all validated history.
    model = build_model(libs, best_estimator)
    model.fit(features, targets)

    mae = best_metrics["mae"]
    rmse = best_metrics["rmse"]
    r2 = best_metrics["r2"]

    latest_month = months[-1]
    next_month = add_month(latest_month, 1)
    prediction_rows = []
    for category in HEALTH_CATEGORIES:
        values = series[category]
        feature = make_features(latest_month, category, values, len(months) - 1)
        raw_prediction = model.predict([feature])[0]
        predicted_count = max(0, round(float(raw_prediction)))
        current_count = values[-1]
        baseline_average = feature["baseline_average"]
        trend_level = classify_trend(current_count, predicted_count, baseline_average)
        priority_score = priority_score_for(current_count, predicted_count, baseline_average, trend_level)
        prediction_rows.append({
            "source_month": latest_month,
            "prediction_month": next_month,
            "complaint_category": category,
            "current_cases": current_count,
            "predicted_cases": predicted_count,
            "baseline_average": round(baseline_average, 2),
            "forecast_method": best_name,
            "trend_level": trend_level,
            "priority_score": priority_score,
            "recommended_action_type": action_type_for(category, trend_level),
            "recommendation": recommendation_for(category, trend_level),
            "reason": reason_for(category, current_count, predicted_count, baseline_average, trend_level),
        })

    prediction_rows.sort(
        key=lambda row: (
            {"Critical": 4, "High": 3, "Moderate": 2, "Stable": 1, "Low": 0}[row["trend_level"]],
            row["priority_score"],
            row["predicted_cases"],
        ),
        reverse=True,
    )

    PREDICTIONS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with PREDICTIONS_OUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "source_month", "prediction_month", "complaint_category", "current_cases",
            "predicted_cases", "baseline_average", "forecast_method", "trend_level", "priority_score",
            "recommended_action_type", "recommendation", "reason",
        ])
        writer.writeheader()
        writer.writerows(prediction_rows)

    libs["joblib"].dump({
        "model": model,
        "model_name": best_name,
        "forecast_method_type": best_type,
        "health_categories": HEALTH_CATEGORIES,
        "recommendations": RECOMMENDATIONS,
        "latest_training_month": latest_month,
        "next_prediction_month": next_month,
        "validation_start_month": validation_start,
        "validation_metrics": best_metrics,
    }, MODEL_OUT)

    with METRICS_OUT.open("w", encoding="utf-8") as f:
        f.write("Health trend model metrics\n")
        f.write("==========================\n\n")
        f.write(f"Selected forecast method: {best_name}\n")
        # Retained for the existing dashboard reader; its value is the same
        # selected forecast method shown above.
        f.write(f"Model: {best_name}\n")
        f.write(f"Training rows: {len(train_features)}\n")
        f.write(f"Testing rows: {len(test_features)}\n")
        f.write(f"Month range: {months[0]} to {months[-1]}\n")
        f.write(f"Validation period: {validation_start} to {test_labels[-1][0]}\n")
        f.write(f"Prediction month: {next_month}\n\n")
        f.write(f"MAE: {mae:.4f}\n")
        f.write(f"RMSE: {rmse:.4f}\n")
        f.write(f"R2: {r2:.4f}\n\n")
        f.write("Validation method: Most recent months held out chronologically.\n")
        f.write("ML selection rule: Lowest MAE, then lowest RMSE, across the evaluated ML models.\n")
        f.write("Baselines are retained in model_comparison.csv for accuracy benchmarking.\n")
        f.write("Note: This forecast predicts monthly case counts for decision support only.\n")
        f.write("The clinic head remains the final decision-maker.\n")

    with MODEL_COMPARISON_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["model", "mae", "rmse", "r2"])
        writer.writeheader()
        writer.writerows(comparison)

    print(f"Wrote: {PREDICTIONS_OUT}")
    print(f"Wrote: {MODEL_OUT}")
    print(f"Wrote: {METRICS_OUT}")
    print(f"Wrote: {MODEL_COMPARISON_OUT}")
    print(f"Selected forecast method: {best_name}")
    print(f"Validation: {validation_start} to {test_labels[-1][0]}")
    print(f"MAE={mae:.4f} RMSE={rmse:.4f} R2={r2:.4f}")


if __name__ == "__main__":
    main()
