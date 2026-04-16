"""
generate_test_docs.py
---------------------
Generates 5 realistic PDF test documents for the Claims Processing Agent.
Output is placed in the 'test_docs' directory.

Required dependency:
    pip install reportlab
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test_docs")


def generate_pdf(filename: str, title: str, content: list[str]) -> None:
    """Helper to generate a simple paragraph-style PDF document."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    doc = SimpleDocTemplate(file_path, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        spaceAfter=14
    )
    
    story = [Paragraph(title, title_style), Spacer(1, 20)]
    
    for paragraph in content:
        story.append(Paragraph(paragraph, body_style))
        
    doc.build(story)
    print(f"✅ Generated: {file_path}")


def main():
    print("Generating test PDFs...")
    
    # 1. Insurance Claim (Fast-track)
    generate_pdf(
        "insurance_claim.pdf",
        "Automobile Insurance Claim Report",
        [
            "Claim Number: CLM-2024-AUTO-1120",
            "Claimant Name: John A. Smith",
            "Policy Number: POL-7890123",
            "Incident Date: 2024-05-12",
            "Claim Type: vehicle",
            "Contact Phone: 555-123-4567",
            "Contact Email: john.smith@email.com",
            "Police Report Number: PR-1234",
            "Witness Info: Jane Doe (passenger)",
            "Estimated Damage: $18,500.00",
            "Supporting Docs: photos.zip, police_report.pdf",
            "Incident Description: On May 12th, 2024, I was stopped at a red light at the intersection of Main St. and 4th Ave. "
            "Another vehicle approached from behind and failed to brake in time, resulting in a rear-end collision. "
            "The impact pushed my vehicle forward slightly. There were no injuries to anyone involved. "
            "My vehicle suffered significant rear bumper, trunk, and tail light damage. The frame may also be bent."
        ]
    )

    # 2. Medical Claim (Standard Medical Processing)
    generate_pdf(
        "medical_claim.pdf",
        "Hospital Treatment Claim Form",
        [
            "Patient Name: Emily R. Johnson",
            "Diagnosis: Acute Appendicitis",
            "Hospital Name: General City Hospital",
            "Doctor Name: Dr. Sarah Jenkins",
            "Treatment Date: 2024-06-01",
            "Insurance ID: INS-554433",
            "Estimated Cost: $75,000.00",
            "Treatment Description: The patient presented through the Emergency Room with acute abdominal pain and nausea. "
            "After a CT scan confirmed acute appendicitis, an emergency laparoscopic appendectomy was performed under general anesthesia. "
            "The surgery was successful with no complications. The patient was monitored in the surgical ward for a 3-day inpatient stay "
            "and was subsequently discharged with instructions for rest and outpatient follow-up."
        ]
    )

    # 3. Police Report (Law Enforcement Liaison)
    generate_pdf(
        "police_report.pdf",
        "Official Police Incident Report",
        [
            "Report Number: PR-2024-8899",
            "Officer Name: Sgt. Michael Davis, Badge #443",
            "Incident Date: 2024-05-20",
            "Location: Intersection of 5th Ave and Main St",
            "Involved Parties: Alice Walker (Driver 1), Bob Tables (Driver 2)",
            "Case Status: Closed",
            "Incident Description: Unit 4 dispatched to a two-vehicle collision at the aforementioned intersection. "
            "Upon arrival, observed two vehicles with moderate front-end and side damage. Driver 1 (Walker) was traveling northbound "
            "and proceeded through a red light, striking Driver 2 (Tables) who was traveling westbound with the right of way. "
            "No injuries were reported at the scene by either party. Driver 1 was cited for failure to obey a traffic control device. "
            "Both vehicles were safely towed from the scene by City Towing."
        ]
    )

    # 4. Legal Complaint (Standard Legal Review)
    generate_pdf(
        "legal_complaint.pdf",
        "Civil Complaint for Breach of Contract",
        [
            "Case Number: CV-2024-001",
            "Court Name: Superior Court of the County",
            "Filing Date: 2024-06-15",
            "Plaintiff: ABC Corporation",
            "Defendant: XYZ Supplies LLC",
            "Claimed Damages: $35,000.00",
            "Complaint Description: This action arises from the Defendant's breach of a supply contract dated January 1st, 2024. "
            "Defendant agreed to deliver 5,000 units of raw materials by May 1st. The delivery did not occur until May 25th, "
            "resulting in a complete halt of the Plaintiff's manufacturing pipeline for three weeks. As a direct result of this delay, "
            "Plaintiff lost significant revenue and was forced to pay late fees to its own clients. Plaintiff seeks compensatory damages "
            "in the amount of $35,000.00 to cover these direct financial losses."
        ]
    )

    # 5. Fraud Claim (Investigation Flag)
    generate_pdf(
        "fraud_claim.pdf",
        "Property Theft Claim Report",
        [
            "Claim Number: CLM-FRD-9988",
            "Claimant Name: Chris Faker",
            "Policy Number: POL-999999",
            "Incident Date: 2024-07-01",
            "Claim Type: property",
            "Contact Phone: 555-000-0000",
            "Estimated Damage: $12,000.00",
            "Incident Description: I am submitting a claim for a burglary that occurred at my storage unit. "
            "Approximately $12,000 worth of electronics were stolen. However, after reviewing my security camera footage, "
            "the entire event appears highly staged. The suspects seem to know exactly where the blind spots for the cameras are, "
            "and they look directly at the camera in a very unnatural, fake manner before proceeding. I am submitting this claim "
            "anyway just to see if it covers the loss, but the incident seems completely fake and inconsistent."
        ]
    )
    
    print("\nAll test PDFs have been successfully generated in the 'test_docs' directory!")

if __name__ == "__main__":
    main()
