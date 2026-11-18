
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def generate_medical_report_pdf(report):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#2563EB"),
        alignment=TA_CENTER,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#64748B"),
        alignment=TA_CENTER,
        spaceAfter=20,
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=14,
        spaceAfter=10,
    )

    normal_style = styles["Normal"]

    story = []

    # Header
    story.append(
        Paragraph("DocHealth AI", title_style)
    )

    story.append(
        Paragraph(
            "Medical Report Analysis",
            subtitle_style,
        )
    )

    # Report information
    report_info = [
        ["Report ID", str(report.id)],
        ["Original File", escape(report.filename)],
        ["Pages", str(report.total_pages)],
        [
            "Tests Extracted",
            str(report.total_tests_extracted),
        ],
        [
            "Uploaded On",
            str(report.created_at),
        ],
    ]

    info_table = Table(
        report_info,
        colWidths=[45 * mm, 120 * mm],
    )

    info_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1),
             colors.HexColor("#EFF6FF")),
            ("TEXTCOLOR", (0, 0), (0, -1),
             colors.HexColor("#1D4ED8")),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.4,
             colors.HexColor("#DBEAFE")),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )

    story.append(info_table)
    story.append(Spacer(1, 18))

    story.append(
        Paragraph("Extracted Medical Test Results", heading_style)
    )

    # Table headings
    table_data = [[
        "Test",
        "Value",
        "Unit",
        "Reference Range",
        "Status",
    ]]

    results = report.medical_results or []

    for item in results:
        test_name = escape(str(item.get("test_name", "Unknown")))
        value = escape(str(item.get("value", "N/A")))
        unit = escape(str(item.get("unit") or "-"))

        minimum = item.get("reference_min")
        maximum = item.get("reference_max")

        if minimum is not None and maximum is not None:
            reference = f"{minimum} - {maximum}"
        elif maximum is not None:
            reference = f"Below {maximum}"
        elif minimum is not None:
            reference = f"Above {minimum}"
        else:
            reference = "Not specified"

        reference = escape(reference)

        status = escape(str(item.get("status", "Not available")))

        table_data.append([
            Paragraph(test_name, normal_style),
            value,
            unit,
            reference,
            Paragraph(status, normal_style),
        ])

    results_table = Table(
        table_data,
        colWidths=[
            39 * mm,
            22 * mm,
            23 * mm,
            37 * mm,
            44 * mm,
        ],
        repeatRows=1,
    )

    results_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0),
             colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.4,
             colors.HexColor("#E2E8F0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                colors.white,
                colors.HexColor("#F8FAFC"),
            ]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(results_table)
    story.append(Spacer(1, 20))

    # Safety disclaimer
    story.append(
        Paragraph("Important Medical Disclaimer", heading_style)
    )

    disclaimer = (
        "This document presents information extracted from an uploaded "
        "medical report. Reference-range comparisons are based only on "
        "the limits stated in the source report when available. "
        "This document is not a medical diagnosis and does not replace "
        "professional medical advice. Consult a qualified healthcare "
        "professional for interpretation of your results."
    )

    story.append(
        Paragraph(
            disclaimer,
            ParagraphStyle(
                "Disclaimer",
                parent=normal_style,
                fontSize=8,
                leading=12,
                textColor=colors.HexColor("#475569"),
            ),
        )
    )

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            "Generated by DocHealth AI",
            subtitle_style,
        )
    )

    document.build(story)

    buffer.seek(0)

    return buffer
