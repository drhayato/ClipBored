import os
import shutil
import tempfile
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
from langchain_text_splitters import MarkdownHeaderTextSplitter

# --- CLIPBORED ENGINE CONFIGURATION ---
app = FastAPI(
    title="ClipBored Engine",
    description="Intelligent AI Study Assistant - Ingestion & Processing Pipeline",
    version="1.0.0"
)

# Explicitly whitelist Next.js frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
async def upload_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Streaming ingestion pipeline:
    1. Validate Extension
    2. Stream to Temp Disk (RAM Protection)
    3. Convert to Markdown (MarkItDown)
    4. Semantic Chunking (LangChain)
    5. Structural JSON Return
    """
    filename = file.filename or "unknown_source"
    file_ext = os.path.splitext(filename)[1].lower()

    # Phase 1: Extension Validation
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Phase 2: Disk-Bound Streaming (Memory Guard)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
    try:
        with open(temp_file.name, "wb") as buffer:
            # Stream directly from incoming binary object to disk
            shutil.copyfileobj(file.file, buffer)
        
        # Phase 3: MarkItDown Conversion
        # Convert local disk artifact to structured Markdown
        try:
            conversion_result = md_converter.convert(temp_file.name)
            raw_markdown = conversion_result.text_content
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Conversion error: {str(e)}"
            )

        # Phase 4: LangChain Semantic Chunking
        # Segment by Markdown headers to preserve contextual hierarchy
        structural_chunks = markdown_splitter.split_text(raw_markdown)

        # Phase 5: Result Packaging
        processed_chunks = []
        for idx, chunk in enumerate(structural_chunks):
            processed_chunks.append({
                "index": idx,
                "content": chunk.page_content,
                "metadata": chunk.metadata
            })

        return {
            "status": "SUCCESS",
            "filename": filename,
            "chunk_count": len(processed_chunks),
            "chunk_indices": [c["index"] for c in processed_chunks],
            "chunks": processed_chunks
        }

    except Exception as e:
        # Catch-all for pipeline failures
        if not isinstance(e, HTTPException):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ingestion pipeline failure: {str(e)}"
            )
        raise e

    finally:
        # Phase 6: Mandatory Disk Purge
        # Ensure temporary file artifacts are erased regardless of success
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
            
# --- ENGINE ENTRY POINT ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
