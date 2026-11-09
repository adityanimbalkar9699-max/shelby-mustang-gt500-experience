"""
Generates publication-grade PDF specification document for Shelby Mustang GT500.
Built with ReportLab.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch

pdf_path = os.path.join(os.path.dirname(__file__), "SHELBY_MUSTANG_SPECIFICATION.pdf")

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=0.75 * inch,
    rightMargin=0.75 * inch,
    topMargin=0.75 * inch,
    bottomMargin=0.75 * inch
)

styles = getSampleStyleSheet()

# Custom Luxury Styles
primary_color = colors.HexColor("#0B0F19")
shelby_blue = colors.HexColor("#0052CC")
venom_red = colors.HexColor("#DC2626")
slate_gray = colors.HexColor("#475569")
light_bg = colors.HexColor("#F8FAFC")

title_style = ParagraphStyle(
    'TitleStyle',
    fontName='Helvetica-Bold',
    fontSize=24,
    leading=28,
    textColor=primary_color,
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=14,
    textColor=shelby_blue,
    spaceAfter=12
)

heading_style = ParagraphStyle(
    'HeadingStyle',
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=primary_color,
    spaceBefore=12,
    spaceAfter=6
)

body_style = ParagraphStyle(
    'BodyStyle',
    fontName='Helvetica',
    fontSize=9.5,
    leading=14,
    textColor=slate_gray,
    spaceAfter=8
)

callout_style = ParagraphStyle(
    'CalloutStyle',
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=13,
    textColor=primary_color,
    spaceBefore=4,
    spaceAfter=4
)

story = []

# Header
story.append(Paragraph("SHELBY AMERICAN INC. & FORD PERFORMANCE", subtitle_style))
story.append(Paragraph("SHELBY MUSTANG GT500 PREDATOR", title_style))
story.append(Paragraph("Official Engineering Specification & Motion Graphics Telemetry Blueprint", callout_style))
story.append(HRFlowable(width="100%", thickness=2, color=shelby_blue, spaceBefore=4, spaceAfter=14))

# Executive Summary
story.append(Paragraph("1. EXECUTIVE OVERVIEW & HERITAGE", heading_style))
story.append(Paragraph(
    "The Shelby Mustang GT500 represents the pinnacle of American muscle engineering. "
    "Conceived from the enduring vision of Carroll Shelby, the 2020+ GT500 marries a 760-horsepower "
    "hand-built 5.2L supercharged cross-plane V8 with race-derived aerodynamics and adaptive MagneRide suspension. "
    "This landing page application delivers a luxury interactive digital showcase driven by three bespoke visual motion graphics.",
    body_style
))

quote_table = Table(
    [[Paragraph('<i>"There is never enough horsepower... just not enough traction."</i> — <b>Carroll Shelby</b>', callout_style)]],
    colWidths=[6.8 * inch]
)
quote_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), light_bg),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
]))
story.append(quote_table)
story.append(Spacer(1, 10))

# Three Visual Motion Graphics Architectures
story.append(Paragraph("2. THE THREE VISUAL MOTION GRAPHICS ARCHITECTURES", heading_style))

story.append(Paragraph(
    "<b>Motion Graphic 01: Supersonic Wind Tunnel Particle Field</b><br/>"
    "An interactive high-speed aerodynamic simulator computing 1,400+ dynamic streamline vectors across the GT500 silhouette. "
    "Models stagnation pressure at the front carbon splitter, upwash over the functional hood heat extractors, and vortex shedding "
    "behind the adjustable GT4 high-downforce rear wing. Incorporates real-time cursor vortex disturbance and variable speed regimes (65 to 186 MPH).",
    body_style
))

story.append(Paragraph(
    "<b>Motion Graphic 02: 5.2L Supercharged Predator V8 Dyno & Web Audio Synthesizer</b><br/>"
    "An interactive mechanical dynamometer featuring a spring-damped racing tachometer (0-9,000 RPM) and Eaton TVS R2650 2.65L roots supercharger "
    "boost gauge. Implements a real-time cylinder firing visualizer matching the exact cross-plane firing order (1-5-4-8-6-3-7-2). "
    "Coupled to a zero-dependency Web Audio API procedural sound engine synthesizing authentic V8 rumble, supercharger whine, and overrun crackles.",
    body_style
))

story.append(Paragraph(
    "<b>Motion Graphic 03: MagneRide 1,000Hz Suspension & G-Force Telemetry HUD</b><br/>"
    "An active chassis dynamics visualizer tracking 1,000Hz magnetorheological damping recalculations. "
    "Features an interactive friction circle (G-G diagram) tracking lateral acceleration forces up to 1.4G across iconic circuits "
    "(Laguna Seca Corkscrew, Nürburgring Karussell, Road America) alongside independent 4-corner damper stroke bars and thermal rotor mapping.",
    body_style
))

# Technical Specifications Table
story.append(Paragraph("3. CERTIFIED TECHNICAL SPECIFICATIONS", heading_style))

specs_data = [
    [Paragraph("<b>PARAMETER</b>", body_style), Paragraph("<b>SPECIFICATION</b>", body_style), Paragraph("<b>ENGINEERING DETAIL</b>", body_style)],
    [Paragraph("Engine Architecture", body_style), Paragraph("5.2L Supercharged V8", body_style), Paragraph("Code Name: 'Predator' (Hand-Built in Romeo, MI)", body_style)],
    [Paragraph("Peak Power Output", body_style), Paragraph("760 BHP @ 7,300 RPM", body_style), Paragraph("Redline: 7,500 RPM | Fuel Cut: 8,250 RPM", body_style)],
    [Paragraph("Peak Torque", body_style), Paragraph("625 LB-FT @ 5,000 RPM", body_style), Paragraph("Flat torque plateau from 3,000 - 6,500 RPM", body_style)],
    [Paragraph("Supercharger", body_style), Paragraph("Eaton TVS R2650", body_style), Paragraph("2.65L Inverted Roots Blower generating 12.2 PSI", body_style)],
    [Paragraph("Transmission", body_style), Paragraph("Tremec 7-Speed Dual-Clutch", body_style), Paragraph("TR-9070 DCT capable of 80ms shifts", body_style)],
    [Paragraph("Braking System", body_style), Paragraph("Brembo 6-Piston / 420mm", body_style), Paragraph("Largest front rotors fitted to any domestic sports coupe", body_style)],
    [Paragraph("Lateral Acceleration", body_style), Paragraph("1.35G+ Sustained", body_style), Paragraph("Michelin Pilot Sport Cup 2 Track Tyres", body_style)],
    [Paragraph("Downforce (Track Pack)", body_style), Paragraph("550 LBS @ 180 MPH", body_style), Paragraph("Full Carbon GT4 Wing with adjustable wickerbill", body_style)]
]

specs_table = Table(specs_data, colWidths=[2.0 * inch, 2.2 * inch, 2.6 * inch])
specs_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0B0F19")),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(specs_table)
story.append(Spacer(1, 10))

# Studio Bespoke Configurator & CSM Registry
story.append(Paragraph("4. BESPOKE STUDIO & CARROLL SHELBY REGISTRY", heading_style))
story.append(Paragraph(
    "The application incorporates a bespoke 360° Studio Configurator enabling real-time live preview of exterior liveries "
    "(Shadow Obsidian Black, Cobalt Le Mans Blue, Rapid Red Metallic, Grabber Orange, and Raw Matte Carbon), dual Le Mans racing stripes, "
    "and Carbon Fiber Track Pack aero components. The integrated Carroll Shelby CSM Registry generates serialized engraved chassis plaques "
    "permanently linking owner identity to Shelby World Registry documentation.",
    body_style
))

# Build and save
doc.build(story)
print(f"Generated publication PDF: {pdf_path}")
