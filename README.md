# PDF Document Q&A System

A full-stack application that allows users to upload PDF documents and ask questions about their content using AI. The system leverages Google's Gemini model for natural language processing and vector similarity search for accurate document querying.

## Architecture

The application consists of three main components:

1. **Frontend (React)**: A modern web interface for document upload and interaction
2. **Backend API (Express)**: Handles file storage and query logging
3. **AI Service (FastAPI)**: Processes PDFs and handles Q&A functionality using LangChain and Google Gemini

### Tech Stack

- Frontend:
  - React
  - TailwindCSS
  - DOMPurify for XSS protection
- Backend:
  - Express.js
  - Multer for file uploads
- AI Service:
  - FastAPI
  - LangChain
  - Google Gemini API
  - FAISS for vector similarity search
  - PyMuPDF (fitz) for PDF processing

## Prerequisites

- Node.js (v14 or higher)
- Python (3.8 or higher)
- Google Gemini API key

## Installation

### 1. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file and add your configuration
echo "REACT_APP_EXPRESS_API=http://localhost:5000/api" > .env
echo "REACT_APP_FASTAPI_API=http://localhost:8000" >> .env
```

### 2. Express Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create uploads directory
mkdir uploads
```

### 3. FastAPI Service Setup

```bash
# Navigate to the AI service directory
cd ai-service

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
export GOOGLE_API_KEY=your_gemini_api_key  # On Windows: set GOOGLE_API_KEY=your_gemini_api_key
```

## Configuration

1. Update the `gemini_api_key` in the FastAPI service (`main.py`)
2. Configure CORS settings in both backend services if needed
3. Adjust file size limits in Express backend if required

## Running the Application

1. **Start the Express Backend**:
```bash
cd backend
npm start
# Server will start on http://localhost:5000
```

2. **Start the FastAPI Service**:
```bash
cd ai-service
uvicorn main:app --reload
# Service will start on http://localhost:8000
```

3. **Start the Frontend**:
```bash
cd frontend
npm start
# Application will open on http://localhost:3000
```

## Features

- PDF document upload and processing
- Real-time Q&A functionality
- Context-aware responses using document content
- Query logging and tracking
- Caching system for improved performance
- Markdown and code block support in responses
- Progress indicators and loading states
- Error handling and user feedback

## API Endpoints

### Express Backend

- `POST /api/upload`: Upload PDF documents
- `GET /api/documents`: List all uploaded documents
- `POST /api/query/log`: Log user queries
- `GET /api/queries/:documentId`: Get queries for a specific document

### FastAPI Service

- `POST /upload_pdf`: Process uploaded PDF documents
- `POST /ask`: Handle Q&A queries

## Development Guidelines

1. **Error Handling**: All components include comprehensive error handling and user feedback
2. **Security**: Implements file validation, XSS protection, and input sanitization
3. **Performance**: Uses caching and optimized text processing for better response times
4. **Scalability**: Modular design allows for easy expansion and modification

## Production Considerations

1. Replace in-memory storage with a proper database
2. Implement user authentication and authorization
3. Add rate limiting and additional security measures
4. Set up proper logging and monitoring
5. Configure proper CORS settings
6. Use environment variables for all sensitive data
7. Set up proper SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support and questions, please open an issue in the repository.
