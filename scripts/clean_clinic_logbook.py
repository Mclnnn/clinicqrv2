import csv
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path


SOURCE = Path(r"C:\Users\User\Downloads\clinic_logbook_school_aware_FINAL_COMPLETE_VERIFIED.xlsx")
OUT_DIR = Path("data/ml")
CLEAN_LOGS = OUT_DIR / "clinic_logbook_clean_for_ml.csv"
MONTHLY_TRENDS = OUT_DIR / "monthly_health_trends.csv"
MAPPING_USED = OUT_DIR / "complaint_category_mapping_used.csv"
SUMMARY = OUT_DIR / "cleaning_summary.txt"
FUTURE_DATE_TRACE = OUT_DIR / "future_date_trace.csv"
CUTOFF_DATE = "2026-08-03"

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

DEPARTMENT_CODES = {
    "BSAB", "IBEG", "ITED", "IARS", "ICET", "BPA", "CAS", "BSIT", "DIT", "BSA",
    "BSED", "BSIS", "BSAF", "BSDC", "CBEG", "CCET", "CARS", "CTED", "CMAS",
    "IMAS", "IABE", "IAS", "EMPLOYEES", "FACULTY", "STAFF",
}

IP_VALUES = {"IP", "NON-IP", "NON IP", "NON", "NONIP", "NON - IP", "N/A", "NA"}

PURPOSE_WORDS = {
    "MEDICINE", "MED", "MEDS", "MED CERT", "MED-CERT", "MEDICAL CERT",
    "MEDICAL CERT.", "MEDICAL CERTIFICATE", "MEDICAL", "CHECK-UP", "CHECK UP",
    "MEDICAL CHECK-UP", "BMI", "HEIGHT/WEIGHT", "HEIGHT", "WEIGHT",
    "ENROLLMENT", "ROTC", "CLEARANCE", "GENERAL CLEARANCE", "PHYSICAL CHECKUP",
    "PHYSICAL CHECK-UP", "MEDICAL EXAMINATION",
}

ADDRESS_WORDS = {
    "DAVAO", "DIGOS", "CITY", "MATANAO", "BANSALAN", "SULOP", "PADADA", "KIBLAWAN",
    "MAGSAYSAY", "STA.CRUZ", "STA. CRUZ", "TIGUMAN", "TRES DE MAYO", "BINATON",
    "CABLIGAN", "COLORADO", "DAVSUR", "DAV SUR", "DAVAO DEL SUR", "DAVAO OCCIDENTAL",
}

