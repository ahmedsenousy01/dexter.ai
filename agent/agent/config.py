import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Base paths
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(AGENT_DIR, "data")

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# API Keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# Model Configuration
EMBEDDING_MODEL_NAME = os.getenv('EMBEDDING_MODEL_NAME', 'text-embedding-3-small')
GEMINI_MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-pro')

# RAG Configuration
RETRIEVER_K = int(os.getenv('RETRIEVER_K', '4'))
FAISS_INDEX_PATH = os.getenv('FAISS_INDEX_PATH', 'agent/data/faiss_index')

# File Paths
PDF_PATH = os.path.join(AGENT_DIR, "Prioritized-Approach-for-PCI-DSS-v3_2_1.pdf")
JSON_OUTPUT_PATH = "pci_dss_structured.json"

# Validate required environment variables
required_vars = ['OPENAI_API_KEY', 'GOOGLE_API_KEY']
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(missing_vars)}\n"
        "Please ensure these are set in your .env file."
    ) 