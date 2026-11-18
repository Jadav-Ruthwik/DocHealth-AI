
import shutil

import pymupdf
import pytesseract

from PIL import Image
from io import BytesIO


# Configure Tesseract for Windows
TESSERACT_PATH = shutil.which("tesseract")

if not TESSERACT_PATH:
    TESSERACT_PATH = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text_with_ocr(pdf_content):
    """
    Extract text from a PDF.

    Uses normal PDF text extraction when available.
    Uses Tesseract OCR for pages with little or no text.

    Returns:
        extracted_text: Combined text from all pages.
        ocr_used: Whether OCR was used on any page.
    """

    extracted_pages = []
    ocr_used = False

    try:
        with pymupdf.open(
            stream=pdf_content,
            filetype="pdf"
        ) as document:

            for page_number, page in enumerate(document):

                # First attempt normal text extraction
                page_text = page.get_text("text").strip()

                # If the page has very little text, use OCR
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

                    image = Image.open(
                        BytesIO(image_bytes)
                    )

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
