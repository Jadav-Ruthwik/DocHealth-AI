
import os
import shutil
import time
from io import BytesIO

import pymupdf
import pytesseract
from PIL import Image, ImageOps


# Detect Tesseract on Windows or Linux
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
    Extract text from PDFs.
    Use optimized OCR for scanned pages.
    Returns extracted text and whether OCR was used.
    """

    if not TESSERACT_PATH:
        raise RuntimeError("Tesseract executable not found.")

    start_time = time.time()

    extracted_pages = []
    ocr_used = False

    try:
        with pymupdf.open(
            stream=pdf_content,
            filetype="pdf"
        ) as document:

            for page_number, page in enumerate(document):

                # First try normal PDF text extraction
                page_text = page.get_text("text").strip()

                # Run OCR only when the page has insufficient text
                if len(page_text) < 30:

                    print(f"OCR started: page {page_number + 1}")

                    # Lower resolution and grayscale reduce processing cost
                    pixmap = page.get_pixmap(
                        dpi=200,
                        colorspace=pymupdf.csGRAY,
                        alpha=False
                    )

                    image_bytes = pixmap.tobytes("png")

                    with Image.open(BytesIO(image_bytes)) as source:
                        image = ImageOps.autocontrast(source)
                        image = image.convert("L")

                        page_text = pytesseract.image_to_string(
                            image,
                            lang="eng",
                            config="--oem 1 --psm 6"
                        ).strip()

                    ocr_used = True

                    print(
                        f"OCR completed: page {page_number + 1}"
                    )

                extracted_pages.append(page_text)

    except Exception as error:
        print("OCR extraction error:", repr(error))

        raise RuntimeError(
            "Unable to extract text from this PDF."
        ) from error

    extracted_text = "\n\n".join(extracted_pages)

    elapsed = time.time() - start_time

    print(f"PDF extraction completed in {elapsed:.2f} seconds")

    return extracted_text, ocr_used
