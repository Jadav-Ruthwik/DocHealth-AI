
import re


# Medical terms commonly found in laboratory reports
MEDICAL_KEYWORDS = [
    "laboratory",
    "lab report",
    "medical report",
    "pathology",
    "diagnostic",
    "specimen",
    "blood test",
    "urine test",
    "reference range",
    "reference interval",
    "test results",
    "patient name",
    "hemoglobin",
    "haemoglobin",
    "glucose",
    "cholesterol",
    "platelet",
    "wbc",
    "rbc",
    "hematocrit",
    "haematocrit",
    "thyroid",
    "tsh",
    "creatinine",
    "triglycerides",
    "hba1c",
]


def validate_medical_document(extracted_text, medical_results):
    """
    Performs basic medical-document validation.

    This is a rule-based screening check, not a clinical
    document classifier.
    """

    text = (extracted_text or "").lower()
    results = medical_results or []

    # Check 1: PDF must contain extractable text
    if not text.strip():
        return {
            "valid": False,
            "message": (
                "No readable text found. "
                "This PDF may be scanned or image-based. "
                "OCR support is required."
            ),
            "tests_found": 0,
        }

    # Check 2: Look for medical-related keywords
    matched_keywords = [
        keyword
        for keyword in MEDICAL_KEYWORDS
        if re.search(
            r"(?<![a-z0-9])" + re.escape(keyword) +
            r"(?![a-z0-9])",
            text
        )
    ]

    if not matched_keywords:
        return {
            "valid": False,
            "message": (
                "This document does not contain recognizable "
                "medical-report indicators. Please upload a "
                "medical or laboratory report."
            ),
            "tests_found": len(results),
        }

    # Check 3: At least one test must be extracted
    if len(results) == 0:
        return {
            "valid": False,
            "message": (
                "Medical-related content was detected, but no "
                "supported laboratory test results could be "
                "extracted. Please check the PDF format."
            ),
            "tests_found": 0,
        }

    return {
        "valid": True,
        "message": (
            "Medical document indicators detected and "
            "supported test results extracted."
        ),
        "tests_found": len(results),
    }
