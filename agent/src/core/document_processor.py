import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import PyPDF2


class DocumentProcessor:
    def __init__(self, pdf_path: str):
        """Initialize the document processor with a PDF path."""
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    def extract_text_from_pdf(self) -> str:
        """Extract text from PDF while preserving structure."""
        print(f"📄 Reading PDF from: {self.pdf_path}")

        with open(self.pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            total_pages = len(pdf_reader.pages)
            print(f"📑 Processing {total_pages} pages...")

            for i, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                # Clean and normalize text
                page_text = self._clean_text(page_text)
                text += page_text + "\n\n"
                if i % 5 == 0:  # Progress update every 5 pages
                    print(f"   ✓ Processed {i}/{total_pages} pages")

            print(f"✅ Extracted {len(text)} characters of text")
            print("\nFirst 500 characters of extracted text:")
            print("-" * 80)
            print(text[:500])
            print("-" * 80)

            return text.strip()

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove multiple spaces
        text = re.sub(r"\s+", " ", text)
        # Remove multiple newlines
        text = re.sub(r"\n\s*\n", "\n\n", text)
        # Fix common PDF extraction issues
        text = text.replace("•", "\n•")
        return text.strip()

    def extract_sections(self, text: str) -> List[Dict[str, str]]:
        """Extract sections from text based on PCI DSS Prioritized Approach structure."""
        sections = []
        current_requirement = None
        current_content = []

        # Split text into lines and clean up
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        print("\nLooking for requirements in text...")

        # Regex patterns for requirements
        req_header_pattern = r"requirement\s+(\d+):\s+(.+?)(?:\s+\d|$)"
        req_item_pattern = r"^(\d+\.\d+(?:\.\d+)?)\s+(.+?)(?:\s+\d|$)"

        i = 0
        while i < len(lines):
            line = lines[i]

            # Check for requirement header
            header_match = re.search(req_header_pattern, line, re.IGNORECASE)
            if header_match:
                print(
                    f"\nFound requirement header: {header_match.group(1)} - {header_match.group(2)}"
                )
                # Save previous requirement if exists
                if current_requirement and current_content:
                    sections.append(
                        {
                            "type": "requirement",
                            "number": current_requirement["number"],
                            "title": current_requirement["title"],
                            "content": "\n".join(current_content),
                            "subrequirements": [],
                        }
                    )

                current_requirement = {
                    "number": header_match.group(1),
                    "title": header_match.group(2).strip(),
                }
                current_content = [line]
                i += 1
                continue

            # Check for requirement item
            item_match = re.search(req_item_pattern, line)
            if item_match and current_requirement:
                print(
                    f"  Found requirement item: {item_match.group(1)} - {item_match.group(2)}"
                )
                current_content.append(f"{item_match.group(1)} {item_match.group(2)}")

            i += 1

        # Add last requirement
        if current_requirement and current_content:
            sections.append(
                {
                    "type": "requirement",
                    "number": current_requirement["number"],
                    "title": current_requirement["title"],
                    "content": "\n".join(current_content),
                    "subrequirements": [],
                }
            )

        print(f"\nFound {len(sections)} requirements")
        return sections

    def convert_to_json(self, output_path: Optional[str] = None) -> Dict:
        """Convert PDF to structured JSON format."""
        text = self.extract_text_from_pdf()
        sections = self.extract_sections(text)

        # Extract version from text or filename
        version_pattern = r"PCI\s+DSS\s+v(\d+\.\d+(?:\.\d+)?)"
        version_match = re.search(version_pattern, text)
        version = version_match.group(1) if version_match else "Unknown"

        json_data = {
            "document_name": self.pdf_path.name,
            "metadata": {
                "type": "PCI DSS Standard",
                "version": version,
                "processed_date": datetime.now().isoformat(),
            },
            "requirements": sections,
        }

        if output_path:
            output_path = Path(output_path)
            with output_path.open("w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)

        return json_data


def main():
    # Process the PCI DSS document
    processor = DocumentProcessor("Prioritized-Approach-for-PCI-DSS-v3_2_1.pdf")

    # Convert to JSON and save
    json_data = processor.convert_to_json("pci_dss_structured.json")

    # Print some statistics
    print(f"Processed document: {json_data['document_name']}")
    print(f"Number of sections: {len(json_data['sections'])}")
    print("JSON file saved as: pci_dss_structured.json")


if __name__ == "__main__":
    main()
