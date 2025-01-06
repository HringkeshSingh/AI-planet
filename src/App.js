import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import "./App.css";
import AIavatar from "./AI_planet.jpg";
import UserAvatar from "./userAvatar.png";

const Header = ({ onFileUpload, isFileUploaded }) => (
  <div className="header">
    <div className="logo">
      <img src={AIavatar} alt="AI Planet Logo" />
      <span>AI Planet</span>
    </div>
    <div className="actions">
      <label className="upload-btn">
        Upload PDF
        <input
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => onFileUpload(e.target.files[0])}
        />
      </label>
      {isFileUploaded && <div className="upload-success">✔</div>}
    </div>
  </div>
);

const Message = ({ sender, text }) => {
  // Helper function to check if the text contains code
  const isCode = (message) => {
    return /```([\s\S]*?)```/.test(message); // Matches code blocks wrapped in triple backticks
  };

  // Helper function to process content
  const getProcessedContent = () => {
    if (isCode(text)) {
      // Extract code content
      const codeContent = text.match(/```([\s\S]*?)```/)[1];
      return (
        <pre className="code-block">
          <code>{codeContent}</code>
        </pre>
      );
    }

    // For non-code text, process formatting (e.g., bold, italics)
    if (sender === "user") {
      return {
        __html: DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }),
      };
    } else {
      return { __html: processFormatting(text) };
    }
  };

  return (
    <div className={`message ${sender} flex items-start gap-3 p-4`}>
      <div className="avatar shrink-0">
        {sender === "user" ? (
          <img src={UserAvatar} alt="User Avatar" className="avatar-img" />
        ) : (
          <img src={AIavatar} alt="AI Icon" className="avatar-img" />
        )}
      </div>
      <div className="text prose max-w-none">
        {isCode(text) ? (
          getProcessedContent()
        ) : (
          <div dangerouslySetInnerHTML={getProcessedContent()} />
        )}
      </div>
    </div>
  );
};

const processFormatting = (text) => {
  // Return empty string if text is null or undefined
  if (!text) return "";

  // Convert the text to string in case we receive other types
  const safeText = String(text);

  // Process different types of formatting in a specific order
  let processedText = safeText
    // First handle newlines to preserve spacing
    .replace(/\n/g, "<br>")

    // Handle bold with both markdown and HTML syntax
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/<bold>(.*?)<\/bold>/g, "<strong>$1</strong>")

    // Handle italics with both markdown and HTML syntax
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<italic>(.*?)<\/italic>/g, "<em>$1</em>")

    // Handle underline with both markdown and HTML syntax
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/<underline>(.*?)<\/underline>/g, "<u>$1</u>")

    // Add paragraph spacing for better readability
    .split("<br><br>")
    .map((para) => (para.trim() ? `<p class="mb-4">${para}</p>` : ""))
    .join("");

  // Sanitize the HTML to prevent XSS attacks while preserving formatting
  return DOMPurify.sanitize(processedText, {
    ALLOWED_TAGS: ["br", "p", "strong", "em", "u"],
    ALLOWED_ATTR: ["class"],
  });
};

const ChatArea = ({ messages, isLoading }) => (
  <div className="chat-area">
    {messages.map((msg, index) => (
      <Message key={index} sender={msg.sender} text={msg.text} />
    ))}
    {isLoading && (
      <div className="loading-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    )}
  </div>
);

const InputField = ({ onSend, isLoading }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-field">
      <input
        type="text"
        placeholder="Send a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? "..." : "➤"}
      </button>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! Please upload a PDF file to get started." },
  ]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);

  // Constants for API endpoints
  const EXPRESS_API = "http://localhost:5000/api";
  const FASTAPI_API = "http://localhost:8000";

  // Check for existing documents on load
  useEffect(() => {
    const checkExistingDocuments = async () => {
      try {
        const response = await fetch(`${EXPRESS_API}/documents`);
        const documents = await response.json();
        if (documents.length > 0) {
          setIsFileUploaded(true);
          setCurrentDocumentId(documents[0].id);
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "Previous document loaded. You can start asking questions or upload a new document.",
            },
          ]);
        }
      } catch (error) {
        console.error("Error checking existing documents:", error);
      }
    };
    checkExistingDocuments();
  }, []);

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsLoading(true);

    try {
      // Get answer from FastAPI
      const fastApiResponse = await fetch(`${FASTAPI_API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      if (!fastApiResponse.ok) {
        throw new Error("FastAPI request failed");
      }

      const fastApiData = await fastApiResponse.json();

      // Log query to Express backend if we have a document ID
      if (currentDocumentId) {
        await fetch(`${EXPRESS_API}/query/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: currentDocumentId,
            queryText: text,
            relevanceScore: fastApiData.relevance_score || 0,
          }),
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: fastApiData.answer,
        },
      ]);
    } catch (error) {
      console.error("Error processing query:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.type.includes("pdf")) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Please upload only PDF files.",
        },
      ]);
      return;
    }

    const formData = new FormData();
    formData.append("document", file); // Changed from "file" to "document" to match backend

    try {
      // Upload to Express backend first
      const expressResponse = await fetch(`${EXPRESS_API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!expressResponse.ok) {
        const errorData = await expressResponse.json();
        throw new Error(errorData.error || "Express upload failed");
      }

      const expressData = await expressResponse.json();
      setCurrentDocumentId(expressData.documentId);

      // Then upload to FastAPI for processing
      const fastApiFormData = new FormData();
      fastApiFormData.append("file", file);

      const fastApiResponse = await fetch(`${FASTAPI_API}/upload_pdf`, {
        method: "POST",
        body: fastApiFormData,
      });

      if (!fastApiResponse.ok) {
        throw new Error("FastAPI upload failed");
      }

      setIsFileUploaded(true);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "PDF uploaded successfully! You can now ask questions about its content.",
        },
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Upload error: ${error.message}. Please try again.`,
        },
      ]);
    }
  };

  return (
    <div className="app">
      <Header onFileUpload={handleFileUpload} isFileUploaded={isFileUploaded} />
      <ChatArea messages={messages} isLoading={isLoading} />
      <InputField onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default App;
