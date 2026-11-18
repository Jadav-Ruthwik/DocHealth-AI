
import os
import shutil
from io import BytesIO

import pymupdf
import pytesseract
from PIL import Image


# Detect Tesseract on Windows or Linux.
TESSERACT_PATH = (
    os.getenv("TESSERACT_CMD")
    or shutil.which("tesseract")
)

if not TESSERACT_PATH and os.name == "nt":
    windows_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    if os.path.exists(windows_path):
        TESSERACT_PATH = windows_path

if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text_with_ocr(pdf_content):
    """
    Extract text from PDF.
    Use Tesseract OCR for pages with very little text.
    Returns extracted text and whether OCR was used.
    """

    if not TESSERACT_PATH:
        raise RuntimeError(
            "Tesseract executable not found. "
            "Check the Docker installation."
        )

    extracted_pages = []
    ocr_used = False

    try:
        with pymupdf.open(
            stream=pdf_content,
            filetype="pdf"
        ) as document:

            for page_number, page in enumerate(document):

                page_text = page.get_text("text").strip()

                if len(page_text) < 30:

                    print(
                        f"Running OCR on page {page_number + 1}"
                    )

                    pixmap = page.get_pixmap(
                        dpi=300,
                        colorspace=pymupdf.csRGB,
                        alpha=False
                    )

                    image_bytes = pixmap.tobytes("png")
                    image = Image.open(BytesIO(image_bytes))

                    page_text = pytesseract.image_to_string(
                        image,
                        lang="eng",
                        config="--psm 6"
                    ).strip()

                    ocr_used = True

                extracted_pages.append(page_text)

    except Exception as error:
        print("OCR extraction error:", repr(error))
        raise RuntimeError(
            "Unable to extract text from this PDF."
        ) from error

    extracted_text = "\n\n".join(extracted_pages)

    return extracted_text, ocr_used