CATEGORY_PATTERNS = [
    ("Headache", [
        "HEADACHE", "HEAD ACHE", "H/A", "MIGRAINE", "DIZZINESS WITH HEADACHE",
    ]),
    ("Respiratory", [
        "COUGH", "DRY COUGH", "COLDS", "COLD", "SORE THROAT", "RUNNY NOSE",
        "FLU", "ASTHMA", "RESPIRATORY", "SINUS", "PHLEGM", "DIFFICULTY BREATH",
    ]),
    ("Fever", ["FEVER", "FEBRILE", "HIGH TEMP", "TEMPERATURE"]),
    ("Allergy", ["ALLERGY", "ALLERGIES", "RASHES", "ITCH", "URTICARIA"]),
    ("Body Pain", [
        "BODY PAIN", "BACK PAIN", "CHEST PAIN", "MUSCLE PAIN", "JOINT PAIN",
        "LEG PAIN", "ARM PAIN", "SHOULDER PAIN", "NECK PAIN", "PAIN",
    ]),
    ("Gastrointestinal", [
        "STOMACH", "STOMACHACHE", "ABDOMINAL", "DIARRHEA", "DIARRHOEA",
        "VOMIT", "NAUSEA", "LBM", "GASTRIC", "ACIDITY", "DYSPEPSIA",
    ]),
    ("Dysmenorrhea", ["DYSMENORRHEA", "DYSMENORRHOEA", "MENSTRUAL", "MENSTRUATION"]),
    ("Wound/Injury", [
        "WOUND", "INJURY", "CUT", "ABRASION", "SPRAIN", "BURN", "BLEED",
        "CLEANING WOUND", "WOUND CARE", "DRESSING",
    ]),
    ("Dizziness", ["DIZZY", "DIZZINESS", "VERTIGO", "FAINT", "SYNCOPE"]),
    ("Dental", ["DENTAL", "TOOTH", "TOOTHACHE"]),
    ("Eye/Ear Concern", ["EYE", "EAR", "VISION", "EYE STRAIN"]),
    ("Blood Pressure", ["BLOOD PRESSURE", "HIGH BLOOD", "HYPERTENSION", "BP"]),
    ("Medical Certificate", ["MEDICAL CERT", "MED CERT", "MED-CERT", "CERTIFICATE"]),
    ("Physical Assessment", ["BMI", "HEIGHT/WEIGHT", "HEIGHT", "WEIGHT", "VITAL SIGN", "H/W", "H & W", "H AND W"]),
    ("Check-up/Consultation", ["CHECK-UP", "CHECK UP", "CONSULT", "ROUTINE CHECK", "MEDICAL CHECK-UP"]),
    ("Enrollment/Requirement", ["ENROLLMENT", "ENROLLEMENT", "ROTC", "CLEARANCE", "SCUAA", "P.E", "PE", "PASUC", "OJT", "TRAINING", "ELIGIBILITY"]),
    ("Supply/Medicine Issuance", ["SUPPLY", "ALCOHOL", "FACE MASK", "FACEMASK", "GLOVES", "VITAMINS", "MEDICINE", "MEDS", "MED"]),
    ("Laboratory", ["LAB", "LABORATORY"]),
]

HEALTH_CATEGORIES = {
    "Headache", "Respiratory", "Fever", "Allergy", "Body Pain", "Gastrointestinal",
    "Dysmenorrhea", "Wound/Injury", "Dizziness", "Dental", "Eye/Ear Concern",
    "Blood Pressure",
}


def normalize_text(value):
    if value is None:
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def upper_clean(value):
    return normalize_text(value).upper()


def excel_date(value):
    text = normalize_text(value)
    if not text:
        return ""
    try:
        number = float(text)
        if number > 20000:
            return (datetime(1899, 12, 30) + timedelta(days=number)).date().isoformat()
    except ValueError:
        pass
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return ""


def adjusted_non_future_date(visit_date):
    if not visit_date or visit_date <= CUTOFF_DATE:
        return visit_date, "no", ""

    date = datetime.strptime(visit_date, "%Y-%m-%d").date()

    # The uploaded 2026 sheet contains future-dated rows. For the ML prototype,
    # keep these records but place them in non-future months as requested:
    # August/October -> June, September/November -> July.
    if date.month in {8, 10}:
        adjusted_month = 6
        adjusted_day = min(date.day, 30)
    else:
        adjusted_month = 7
        adjusted_day = min(date.day, 31)

    adjusted = date.replace(month=adjusted_month, day=adjusted_day)
    return adjusted.isoformat(), "yes", visit_date


def categorize_complaint(value):
    text = upper_clean(value)
    if not text or text in {"N/A", "NA", "-", "NONE", "NULL"}:
        return "Unknown"
    for category, patterns in CATEGORY_PATTERNS:
        for pattern in patterns:
            if pattern_matches(text, pattern):
                return category
    return "Other"


def pattern_matches(text, pattern):
    pattern = pattern.upper()
    if pattern in {"H/A"}:
        return bool(re.search(r"(^|[^A-Z0-9])H\s*/\s*A([^A-Z0-9]|$)", text))
    if len(pattern) <= 3 or pattern in {"EYE", "EAR", "BP", "PE", "MED"}:
        return bool(re.search(rf"(^|[^A-Z0-9]){re.escape(pattern)}([^A-Z0-9]|$)", text))
    return pattern in text


def complaint_score(value):
    text = upper_clean(value)
    if any(word in text for word in ADDRESS_WORDS):
        return -1
    category = categorize_complaint(value)
    if category in {
        "Unknown", "Other", "Medical Certificate", "Physical Assessment",
        "Enrollment/Requirement", "Supply/Medicine Issuance", "Laboratory",
        "Check-up/Consultation",
    }:
        return 0
    return 2


