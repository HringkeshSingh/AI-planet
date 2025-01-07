# PDF Q&A Assistant

Transform the way you interact with PDF documents using our cutting-edge AI-powered application. This full-stack solution enables natural conversations with your PDF content, leveraging Google's Gemini model to provide accurate, context-aware responses to your questions.

## Features

Our application combines powerful functionality with an intuitive user experience:

- **Intelligent Document Processing**: Upload any PDF document and start asking questions immediately about its content
- **Natural Language Understanding**: Engage in fluid conversations with the AI about your documents
- **Advanced Search Capabilities**: Utilizes vector similarity search to find the most relevant information
- **Real-time Interaction**: Get instant, context-aware responses powered by Google Gemini
- **Rich Text Support**: Handles code blocks and formatted text in both questions and answers
- **Historical Tracking**: Maintains a record of your queries for future reference

## Technology Foundation

### Frontend Architecture
The user interface is built with modern web technologies:
- React.js for creating a dynamic and responsive user experience
- Custom CSS implementations for polished visual design
- DOMPurify integration for secure content rendering

### Backend Systems
Our server infrastructure consists of two complementary services:
- FastAPI handling AI operations and response generation
- Express.js managing data persistence and server operations
- Knex.js providing robust database interaction capabilities

### Data Management
- PostgreSQL database for efficient storage of documents and query history

## Getting Started

### 1. Initial Setup
Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/HringkeshSingh/AI-planet.git
cd AI-planet
```

### 2. Frontend Configuration
Set up the React application:
```bash
cd src
npm install
cp .env.example .env
npm start run
```

### 3. Express Backend Setup
Configure the server component:
```bash
cd server
npm install
mkdir uploads
npm i -g nodemon
nodemon server.js
```

### 4. AI Service Configuration
Prepare the AI service environment:
```bash
cd server
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
pip install #Add all the packages required for main.py to work
```
Note: Add your Gemini API key to main.py before starting the service

### 5. Environment Configuration

Create environment files with the following configurations:

**Frontend (.env):**
```
REACT_APP_EXPRESS_API=http://localhost:5000/api
REACT_APP_FASTAPI_API=http://localhost:8000
```

## Database Management

Our project uses Knex.js for database migrations, ensuring consistent schema management across environments. Key database management commands include:

```bash
# Create a new migration
npx knex migrate:make migration_name

# Apply migrations
npx knex migrate:latest

# Rollback migrations
npx knex migrate:rollback
```

## Project Structure
```
AI-planet/
├── Server/
│   ├── Database/         # Database configurations
│   ├── models/          # Data models
│   ├── uploads/         # PDF storage
│   ├── server.js        # Express backend
│   ├── main.py         # FastAPI service
├── src/                # React frontend
│   ├── App.js          # Main component
│   ├── App.css         # Styling
├── public/            # Static assets
```

## API Endpoints

### Express Backend (Port 5000)
- `POST /api/upload` - Document upload endpoint
- `GET /api/documents` - Document listing
- `POST /api/query/log` - Query logging
- `GET /api/queries/:documentId` - Query retrieval

### AI Service (Port 8000)
- `POST /upload_pdf` - PDF processing
- `POST /ask` - Q&A endpoint

## Development Environment

Access the application components at:
- Frontend: http://localhost:3000
- Express Backend: http://localhost:5000
- FastAPI Service: http://localhost:8000

## Prerequisites

- Node.js version 14 or higher
- Python 3.8 or higher
- Google Gemini API key
- PostgreSQL database

## Security Considerations

Before deploying to production, ensure you:
- Configure appropriate CORS settings
- Implement robust authentication
- Set reasonable file upload limits
- Use environment variables for sensitive data
- Implement rate limiting

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Submit a pull request

## Licensing

This project is licensed under the MIT License, allowing for free use and modification.

## Acknowledgments

This project builds on the work of several outstanding open-source projects:
- Google Gemini for AI capabilities
- LangChain for AI framework
- FAISS for similarity search
- And many other open-source contributors

---
Built with dedication by the development team.
