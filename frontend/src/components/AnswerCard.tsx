/** Card showing an answer with source indicator, rating stats, and rating buttons. */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Answer } from "../types";
import { answersApi } from "../api/client";

interface Props {
  answer: Answer;
  onRate: () => void;
}

export default function AnswerCard({ answer, onRate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derive state directly from props — always in sync with server
  const userRating = answer.user_rating ?? null;
  const helpfulCount = answer.helpful_count ?? 0;
  const notHelpfulCount = answer.not_helpful_count ?? 0;

  const sourceLabels: Record<string, string> = {
    ai: "🤖 AI",
    ta: "👨‍🏫 TA",
    student: "🎓 Student",
  };

  const handleRate = async (helpful: boolean) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await answersApi.rate(answer.id, helpful);
      onRate();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to rate answer";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`answer-card ${answer.source === "ai" ? "ai-answer" : ""}`}>
      <div className="answer-header">
        <span className="source-badge">{sourceLabels[answer.source]}</span>
        {answer.confidence != null && (
          <span className={`confidence ${answer.confidence < 0.5 ? "low-confidence" : ""}`}>
            Confidence: {Math.round(answer.confidence * 100)}%
            {answer.confidence < 0.5 && " ⚠️ TA review recommended"}
          </span>
        )}
      </div>
      <div className="answer-body">
        <ReactMarkdown>{answer.body}</ReactMarkdown>
      </div>

      {/* Rating stats — always visible */}
      <div className="rating-stats">
        <span className={`stat-item ${helpfulCount > 0 ? "positive" : ""}`}>
          👍 {helpfulCount}
        </span>
        <span className={`stat-item ${notHelpfulCount > 0 ? "negative" : ""}`}>
          👎 {notHelpfulCount}
        </span>
      </div>

      <div className="answer-footer">
        <span className="answer-date">
          {new Date(answer.created_at).toLocaleString()}
        </span>

        {/* Show user's persistent vote */}
        {userRating !== null && (
          <span className={`user-rating ${userRating ? "positive" : "negative"}`}>
            Your vote: {userRating ? "👍 Helpful" : "👎 Not helpful"}
          </span>
        )}

        {/* Always-visible buttons — allow changing */}
        <div className="rating-buttons">
          <button
            className={`rate-btn ${userRating === true ? "active" : ""}`}
            onClick={() => handleRate(true)}
            disabled={loading}
          >
            👍
          </button>
          <button
            className={`rate-btn ${userRating === false ? "active" : ""}`}
            onClick={() => handleRate(false)}
            disabled={loading}
          >
            👎
          </button>
        </div>

        {error && <span className="error-text">{error}</span>}
      </div>
    </div>
  );
}