def looks_like_department(value):
    text = upper_clean(value)
    return text in DEPARTMENT_CODES or bool(re.match(r"^(BS|BSED|C|I)[A-Z\- ]{2,12}$", text))


def looks_like_ip(value):
    return upper_clean(value).replace(".", "") in IP_VALUES


def looks_like_purpose(value):
    text = upper_clean(value)
    return any(word in text for word in PURPOSE_WORDS)


def looks_like_address(value):
    text = upper_clean(value)
    return any(word in text for word in ADDRESS_WORDS)


def colnum(cell_ref):
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    number = 0
    for ch in letters:
        number = number * 26 + ord(ch.upper()) - 64
    return number


def load_shared_strings(zf):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("a:si", NS):
        strings.append("".join((t.text or "") for t in si.findall(".//a:t", NS)))
    return strings


def cell_value(cell, shared_strings):
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        try:
            return shared_strings[int(raw)]
        except (ValueError, IndexError):
            return raw
    return raw


def read_sheet_rows(zf, sheet_path, shared_strings):
    root = ET.fromstring(zf.read(sheet_path))
    rows = []
    for row in root.findall(".//a:sheetData/a:row", NS):
        values = {}
        for cell in row.findall("a:c", NS):
            values[colnum(cell.attrib.get("r", "A1"))] = cell_value(cell, shared_strings)
        if values:
            rows.append([values.get(i, "") for i in range(1, max(values) + 1)])
    return rows


def workbook_sheets(zf):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheets = []
    for sheet in workbook.findall(".//a:sheets/a:sheet", NS):
        name = sheet.attrib["name"]
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        target = targets[rid]
        path = "xl/" + target.lstrip("/") if not target.startswith("xl/") else target
        sheets.append((name, path))
    return sheets


def get(row, index):
    if index is None or index < 1:
        return ""
    return normalize_text(row[index - 1]) if len(row) >= index else ""


def has_non_date_data(row):
    return any(get(row, index) for index in range(2, 11))


def pick_2026_fields(row):
    c6, c7, c8, c9 = get(row, 6), get(row, 7), get(row, 8), get(row, 9)
    candidates = [c6, c7, c8]
    complaint = max(candidates, key=complaint_score)
    department = c6 if looks_like_department(c6) else ""
    ip_status = c7 if looks_like_ip(c7) else ""
    purpose = c8 if looks_like_purpose(c8) else ""

    if not complaint or complaint_score(complaint) <= 0:
        if not looks_like_department(c6) and not looks_like_ip(c6) and not looks_like_purpose(c6):
            complaint = c6
        elif not looks_like_ip(c7) and not looks_like_purpose(c7):
            complaint = c7
        else:
            complaint = c8

    return department, ip_status, purpose, complaint, c9


