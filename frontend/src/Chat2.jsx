import { useState, useEffect } from "react";
import axios from "axios";

export default function StudyAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);

  /* ===================================
            PDF UPLOAD
  =================================== */

  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/v2/upload",
        formData
      );

      console.log("UPLOAD:", res.data);

      setJobId(res.data.jobId);
      setStatus(res.data.status);
      setReady(false);
    } catch (err) {
      console.log(err);
    }
  };

  /* ===================================
            STATUS POLLING
  =================================== */

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/v2/status/${jobId}`
        );

        const currentStatus = res.data.status;

        console.log("STATUS:", currentStatus);

        setStatus(currentStatus);

        if (currentStatus === "completed") {
          setReady(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.log(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  /* ===================================
            ASK QUESTION
  =================================== */

  const handleSend = async () => {
    if (!question.trim() || !ready) return;

    const currentQuestion = question;

    setMessages((prev) => [
      ...prev,
      { type: "user", text: currentQuestion },
    ]);

    setQuestion("");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/v2/chat",
        {
          query: currentQuestion,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          answer: res.data.reply.answer,
          example: res.data.reply.example,
          page: res.data.reply.page_number,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          error: "⚠️ Failed to get AI response",
        },
      ]);
    }
  };

  /* ===================================
                UI
  =================================== */

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-purple-600 text-white text-center p-4 text-2xl font-bold">
        Async AI Study Assistant 🚀
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-white p-4 shadow space-y-2">
        <input
          type="file"
          accept=".pdf"
          onChange={uploadPDF}
          className="border p-2 rounded"
        />

        {/* {jobId && (
          <div className="text-xs text-gray-500">
            Job ID: {jobId}
          </div>
        )} */}

        {/* {status && (
          <div className="text-sm">
            📄 Index Status :
            <span className="ml-2 font-bold">
              {status.toUpperCase()}
            </span>
          </div>
        )} */}

        {!ready && jobId && (
          <div className="text-orange-600 text-sm">
            ⏳ Indexing PDF... please wait
          </div>
        )}

        {ready && (
          <div className="text-green-600 text-sm">
            ✅ PDF Ready — Ask Questions
          </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-2xl ${
              msg.type === "user"
                ? "bg-blue-500 text-white ml-auto"
                : msg.error
                ? "bg-red-100 text-red-700"
                : "bg-white border shadow"
            }`}
          >
            {msg.type === "user" ? (
              msg.text
            ) : msg.error ? (
              msg.error
            ) : (
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-purple-700">
                    📘 Explanation
                  </h3>
                  <p>{msg.answer}</p>
                </div>

                {msg.example && (
                  <div className="bg-gray-100 p-3 rounded">
                    <strong>💡 Example</strong>
                    <pre className="text-sm whitespace-pre-wrap">
                      {msg.example}
                    </pre>
                  </div>
                )}

                {msg.page && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-2 text-sm">
                    📖 Source Page: {msg.page}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="bg-white p-4 flex gap-2">
        <input
          disabled={!ready}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            ready
              ? "Ask question from PDF..."
              : "Upload PDF & wait for indexing..."
          }
          className="flex-1 border rounded p-2"
        />

        <button
          disabled={!ready}
          onClick={handleSend}
          className="bg-purple-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}