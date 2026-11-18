import os
import shutil
import pytesseract

TESSERACT_PATH = (
    os.getenv("TESSERACT_CMD")
    or shutil.which("tesseract")
)

if not TESSERACT_PATH:
    raise RuntimeError("Tesseract OCR executable not found.")

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH