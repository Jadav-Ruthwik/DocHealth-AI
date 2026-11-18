
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

import pymupdf

from app.database import engine, get_db, Base
from app.models import MedicalReport

from app.services.medical_extractor import extract_medical_results
from app.services.medical_validator import validate_medical_document
from app.services.pdf_generator import generate_medical_report_pdf
from app.services.ocr_service import extract_text_with_ocr


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="DocHealth AI",
    description="AI-Powered Healthcare Report Analysis",
    version="1.2.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HOME AND HEALTH CHECK
# ============================================================

@app.get("/")
def home():
    return {
        "project": "DocHealth AI",
        "message": "Backend running successfully",
        "version": "1.2.0",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "project": "DocHealth AI",
    }


# ============================================================
# UPLOAD AND PROCESS MEDICAL REPORT
# ============================================================

@app.post("/api/reports/upload")
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # 1. Validate file extension
    if (
        not file.filename
        or not file.filename.lower().endswith(".pdf")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    # 2. Read uploaded file
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # 3. Validate file size
    MAX_FILE_SIZE = 10 * 1024 * 1024

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 10 MB.",
        )

    # 4. Validate PDF structure and count pages
    try:
        with pymupdf.open(
            stream=content,
            filetype="pdf",
        ) as document:

            if document.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Password-protected PDFs "
                        "are not supported."
                    ),
                )

            total_pages = len(document)

            if total_pages == 0:
                raise HTTPException(
                    status_code=400,
                    detail="The PDF contains no pages.",
                )

    except HTTPException:
        raise

    except Exception as error:
        print("PDF validation error:", repr(error))

        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to read this PDF. "
                "Please check the file."
            ),
        )

    # 5. Extract text with automatic OCR fallback
    try:
        extracted_text, ocr_used = extract_text_with_ocr(
            content
        )

    except Exception as error:
        print("Text extraction error:", repr(error))

        raise HTTPException(
            status_code=422,
            detail=(
                "Unable to extract text from this PDF. "
                "Please check the document."
            ),
        )

    # 6. Extract medical test results
    try:
        medical_results = extract_medical_results(
            extracted_text
        )

    except Exception as error:
        print("Medical extraction error:", repr(error))

        raise HTTPException(
            status_code=422,
            detail=(
                "Unable to extract supported medical "
                "test results."
            ),
        )

    # 7. Validate medical document
    validation = validate_medical_document(
        extracted_text,
        medical_results,
    )

    if not validation["valid"]:
        raise HTTPException(
            status_code=422,
            detail=validation["message"],
        )

    # 8. Save validated report to SQLite
    try:
        report = MedicalReport(
            filename=file.filename,
            total_pages=total_pages,
            total_tests_extracted=len(medical_results),
            extracted_text=extracted_text,
            medical_results=medical_results,
        )

        db.add(report)
        db.commit()
        db.refresh(report)

    except Exception as error:
        db.rollback()

        print("Database save error:", repr(error))

        raise HTTPException(
            status_code=500,
            detail=(
                "Report was processed but "
                "could not be saved."
            ),
        )

    # 9. Return successful response
    return {
        "id": report.id,
        "filename": report.filename,
        "total_pages": report.total_pages,
        "total_tests_extracted": (
            report.total_tests_extracted
        ),
        "medical_results": report.medical_results,
        "created_at": report.created_at.isoformat(),
        "ocr_used": ocr_used,
        "validation": {
            "valid": True,
            "message": validation["message"],
        },
        "message": (
            "Medical report processed and saved successfully."
        ),
    }


# ============================================================
# GET ALL SAVED REPORTS
# ============================================================

@app.get("/api/reports")
def get_reports(
    db: Session = Depends(get_db),
):

    reports = (
        db.query(MedicalReport)
        .order_by(MedicalReport.created_at.desc())
        .all()
    )

    return [
        {
            "id": report.id,
            "filename": report.filename,
            "total_pages": report.total_pages,
            "total_tests_extracted": (
                report.total_tests_extracted
            ),
            "created_at": report.created_at.isoformat(),
        }
        for report in reports
    ]


# ============================================================
# GET SINGLE REPORT
# ============================================================

@app.get("/api/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
):

    report = (
        db.query(MedicalReport)
        .filter(MedicalReport.id == report_id)
        .first()
    )

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Medical report not found.",
        )

    return {
        "id": report.id,
        "filename": report.filename,
        "total_pages": report.total_pages,
        "total_tests_extracted": (
            report.total_tests_extracted
        ),
        "extracted_text": report.extracted_text,
        "medical_results": report.medical_results,
        "created_at": report.created_at.isoformat(),
    }


# ============================================================
# DELETE MEDICAL REPORT
# ============================================================

@app.delete("/api/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
):

    report = (
        db.query(MedicalReport)
        .filter(MedicalReport.id == report_id)
        .first()
    )

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Medical report not found.",
        )

    try:
        db.delete(report)
        db.commit()

    except Exception as error:
        db.rollback()

        print("Delete report error:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to delete medical report.",
        )

    return {
        "success": True,
        "message": "Medical report deleted successfully.",
        "report_id": report_id,
    }


# ============================================================
# DOWNLOAD MEDICAL REPORT AS PDF
# ============================================================

@app.get("/api/reports/{report_id}/download")
def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
):

    report = (
        db.query(MedicalReport)
        .filter(MedicalReport.id == report_id)
        .first()
    )

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Medical report not found.",
        )

    try:
        pdf_buffer = generate_medical_report_pdf(
            report
        )

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="'
                    f'DocHealthAI_Report_{report_id}.pdf"'
                )
            },
        )

    except Exception as error:
        print("PDF generation error:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to generate report PDF.",
        )
