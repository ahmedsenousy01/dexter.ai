"""Configuration settings for the agent."""

import os
from dotenv import load_dotenv
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent.parent
PROJECT_DIR = Path(__file__).parent.parent

# Load environment variables from .env file
env_path = BASE_DIR / ".env"
load_dotenv(env_path)

# Data directories structure
DATA_DIR = BASE_DIR / "data"  # For processed/generated data
FAISS_INDEX_DIR = BASE_DIR / "faiss_index"  # For vector store indexes
INPUT_DIR = BASE_DIR / "input"  # For input documents
OUTPUT_DIR = DATA_DIR / "output"  # For generated outputs

# Create necessary directories
for dir_path in [DATA_DIR, FAISS_INDEX_DIR, INPUT_DIR, OUTPUT_DIR]:
    dir_path.mkdir(exist_ok=True)

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Model Configuration
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")

# RAG Configuration
RETRIEVER_K = int(os.getenv("RETRIEVER_K", "4"))

# File Paths
PDF_PATH = INPUT_DIR / "Prioritized-Approach-for-PCI-DSS-v3_2_1.pdf"
JSON_OUTPUT_PATH = OUTPUT_DIR / "pci_dss_structured.json"
FAISS_INDEX_PATH = FAISS_INDEX_DIR / "index"

# Convert Path objects to strings for compatibility
AGENT_DIR = str(PROJECT_DIR)
DATA_DIR = str(DATA_DIR)
FAISS_INDEX_PATH = str(FAISS_INDEX_PATH)
PDF_PATH = str(PDF_PATH)
JSON_OUTPUT_PATH = str(JSON_OUTPUT_PATH)
INPUT_DIR = str(INPUT_DIR)
OUTPUT_DIR = str(OUTPUT_DIR)
FAISS_INDEX_DIR = str(FAISS_INDEX_DIR)

# Validate required environment variables
required_vars = ["OPENAI_API_KEY", "GOOGLE_API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(missing_vars)}\n"
        "Please ensure these are set in your .env file."
    )
