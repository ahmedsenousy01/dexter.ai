import os
import re

import google.generativeai as genai
from config import (
    EMBEDDING_MODEL_NAME,
    FAISS_INDEX_PATH,
    GEMINI_MODEL_NAME,
    GOOGLE_API_KEY,
    OPENAI_API_KEY,
    RETRIEVER_K,
)
from langchain_community.vectorstores import FAISS
from langchain_core.tools import tool
from langchain_openai import OpenAIEmbeddings

# Set environment variables and configure models
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 2048,
}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

model = genai.GenerativeModel(
    model_name=GEMINI_MODEL_NAME,
    generation_config=generation_config,
    safety_settings=safety_settings,
)

# Initialize embeddings
embedding_model = OpenAIEmbeddings(
    model=EMBEDDING_MODEL_NAME, openai_api_key=OPENAI_API_KEY
)

try:
    # Try to load existing FAISS index
    vector_store = FAISS.load_local(
        FAISS_INDEX_PATH, embedding_model, allow_dangerous_deserialization=True
    )
    print("✅ FAISS index loaded successfully")
except Exception as e:
    print(f"❌ Error loading FAISS index: {str(e)}")
    print("Please run setup_index.py first to create the index.")
    vector_store = None

retriever = (
    vector_store.as_retriever(search_kwargs={"k": RETRIEVER_K})
    if vector_store
    else None
)


