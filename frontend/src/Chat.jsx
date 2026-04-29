import { useState } from "react";
import axios from "axios";
export default function StudyAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  // Handle Question Send
  const handleSend = async () => {
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion("");

    // add user message
    setMessages((prev) => [...prev, { type: "user", text: currentQuestion }]);

    try {
      const res = await axios.post("http://localhost:8080/api/chat", {
        message: currentQuestion,
      });

      const aiResponse = res.data.reply;

      // ✅ DON'T SHOW if answer not found
      if (aiResponse.answer === "Answer not found in document") {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          answer: aiResponse.answer,
          example: aiResponse.example,
          page: aiResponse.page_number,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          error: "⚠️ Failed to get AI response.",
        },
      ]);
    }
  };
  console.log(messages);
  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "http://localhost:8080/api/upload",
        formData,
      );

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
            className={`p-3 rounded-lg max-w-2xl ${
              msg.type === "user"
                ? "bg-blue-500 text-white ml-auto"
                : msg.error
                  ? "bg-red-100 text-red-700"
                  : "bg-white shadow-md border text-black"
            }`}
          >
            {msg.type === "user" ? (
              msg.text
            ) : msg.error ? (
              msg.error
            ) : (
              <div className="space-y-2">
                <div className="space-y-3">
                  {/* Concept */}
                  <div>
                    <h3 className="font-semibold text-purple-700 mb-1">
                      📘 Explanation
                    </h3>
                    <p className="leading-relaxed">{msg.answer}</p>
                  </div>

                  {/* Example */}
                  {msg.example && (
                    <div className="bg-gray-100 border rounded p-3">
                      <h4 className="font-semibold text-sm mb-1">💡 Example</h4>

                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {msg.example}
                      </pre>
                    </div>
                  )}

                  {/* Source */}
                  {msg.answer !== "Answer not found in document" &&
                    msg.page && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 text-sm">
                        📖 Retrieved from your uploaded PDF 👉 Check{" "}
                        <strong>Page {msg.page}</strong> for detailed
                        explanation.
                      </div>
                    )}
                </div>
                {msg.example && (
                  <div className="bg-gray-200 p-2 rounded text-sm font-mono">
                    <strong>Example:</strong>
                    <br />
                    {msg.example}
                  </div>
                )}
              </div>
            )}
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
