
import re

TEST_PATTERNS = [
    {
        "name": "Hemoglobin",
        "pattern": r"Hemoglobin\s+([\d.]+)\s+(g/dL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "White Blood Cell Count",
        "pattern": r"White Blood Cell Count\s*\(WBC\)\s+([\d.]+)\s+(10\^3/µL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "Platelet Count",
        "pattern": r"Platelet Count\s+([\d.]+)\s+(10\^3/µL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "Hematocrit",
        "pattern": r"Hematocrit\s+([\d.]+)\s+(%)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "Fasting Glucose",
        "pattern": r"Fasting Glucose\s+([\d.]+)\s+(mg/dL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "Total Cholesterol",
        "pattern": r"Total Cholesterol\s+([\d.]+)\s+(mg/dL)\s+Below\s+([\d.]+)"
    },
    {
        "name": "HDL Cholesterol",
        "pattern": r"HDL Cholesterol\s+([\d.]+)\s+(mg/dL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "LDL Cholesterol",
        "pattern": r"LDL Cholesterol\s+([\d.]+)\s+(mg/dL)\s+Below\s+([\d.]+)"
    },
    {
        "name": "Triglycerides",
        "pattern": r"Triglycerides\s+([\d.]+)\s+(mg/dL)\s+Below\s+([\d.]+)"
    },
    {
        "name": "TSH",
        "pattern": r"TSH\s+([\d.]+)\s+(µIU/mL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
    {
        "name": "Free T4",
        "pattern": r"Free T4\s+([\d.]+)\s+(ng/dL)\s+([\d.]+)\s*[–-]\s*([\d.]+)"
    },
]


def extract_medical_results(text: str):

    results = []

    for test in TEST_PATTERNS:

        match = re.search(
            test["pattern"],
            text,
            re.IGNORECASE
        )

        if not match:
            continue

        groups = match.groups()

        value = float(groups[0])
        unit = groups[1]

        if len(groups) == 4:
            lower = float(groups[2])
            upper = float(groups[3])

            if value < lower:
                status = "Below reference range"
            elif value > upper:
                status = "Above reference range"
            else:
                status = "Within reference range"

        else:
            lower = None
            upper = float(groups[2])

            if value > upper:
                status = "Above reference range"
            else:
                status = "Within stated limit"

        results.append({
            "test_name": test["name"],
            "value": value,
            "unit": unit,
            "reference_min": lower,
            "reference_max": upper,
            "status": status
        })

    return results