@tool
def rag_retrieval(query: str) -> str:
    """Process a query about security standards using RAG."""
    try:
        if not vector_store or not retriever:
            return "⚠️ Error: Vector store not initialized. Please run setup_index.py first."

        # Enhanced requirement pattern matching with variations
        req_patterns = [
            r"(?:requirement|req\.?|r)\s*[-:]?\s*(\d+(?:\.\d+)?(?:\.\d+)?)",
            r"(?:testing procedure|test|tp)\s*[-:]?\s*(\d+(?:\.\d+)?(?:\.\d+)?)",
            r"(?:guidance|guide|g)\s*[-:]?\s*(\d+(?:\.\d+)?(?:\.\d+)?)",
        ]

        # Identify query type for better context
        query_topics = {
            "cloud": ["cloud", "aws", "azure", "gcp", "saas", "hosting"],
            "storage": ["storage", "database", "backup", "repository"],
            "encryption": ["encrypt", "cryptography", "cipher", "key"],
            "access": ["access", "authentication", "authorization", "permission"],
        }

        # Determine query context
        query_context = []
        for topic, keywords in query_topics.items():
            if any(keyword in query.lower() for keyword in keywords):
                query_context.append(topic)

        # Enhanced query based on context
        enhanced_query = query
        if query_context:
            context_additions = {
                "cloud": """
                Include:
                - Cloud service provider requirements
                - Shared responsibility model
                - Data residency requirements
                - Cloud-specific security controls
                """,
                "storage": """
                Include:
                - Data storage requirements
                - Backup and recovery procedures
                - Data retention policies
                - Storage security controls
                """,
                "encryption": """
                Include:
                - Encryption requirements
                - Key management procedures
                - Cryptographic standards
                - Implementation guidance
                """,
                "access": """
                Include:
                - Access control requirements
                - Authentication methods
                - Authorization procedures
                - Audit requirements
                """,
            }
            for context in query_context:
                enhanced_query += context_additions.get(context, "")

        req_number = None
        req_type = None

        # Try each pattern
        for pattern in req_patterns:
            match = re.search(pattern, query.lower())
            if match:
                req_number = match.group(1)
                req_type = (
                    "requirement"
                    if "req" in pattern
                    else "testing"
                    if "test" in pattern
                    else "guidance"
                )
                print(f"📌 Direct lookup for PCI {req_type.title()}: {req_number}")
                break

        if req_number:
            # Hierarchical search strategy with page context
            docs = []

            # 1. Try exact requirement number match with metadata filtering
            search_filters = {
                "number": req_number,
                "type": req_type if req_type else None,
            }
            search_filters = {k: v for k, v in search_filters.items() if v is not None}

            docs = vector_store.similarity_search(
                query, k=RETRIEVER_K, filter=search_filters, search_type="similarity"
            )

            # 2. If no exact match, try parent requirement
            if not docs and "." in req_number:
                parent_req = req_number.split(".")[0]
                print(f"ℹ️ Checking parent requirement: {parent_req}")
                docs = vector_store.similarity_search(
                    query,
                    k=RETRIEVER_K,
                    filter={"number": parent_req},
                    search_type="similarity",
                )

            # 3. Try related sections (testing procedures, guidance)
            if not docs:
                print("ℹ️ Checking related sections")
                enhanced_query = f"""
                PCI DSS requirement {req_number}
                Include:
                - Main requirement text
                - Testing procedures
                - Implementation guidance
                - Applicability notes
                Query: {query}
                """
                docs = retriever.invoke(enhanced_query)
        else:
            print("🔍 Performing semantic search with context enhancement")
            # Enhanced semantic search with context
            docs = retriever.invoke(enhanced_query)

        if not docs:
            # Enhanced fallback handling
            fallback_responses = {
                "cloud": """
                While specific PCI DSS context is not available, here are important cloud security considerations:
                1. Data Classification and Storage
                   - Identify and classify sensitive data
                   - Implement appropriate storage controls
                   - Monitor data access and movement
                
                2. Cloud Service Provider Security
                   - Evaluate provider security certifications
                   - Review shared responsibility model
                   - Implement additional security controls
                
                3. Compliance Requirements
                   - Maintain data sovereignty
                   - Implement encryption
                   - Regular security assessments
                
                4. Risk Mitigation
                   - Regular backup and recovery testing
                   - Incident response planning
                   - Security monitoring and alerting
                """,
                "storage": """
                General best practices for secure data storage:
                1. Data Protection
                   - Encryption at rest and in transit
                   - Access control mechanisms
                   - Regular backup procedures
                
                2. Security Controls
                   - Monitoring and logging
                   - Intrusion detection
                   - Data loss prevention
                
                3. Compliance Measures
                   - Regular audits
                   - Policy enforcement
                   - Documentation maintenance
                """,
                # Add more fallback responses for other contexts
            }

            # Return relevant fallback response or general guidance
            for context in query_context:
                if context in fallback_responses:
                    return fallback_responses[context]

            return """
            While specific PCI DSS guidance is not available, here are general security best practices:
            1. Risk Assessment
               - Identify potential threats
               - Evaluate vulnerabilities
               - Implement controls
            
            2. Security Controls
               - Access control
               - Encryption
               - Monitoring
            
            3. Compliance
               - Regular audits
               - Policy enforcement
               - Documentation
            
            Please consult with a qualified security assessor for specific compliance requirements.
            """

        # Deduplicate and organize documents with page context
        seen_content = set()
        organized_docs = []

        for doc in docs:
            content = doc.page_content.strip()
            if content not in seen_content:
                seen_content.add(content)

                # Extract metadata with page context
                metadata = doc.metadata
                doc_type = metadata.get("type", "Section")
                doc_number = metadata.get("number", "N/A")
                doc_version = metadata.get("version", "N/A")
                doc_page = metadata.get("page", "N/A")
                doc_section = metadata.get("section", "")

                # Determine content type for better organization
                content_type = "🔑 Requirement"
                if "test" in doc_type.lower():
                    content_type = "🔍 Testing Procedure"
                elif "guide" in doc_type.lower():
                    content_type = "📋 Implementation Guidance"
                elif "note" in doc_type.lower():
                    content_type = "�� Applicability Note"

                # Format with detailed citation and page context
                formatted_doc = (
                    f"📄 [{doc_type} {doc_number}] (PCI DSS v{doc_version}, Page {doc_page})\n"
                    f"{content_type}:\n"
                    f"Section: {doc_section}\n"
                    f"{content}"
                )
                organized_docs.append(formatted_doc)

        # Organize documents by type and relevance
        context = "\n\n" + "=" * 50 + "\n\n".join(organized_docs)

        # Enhanced prompt for more precise responses with page context
        prompt = f"""You are Dexter.ai, a precise security compliance assistant specializing in PCI DSS standards. Analyze the following information:

QUERY: "{query}"

RETRIEVED INFORMATION:
{context}

Response Guidelines:
1. 📌 Exact Citations
   - Quote requirements verbatim with version, page numbers, and section references
   - Format citations as: "According to PCI DSS v[version] requirement [X.Y.Z] (Page [N])"
   - Include relevant testing procedures and guidance

2. 🔍 Hierarchical Information
   - Present main requirements first
   - Follow with specific sub-requirements
   - Include associated testing procedures
   - Add implementation guidance and notes
   - Reference page numbers for each section

3. 💡 Practical Application
   - Explain technical terms in [brackets]
   - Provide step-by-step implementation guidance
   - List prerequisites and dependencies
   - Cross-reference related requirements
   - Include page references for detailed procedures

4. ⚠️ Scope and Context
   - Specify the exact scope of each requirement
   - Note any conditions or exceptions
   - Highlight related requirements
   - Reference specific sections for more details
   - Include page numbers for further reading

Format your response to:
1. Maintain exact PCI DSS language with proper citations
2. Include page numbers for all references
3. Organize information hierarchically
4. Cross-reference related requirements
5. Provide clear implementation guidance"""

        response = model.generate_content(prompt)
        return (
            response.text.strip()
            if response.text.strip()
            else "🤖 I need to think about this differently. Could you rephrase your question?"
        )

    except Exception as e:
        print(f"🚨 Error details: {str(e)}")  # Debug logging
        return "⚠️ I encountered an error processing your query. Please try again or rephrase your question."
