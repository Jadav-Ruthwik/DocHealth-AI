
import re

# Supports decimal and integer values
NUMBER = r"\d+(?:\.\d+)?"

# Flexible whitespace between OCR-extracted columns
SPACE = r"[ \t]+"

# Test names and their common report variations
TEST_PATTERNS = [
    {
        "name": "Hemoglobin",
        "aliases": [r"Hemoglobin", r"Hb"],
        "unit": r"g\s*/\s*dL",
    },
    {
        "name": "Total WBC Count",
        "aliases": [
            r"Total\s+WBC\s+Count",
            r"White\s+Blood\s+Cell\s+Count",
            r"WBC\s+Count",
            r"WBC",
        ],
        "unit": r"(?:10\s*\^?\s*3\s*/\s*(?:uL|µL|μL)|K\s*/\s*uL)",
    },
    {
        "name": "Platelet Count",
        "aliases": [r"Platelet\s+Count", r"Platelets", r"PLT"],
        "unit": r"(?:10\s*\^?\s*3\s*/\s*(?:uL|µL|μL)|K\s*/\s*uL)",
    },
    {
        "name": "RBC Count",
        "aliases": [r"RBC\s+Count", r"Red\s+Blood\s+Cell\s+Count", r"RBC"],
        "unit": r"(?:10\s*\^?\s*6\s*/\s*(?:uL|µL|μL)|M\s*/\s*uL)",
    },
    {
        "name": "Hematocrit",
        "aliases": [r"Hematocrit", r"HCT", r"PCV"],
        "unit": r"%",
    },
    {
        "name": "MCV",
        "aliases": [r"MCV", r"Mean\s+Corpuscular\s+Volume"],
        "unit": r"fL",
    },
    {
        "name": "MCH",
        "aliases": [r"MCH", r"Mean\s+Corpuscular\s+Hemoglobin"],
        "unit": r"pg",
    },
    {
        "name": "Fasting Glucose",
        "aliases": [r"Fasting\s+Glucose", r"Fasting\s+Blood\s+Sugar"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "Blood Urea",
        "aliases": [r"Blood\s+Urea", r"Urea"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "Serum Creatinine",
        "aliases": [r"Serum\s+Creatinine", r"Creatinine"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "Total Cholesterol",
        "aliases": [r"Total\s+Cholesterol"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "HDL Cholesterol",
        "aliases": [r"HDL\s+Cholesterol", r"HDL"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "LDL Cholesterol",
        "aliases": [r"LDL\s+Cholesterol", r"LDL"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "Triglycerides",
        "aliases": [r"Triglycerides", r"Triglyceride"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "Uric Acid",
        "aliases": [r"Uric\s+Acid"],
        "unit": r"mg\s*/\s*dL",
    },
    {
        "name": "TSH",
        "aliases": [r"TSH", r"Thyroid\s+Stimulating\s+Hormone"],
        "unit": r"(?:µIU\s*/\s*mL|μIU\s*/\s*mL|uIU\s*/\s*mL)",
    },
    {
        "name": "Free T4",
        "aliases": [r"Free\s*T4", r"FT4"],
        "unit": r"ng\s*/\s*dL",
    },
]


def normalize_text(text: str) -> str:
    """Normalize common OCR characters and spacing."""

    text = text.replace("\u00a0", " ")
    text = text.replace("−", "-")
    text = text.replace("–", "-")
    text = text.replace("—", "-")
    text = text.replace("μ", "µ")

    return text


def extract_medical_results(text: str):
    """
    Extract test values and reference ranges from report text.

    Supports:
    - Numeric reference ranges: 12.0 - 16.0
    - Upper limits: Below 200
    - Lower limits: Above 40

    Only values with a recognized reference range are returned.
    """

    if not text:
        return []

    text = normalize_text(text)

    # Process each OCR line separately to avoid joining
    # values from different test rows.
    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in text.splitlines()
        if line.strip()
    ]

    results = []
    extracted_names = set()

    for test in TEST_PATTERNS:

        aliases = "|".join(
            f"(?:{alias})" for alias in test["aliases"]
        )

        pattern = re.compile(
            rf"(?<![A-Za-z])(?:{aliases})(?![A-Za-z])"
            rf"{SPACE}"
            rf"(?P<value>{NUMBER})"
            rf"{SPACE}"
            rf"(?P<unit>{test['unit']})"
            rf"{SPACE}"
            rf"(?:(?P<low>{NUMBER})"
            rf"{SPACE}[-/]{SPACE}"
            rf"(?P<high>{NUMBER})"
            rf"|Below{SPACE}(?P<below>{NUMBER})"
            rf"|Above{SPACE}(?P<above>{NUMBER}))",
            re.IGNORECASE,
        )

        for line in lines:
            match = pattern.search(line)

            if not match:
                continue

            # Avoid duplicate extraction
            if test["name"] in extracted_names:
                break

            groups = match.groupdict()

            try:
                value = float(groups["value"])

                if groups["low"] is not None:
                    lower = float(groups["low"])
                    upper = float(groups["high"])

                    if value < lower:
                        status = "Below reference range"
                    elif value > upper:
                        status = "Above reference range"
                    else:
                        status = "Within reference range"

                elif groups["below"] is not None:
                    lower = None
                    upper = float(groups["below"])

                    if value > upper:
                        status = "Above reference range"
                    else:
                        status = "Within stated limit"

                elif groups["above"] is not None:
                    lower = float(groups["above"])
                    upper = None

                    if value < lower:
                        status = "Below reference range"
                    else:
                        status = "Within stated limit"

                else:
                    continue

                unit = re.sub(
                    r"\s+",
                    "",
                    groups["unit"]
                )

                results.append({
                    "test_name": test["name"],
                    "value": value,
                    "unit": unit,
                    "reference_min": lower,
                    "reference_max": upper,
                    "status": status,
                })

                extracted_names.add(test["name"])
                break

            except (ValueError, TypeError):
                continue

    return results