def standardize_row(sheet_name, row, source_row_number=""):
    visit_date = excel_date(get(row, 1))
    if not visit_date:
        return None
    visit_date, date_adjusted, original_visit_date = adjusted_non_future_date(visit_date)

    if sheet_name == "Completed_2023" or sheet_name == "Completed_2024":
        # Verified workbook layout: DATE, AGE, SEX, DEPARTMENT,
        # COMPLAINT/S, MANAGEMENT. It contains no name, address, or signature.
        age, sex = get(row, 2), get(row, 3)
        department, ip_status, purpose = get(row, 4), "", ""
        complaint_raw, management_raw, qty = get(row, 5), get(row, 6), ""
    elif sheet_name == "Completed_2025":
        # DATE, TIME, AGE, SEX, IP/NON-IP, PURPOSE, COMPLAINT,
        # MEDICAL/SUPPLY/MEDICINE, QTY.
        age, sex = get(row, 3), get(row, 4)
        department, ip_status, purpose = "", get(row, 5), get(row, 6)
        complaint_raw, management_raw, qty = get(row, 7), get(row, 8), get(row, 9)
    elif sheet_name == "Completed_2026":
        # DATE, TIME, AGE, SEX, IP/NON-IP, PURPOSE, COMPLAINT/S, MANAGEMENT.
        age, sex = get(row, 3), get(row, 4)
        department, ip_status, purpose = "", get(row, 5), get(row, 6)
        complaint_raw, management_raw, qty = get(row, 7), get(row, 8), ""
    elif sheet_name == "2023":
        age, sex = get(row, 2), get(row, 3)
        department, ip_status, purpose = get(row, 4), "", ""
        complaint_raw, management_raw, qty = get(row, 5), get(row, 7), ""
    elif sheet_name == "2024":
        # 2024 uses: DATE, AGE, SEX, DEPARTMENT, COMPLAINT/S, ADDRESS,
        # MANAGEMENT, SIGNATURE. The address is deliberately not exported.
        age, sex = get(row, 2), get(row, 3)
        department, ip_status, purpose = get(row, 4), "", ""
        complaint_raw, management_raw, qty = get(row, 5), get(row, 7), ""
    elif sheet_name == "2025":
        age, sex = get(row, 4), get(row, 5)
        department, ip_status, purpose = "", get(row, 6), get(row, 7)
        complaint_raw, management_raw, qty = get(row, 8), get(row, 9), get(row, 10)
        if complaint_score(complaint_raw) == 0 and complaint_score(purpose) > 0:
            complaint_raw, purpose = purpose, complaint_raw
    elif sheet_name == "2026":
        age, sex = get(row, 4), get(row, 5)
        department, ip_status, purpose, complaint_raw, management_raw = pick_2026_fields(row)
        qty = ""
    else:
        return None

    if looks_like_address(department):
        department = ""
    if looks_like_address(purpose):
        purpose = ""
    if looks_like_address(complaint_raw):
        complaint_raw = "[redacted non-complaint text]"
        category = "Unknown"
    else:
        category = categorize_complaint(complaint_raw)
    year, month = visit_date[:4], visit_date[5:7]

    return {
        "source_sheet": sheet_name,
        "source_row": source_row_number,
        "visit_date": visit_date,
        "date_adjusted": date_adjusted,
        "original_visit_date": original_visit_date,
        "year": year,
        "month": month,
        "month_key": f"{year}-{month}",
        "age": age,
        "sex": sex.upper() if sex.upper() in {"M", "F"} else sex,
        "department": department,
        "ip_status": ip_status,
        "purpose": purpose,
        "complaint_raw": complaint_raw,
        "complaint_category": category,
        "management_raw": management_raw,
        "qty": qty,
    }


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source file not found: {SOURCE}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    clean_rows = []
    future_trace_rows = []
    sheet_counts = Counter()
    skipped_no_date = Counter()

    with zipfile.ZipFile(SOURCE) as zf:
        shared_strings = load_shared_strings(zf)
        for sheet_name, sheet_path in workbook_sheets(zf):
            if sheet_name not in {
                "2023", "2024", "2025", "2026",
                "Completed_2023", "Completed_2024", "Completed_2025", "Completed_2026",
            }:
                continue
            rows = read_sheet_rows(zf, sheet_path, shared_strings)
            last_date = ""
            for source_row_number, raw_row in enumerate(rows[1:], start=2):
                current_date = get(raw_row, 1)
                carried_date_used = "no"
                if not current_date and not has_non_date_data(raw_row):
                    continue
                if excel_date(current_date):
                    last_date = current_date
                elif last_date:
                    if len(raw_row) == 0:
                        raw_row = [last_date]
                    else:
                        raw_row[0] = last_date
                    carried_date_used = "yes"
                row = standardize_row(sheet_name, raw_row, source_row_number)
                if row is None:
                    skipped_no_date[sheet_name] += 1
                    continue
                clean_rows.append(row)
                sheet_counts[sheet_name] += 1
                if row["date_adjusted"] == "yes":
                    future_trace_rows.append({
                        "source_sheet": sheet_name,
                        "source_row": source_row_number,
                        "raw_date_cell": current_date,
                        "carried_date_used": carried_date_used,
                        "original_visit_date": row["original_visit_date"],
                        "converted_visit_date": row["visit_date"],
                        "raw_col_3_time_or_field": get(raw_row, 3),
                        "raw_col_4_age_or_field": get(raw_row, 4),
                        "raw_col_5_sex_or_field": get(raw_row, 5),
                        "raw_col_6_department_or_field": get(raw_row, 6),
                        "raw_col_7_complaint_or_field": get(raw_row, 7),
                        "raw_col_9_management_or_field": get(raw_row, 9),
                        "clean_complaint_raw": row["complaint_raw"],
                        "clean_complaint_category": row["complaint_category"],
                    })

    fieldnames = [
        "source_sheet", "source_row", "visit_date", "year", "month", "month_key",
        "date_adjusted", "original_visit_date", "age", "sex", "department",
        "ip_status", "purpose", "complaint_raw", "complaint_category",
        "management_raw", "qty",
    ]
    with CLEAN_LOGS.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(clean_rows)

    monthly = Counter()
    for row in clean_rows:
        if row["complaint_category"] in HEALTH_CATEGORIES:
            monthly[(row["month_key"], row["complaint_category"])] += 1

    with MONTHLY_TRENDS.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["month_key", "complaint_category", "case_count"])
        writer.writeheader()
        for (month_key, category), count in sorted(monthly.items()):
            writer.writerow({
                "month_key": month_key,
                "complaint_category": category,
                "case_count": count,
            })

    raw_mapping = defaultdict(Counter)
    for row in clean_rows:
        raw_mapping[row["complaint_raw"]][row["complaint_category"]] += 1
    with MAPPING_USED.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["complaint_raw", "complaint_category", "count"])
        writer.writeheader()
        for raw, cats in sorted(raw_mapping.items(), key=lambda item: (-sum(item[1].values()), item[0].upper())):
            for category, count in cats.most_common():
                writer.writerow({
                    "complaint_raw": raw,
                    "complaint_category": category,
                    "count": count,
                })

    with FUTURE_DATE_TRACE.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "source_sheet", "source_row", "raw_date_cell", "carried_date_used",
            "original_visit_date", "converted_visit_date", "raw_col_3_time_or_field",
            "raw_col_4_age_or_field", "raw_col_5_sex_or_field", "raw_col_6_department_or_field",
            "raw_col_7_complaint_or_field", "raw_col_9_management_or_field",
            "clean_complaint_raw", "clean_complaint_category",
        ])
        writer.writeheader()
        writer.writerows(future_trace_rows)

    category_counts = Counter(row["complaint_category"] for row in clean_rows)
    with SUMMARY.open("w", encoding="utf-8") as f:
        f.write("Clinic logbook cleaning summary\n")
        f.write("================================\n\n")
        f.write(f"Source: {SOURCE}\n")
        f.write(f"Clean rows exported: {len(clean_rows)}\n\n")
        f.write("Rows used by sheet:\n")
        for sheet, count in sorted(sheet_counts.items()):
            f.write(f"- {sheet}: {count}\n")
        f.write("\nRows skipped because date was missing/unreadable:\n")
        for sheet, count in sorted(skipped_no_date.items()):
            f.write(f"- {sheet}: {count}\n")
        f.write("\nTop complaint categories:\n")
        for category, count in category_counts.most_common():
            f.write(f"- {category}: {count}\n")
        f.write("\nGenerated files:\n")
        f.write(f"- {CLEAN_LOGS}\n")
        f.write(f"- {MONTHLY_TRENDS}\n")
        f.write(f"- {MAPPING_USED}\n")
        f.write(f"- {FUTURE_DATE_TRACE}\n")

    print(f"Clean rows exported: {len(clean_rows)}")
    print(f"Wrote: {CLEAN_LOGS}")
    print(f"Wrote: {MONTHLY_TRENDS}")
    print(f"Wrote: {MAPPING_USED}")
    print(f"Wrote: {FUTURE_DATE_TRACE}")
    print(f"Wrote: {SUMMARY}")


if __name__ == "__main__":
    main()
