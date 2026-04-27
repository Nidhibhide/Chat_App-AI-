import { useState } from "react";
import axios from "axios";
export default function StudyAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  // Handle Question Send
  const handleSend = async () => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, question]);
    const currentQuestion = question;
    setQuestion("");

    try {
      const res = await axios.post("http://localhost:8080/api/chat", {
        message: currentQuestion,
      });
console.log(res);
      setMessages((prev) => [...prev, res.data.reply || "No response from AI"]);
    } catch (error) {
      setMessages((prev) => [...prev, "⚠️ Failed to get AI response. Please try again."]);
    }
  };

  const uploadPDF = async (e) => {
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);

      const res = await axios.post("http://localhost:8080/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-purple-600 text-white text-center p-4 text-2xl font-bold">
        AI Study Assistant
      </div>

      {/* Upload Section */}
      <div className="p-4 bg-white shadow">
        <input
          type="file"
          accept=".pdf"
          onChange={uploadPDF}
          className="border p-2 rounded"
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-xl ${
              index % 2 === 0
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-300 text-black"
            }`}
          >
            {msg}
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Ask your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 border rounded p-2"
        />

        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
