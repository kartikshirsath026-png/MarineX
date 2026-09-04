import csv
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.models import Scan, Detection, Verification

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)


@router.get("/scan/{scan_id}/csv")
def generate_csv_report(scan_id: int):

    db: Session = SessionLocal()

    try:
        # Find scan
        scan = db.query(Scan).filter(Scan.id == scan_id).first()

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        # Get detections
        detections = (
            db.query(Detection)
            .filter(Detection.scan_id == scan_id)
            .all()
        )

        # Create CSV in memory
        output = io.StringIO()

        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Scan ID",
            "Scan Name",
            "Latitude",
            "Longitude",
            "Depth",
            "Scan Timestamp",
            "Detection ID",
            "Object Class",
            "Confidence",
            "Priority",
            "X Min",
            "Y Min",
            "X Max",
            "Y Max"
        ])

        # Data
        for detection in detections:

            writer.writerow([
                scan.id,
                scan.scan_name,
                scan.latitude,
                scan.longitude,
                scan.depth,
                scan.scan_timestamp,
                detection.id,
                detection.object_class,
                detection.confidence,
                detection.priority,
                detection.x_min,
                detection.y_min,
                detection.x_max,
                detection.y_max
            ])

        # If no detections, still provide scan information
        if not detections:
            writer.writerow([
                scan.id,
                scan.scan_name,
                scan.latitude,
                scan.longitude,
                scan.depth,
                scan.scan_timestamp,
                "",
                "No detections",
                "",
                "",
                "",
                "",
                "",
                ""
            ])

        output.seek(0)

        filename = f"MarineX_Scan_{scan_id}_Report.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    finally:
        db.close()


@router.get("/scan/{scan_id}/pdf")
def generate_pdf_report(scan_id: int):

    db: Session = SessionLocal()

    try:
        # Find scan
        scan = db.query(Scan).filter(Scan.id == scan_id).first()

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        # Get detections
        detections = (
            db.query(Detection)
            .filter(Detection.scan_id == scan_id)
            .all()
        )

        # Get latest verification for each detection
        verification_map = {}

        for detection in detections:
            verification = (
                db.query(Verification)
                .filter(
                    Verification.detection_id == detection.id
                )
                .order_by(Verification.created_at.desc())
                .first()
            )

            if verification:
                verification_map[detection.id] = verification

        # PDF file in memory
        output = io.BytesIO()

        document = SimpleDocTemplate(
            output,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "MarineXTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=22,
            spaceAfter=10
        )

        heading_style = ParagraphStyle(
            "MarineXHeading",
            parent=styles["Heading2"],
            fontSize=14,
            spaceBefore=12,
            spaceAfter=8
        )

        story = []

        # Title
        story.append(
            Paragraph("MarineX", title_style)
        )

        story.append(
            Paragraph(
                "Underwater Sonar Intelligence Report",
                styles["Heading3"]
            )
        )

        story.append(Spacer(1, 15))

        # Scan information
        story.append(
            Paragraph("Scan Information", heading_style)
        )

        scan_data = [
            ["Scan ID", str(scan.id)],
            ["Scan Name", scan.scan_name],
            ["Latitude", str(scan.latitude) if scan.latitude is not None else "N/A"],
            ["Longitude", str(scan.longitude) if scan.longitude is not None else "N/A"],
            ["Depth", f"{scan.depth} m" if scan.depth is not None else "N/A"],
            ["Scan Timestamp", str(scan.scan_timestamp) if scan.scan_timestamp else "N/A"],
            ["Status", scan.status]
        ]

        scan_table = Table(
            scan_data,
            colWidths=[130, 350]
        )

        scan_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6)
            ])
        )

        story.append(scan_table)

        story.append(Spacer(1, 20))

        # Detection section
        story.append(
            Paragraph("AI Detection Results", heading_style)
        )

        if detections:

            detection_data = [
                [
                    "ID",
                    "Class",
                    "Confidence",
                    "Priority",
                    "Verification"
                ]
            ]

            for detection in detections:

                verification = verification_map.get(
                    detection.id
                )

                verification_status = (
                    verification.status
                    if verification
                    else "Not verified"
                )

                detection_data.append([
                    str(detection.id),
                    detection.object_class,
                    f"{detection.confidence * 100:.1f}%",
                    detection.priority,
                    verification_status
                ])

            detection_table = Table(
                detection_data,
                colWidths=[35, 130, 90, 80, 100]
            )

            detection_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.darkgrey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("PADDING", (0, 0), (-1, -1), 6)
                ])
            )

            story.append(detection_table)

        else:

            story.append(
                Paragraph(
                    "No AI detections found for this scan.",
                    styles["BodyText"]
                )
            )

        story.append(Spacer(1, 20))

        # Remarks
        story.append(
            Paragraph("Verification Remarks", heading_style)
        )

        remarks_found = False

        for detection in detections:

            verification = verification_map.get(
                detection.id
            )

            if verification and verification.remarks:

                remarks_found = True

                story.append(
                    Paragraph(
                        f"<b>Detection #{detection.id}</b>: "
                        f"{verification.remarks}",
                        styles["BodyText"]
                    )
                )

                story.append(Spacer(1, 6))

        if not remarks_found:

            story.append(
                Paragraph(
                    "No verification remarks available.",
                    styles["BodyText"]
                )
            )

        story.append(Spacer(1, 25))

        story.append(
            Paragraph(
                "Generated by MarineX AI-Powered Underwater "
                "Marine Debris and Anomaly Detection System",
                styles["BodyText"]
            )
        )

        # Build PDF
        document.build(story)

        output.seek(0)

        filename = f"MarineX_Scan_{scan_id}_Report.pdf"

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    f"attachment; filename={filename}"
            }
        )

    finally:
        db.close()