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
        with open(self.pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""

            for page in pdf_reader.pages:
                page_text = page.extract_text()
                # Clean and normalize text
                page_text = self._clean_text(page_text)
                text += page_text + "\n\n"

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
        """Extract sections from text based on PCI DSS structure."""
        sections = []
        current_requirement = None
        current_subrequirement = None
        current_content = []

        # Regex patterns for PCI DSS structure
        requirement_pattern = r"^Requirement\s+(\d+):\s+(.+)$"
        subrequirement_pattern = r"^(\d+\.\d+(?:\.\d+)?)\s+(.+)$"

        for line in text.split("\n"):
            # Check for main requirement
            req_match = re.match(requirement_pattern, line, re.IGNORECASE)
            if req_match:
                # Save previous section if exists
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
                    "number": req_match.group(1),
                    "title": req_match.group(2),
                }
                current_content = [line]
                continue

            # Check for subrequirement
            subreq_match = re.match(subrequirement_pattern, line)
            if subreq_match:
                # Save previous subrequirement if exists
                if current_subrequirement and current_content:
                    if current_requirement:
                        sections[-1]["subrequirements"].append(
                            {
                                "type": "subrequirement",
                                "number": current_subrequirement["number"],
                                "title": current_subrequirement["title"],
                                "content": "\n".join(current_content),
                            }
                        )
                current_subrequirement = {
                    "number": subreq_match.group(1),
                    "title": subreq_match.group(2),
                }
                current_content = [line]
                continue

            # Add line to current content
            current_content.append(line)

        # Add last section
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
