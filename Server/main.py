from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import os
import re
import fitz
import shutil
from typing import List, Optional, Dict, TypedDict
from langchain.schema import HumanMessage, Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
import asyncio
from functools import lru_cache
import hashlib
from datetime import datetime
import json

app = FastAPI(title="Optimized Document QA API", 
             description="Optimized API for querying documents using LangChain and Google Gemini",
             version="1.0.0")

app.add_middleware(CORSMiddleware, 
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Pydantic models
class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    context: Optional[str] = None
    expanded_query: Optional[str] = None

# Global variables
gemini_api_key = 'AIzaSyAnjlAlqhFoUu3BVBjO7cjszXbqePfahP4'
vectorstore = None
workflow = None
folder_path = "uploads"  # Changed to relative path
cache_dir = os.path.join(folder_path, "cache")
RELEVANCE_THRESHOLD = 0.6

# Ensure directories exist
os.makedirs(folder_path, exist_ok=True)
os.makedirs(cache_dir, exist_ok=True)

# Cache for document embeddings
embedding_cache: Dict[str, List[Document]] = {}

def get_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@lru_cache(maxsize=10)
def get_cached_embeddings(file_hash: str):
    """Get cached embeddings for a file."""
    cache_file = os.path.join(cache_dir, f"{file_hash}.json")
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            return json.load(f)
    return None

async def process_pdf(pdf_path: str) -> str:
    """Process PDF files asynchronously."""
    def extract_text(pdf_path):
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text("text")
            doc.close()
            return text
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            return ""
    
    # Run PDF processing in a thread pool
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        text = await loop.run_in_executor(pool, extract_text, pdf_path)
    return text

def optimize_text_chunks(text: str) -> List[Document]:
    """Optimize text chunking for better context retention."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
    )
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk) for chunk in chunks]

async def initialize_system(folder_path: str):
    """Initialize system with optimizations."""
    global vectorstore, workflow
    
    # Process PDFs concurrently
    pdf_files = [f for f in os.listdir(folder_path) if f.endswith('.pdf')]
    texts = []
    
    for pdf_file in pdf_files:
        file_path = os.path.join(folder_path, pdf_file)
        file_hash = get_file_hash(file_path)
        
        # Check cache first
        cached_data = get_cached_embeddings(file_hash)
        if cached_data:
            texts.extend(cached_data)
            continue
        
        # Process new PDFs
        text = await process_pdf(file_path)
        if text:  # Only add non-empty texts
            texts.append(text)
            
            # Cache the results
            cache_file = os.path.join(cache_dir, f"{file_hash}.json")
            with open(cache_file, 'w') as f:
                json.dump(text, f)
    
    if not texts:
        return None

    # Initialize embeddings and vector store
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=gemini_api_key
        )
        documents = []
        for text in texts:
            documents.extend(optimize_text_chunks(text))
        vectorstore = FAISS.from_documents(documents, embeddings)
    except Exception as e:
        print(f"Error initializing embeddings: {str(e)}")
        return None

    # Initialize workflow
    class State(TypedDict):
        question: str
        context: List[Document]
        response: str
        expanded_query: str
        summarized_context: str

    workflow = StateGraph(State)
    
    # Workflow functions
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0,
        google_api_key=gemini_api_key
    )

    def expand_query(query: str) -> str:
        return query

    def search_vector_db(query: str, k: int = 3) -> List[Document]:
        return vectorstore.similarity_search(query, k=k) if vectorstore else []

    def summarize_context(context: str) -> str:
        prompt = PromptTemplate(
            template='''Summarize concisely: {context}'''
        )
        messages = [HumanMessage(content=prompt.format(context=context))]
        return llm(messages).content.strip()

    def generate_response(context: str, question: str) -> str:
        prompt = PromptTemplate(
            template='''Question: {question}\nContext: {context}\nAnswer:'''
        )
        messages = [HumanMessage(content=prompt.format(context=context, question=question))]
        return llm(messages).content.strip()

    # Add nodes
    workflow.add_node("expand", lambda state: {**state, "expanded_query": expand_query(state["question"])})
    workflow.add_node("search", lambda state: {**state, "context": search_vector_db(state["expanded_query"])})
    workflow.add_node("summarize", lambda state: {**state, "summarized_context": summarize_context("".join(doc.page_content for doc in state["context"]))})
    workflow.add_node("generate", lambda state: {**state, "response": generate_response(" ".join(doc.page_content for doc in state["context"]), state["question"])})

    # Set up workflow
    workflow.set_entry_point("expand")
    workflow.add_edge("expand", "search")
    workflow.add_edge("search", "summarize")
    workflow.add_edge("summarize", "generate")
    workflow.set_finish_point("generate")

    return workflow.compile()

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save the uploaded file
        file_path = os.path.join(folder_path, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Initialize the system
        global workflow
        workflow = await initialize_system(folder_path)
        
        if not workflow:
            raise HTTPException(status_code=500, detail="Failed to process the PDF file")
        
        return {"message": "File uploaded and processed successfully"}
    except Exception as e:
        print(f"Upload error: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    if not workflow:
        raise HTTPException(status_code=500, detail="No documents have been uploaded yet")
    
    try:
        result = workflow.invoke({"question": request.question})
        return QuestionResponse(
            answer=result["response"],
            context=result.get("summarized_context"),
            expanded_query=result.get("expanded_query")
        )
    except Exception as e:
        print(f"Question error: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    global workflow
    try:
        workflow = await initialize_system(folder_path)
    except Exception as e:
        print(f"Startup error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)