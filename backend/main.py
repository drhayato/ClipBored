import os
import shutil
import tempfile
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
from langchain_text_splitters import MarkdownHeaderTextSplitter

# --- FORCE EXPLICIT PATH MAPPING FOR ENVIRONMENT VALUES ---
from dotenv import load_dotenv

# Find the exact path of the directory main.py lives in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Map the path explicitly to the .env file in the same directory
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Force load the .env file explicitly using its absolute path coordinates
load_dotenv(dotenv_path=ENV_PATH)
# -----------------------------------------------------------

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# -- Directory Configuration ---
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

# Make sure folders exist to prevent crash
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

# === FIXED: Initialize app exactly ONCE with all settings ===
app = FastAPI(
    title="ClipBored Engine",
    description="Intelligent AI Study Assistant - Ingestion & Processing Pipeline",
    version="1.0.0"
)

# Initialize OpenAI Embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", dimensions=1024)

# Create a local Chroma vector store instance
vector_store = Chroma(
    persist_directory=CHROMA_DIR,
    embedding_function=embeddings,
    collection_name="clipbored_Documents"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Microsoft's MarkItDown
md_converter = MarkItDown()

# Configure LangChain Header Splitting Logic
headers_to_split_on = [
    ("#", "Header_1"),
    ("##", "Header_2"),
    ("###", "Header_3"),
]
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

# Valid Ingestion Extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".pptx", ".txt"}

# --- HEALTH & VALIDATION ROUTES ---

@app.get("/api/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """
    Validates backend engine availability.
    """
    return {
        "status": "HEALTHY",
        "engine": "ClipBored_FastAPI",
        "version": "1.0.0"
    }

# --- INGESTION PIPELINE ---

@app.post("/api/ingest/upload")
async def upload_documents(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    """
    Streaming ingestion pipeline for multiple files:
    1. Validate Extensions
    2. Stream to Temp Disk (RAM Protection)
    3. Convert to Markdown (MarkItDown)
    4. Semantic Chunking (LangChain)
    5. Aggregate results and return
    """
    total_chunks = 0
    all_logs = []
    processed_files = []

    for file in files:
        filename = file.filename or "unknown_source"
        file_ext = os.path.splitext(filename)[1].lower()

        # Phase 1: Extension Validation
        if file_ext not in ALLOWED_EXTENSIONS:
            all_logs.append(f"SKIP: '{filename}' - Unsupported format")
            continue

        # Phase 2: Disk-Bound Streaming (Memory Guard)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
        temp_file.close()  # Close the handle immediately to avoid Windows PermissionError

        try:
            with open(temp_file.name, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Phase 3: MarkItDown Conversion
            try:
                conversion_result = md_converter.convert(temp_file.name)
                raw_markdown = conversion_result.text_content
            except Exception as e:
                all_logs.append(f"ERROR: '{filename}' - Conversion failed: {str(e)}")
                continue

            # Phase 4: LangChain Semantic Chunking
            structural_chunks = markdown_splitter.split_text(raw_markdown)
            file_chunk_count = len(structural_chunks)
            total_chunks += file_chunk_count

            # === PHASE 5: THE VECTOR VAULT INJECTION ===
            from langchain_core.documents import Document

            documents_to_store = [
                Document(
                    page_content=chunk.page_content,
                    metadata={**chunk.metadata, "source": filename}
                )
                for chunk in structural_chunks
            ]
            
            # Commit documents to the local Chroma instance
            if documents_to_store:
                vector_store.add_documents(documents_to_store)

            all_logs.append(f"SUCCESS: '{filename}' - {file_chunk_count} chunks stored in Vector Vault")
            processed_files.append(filename)

        except Exception as e:
            all_logs.append(f"ERROR: '{filename}' - Pipeline failure: {str(e)}")
        finally:
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)

    if not processed_files and files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process any files. Logs: {'; '.join(all_logs)}"
        )

    return {
        "status": "SUCCESS",
        "message": f"Successfully processed {len(processed_files)}/{len(files)} files",
        "chunks": int(total_chunks),
        "logs": all_logs
    }

# --- ENGINE ENTRY POINT ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
