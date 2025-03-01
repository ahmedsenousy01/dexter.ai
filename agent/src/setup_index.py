import os

import PyPDF2
from config.config import (
    DATA_DIR,
    EMBEDDING_MODEL_NAME,
    FAISS_INDEX_PATH,
    OPENAI_API_KEY,
    PDF_PATH,
)
from core.document_processor import DocumentProcessor
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings


def process_pdf(pdf_path: str) -> str:
    """Extract text from PDF."""
    print(f"📄 Reading PDF from: {pdf_path}")

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

    with open(pdf_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        total_pages = len(pdf_reader.pages)

        print(f"📑 Processing {total_pages} pages...")
        for i, page in enumerate(pdf_reader.pages, 1):
            text += page.extract_text() + "\n\n"
            if i % 5 == 0:  # Progress update every 5 pages
                print(f"   ✓ Processed {i}/{total_pages} pages")

    return text


def create_faiss_index():
    """Create FAISS index from PDF content."""
    try:
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)

        # Process PDF into structured JSON
        processor = DocumentProcessor(PDF_PATH)
        json_data = processor.convert_to_json()
        print(
            f"✅ PDF processed into structured JSON: {len(json_data['requirements'])} requirements found"
        )

        # Prepare chunks with metadata
        chunks = []
        metadata_list = []

        # Process each requirement
        for req in json_data.get("requirements", []):
            print(f"Processing requirement {req.get('number', 'unknown')}")
            # Main requirement chunk
            req_text = f"Requirement {req.get('number', 'unknown')}: {req.get('title', 'unknown')}\n\n{req.get('content', '')}"
            chunks.append(req_text)
            metadata_list.append(
                {
                    "type": "requirement",
                    "number": req.get("number", "unknown"),
                    "title": req.get("title", "unknown"),
                    "version": json_data["metadata"]["version"],
                }
            )

            # Process subrequirements
            for subreq in req.get("subrequirements", []):
                print(f"  Processing subrequirement {subreq.get('number', 'unknown')}")
                subreq_text = f"{subreq.get('number', 'unknown')} {subreq.get('title', 'unknown')}\n\n{subreq.get('content', '')}"
                chunks.append(subreq_text)
                metadata_list.append(
                    {
                        "type": "subrequirement",
                        "number": subreq.get("number", "unknown"),
                        "parent_requirement": req.get("number", "unknown"),
                        "title": subreq.get("title", "unknown"),
                        "version": json_data["metadata"]["version"],
                    }
                )

        print(f"✅ Created {len(chunks)} structured chunks with metadata")

        if not chunks:
            print("❌ No chunks were created. Check the document processing.")
            return

        # Create embeddings
        print("\n🔤 Creating embeddings...")
        embeddings = OpenAIEmbeddings(
            model=EMBEDDING_MODEL_NAME, openai_api_key=OPENAI_API_KEY
        )

        # Create and save FAISS index
        print(f"\n💾 Creating FAISS index at: {FAISS_INDEX_PATH}")
        vector_store = FAISS.from_texts(
            texts=chunks, embedding=embeddings, metadatas=metadata_list
        )
        vector_store.save_local(FAISS_INDEX_PATH)
        print("✅ FAISS index created successfully with metadata")

    except Exception as e:
        print(f"\n❌ Error creating FAISS index: {str(e)}")
        raise


if __name__ == "__main__":
    print("\n=== PCI DSS Document Indexing ===")
    create_faiss_index()
    print("\n✨ Setup complete! You can now run main.py to start the chatbot.")
