/** Create new question page. */

import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { questionsApi } from "../api/client";

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await questionsApi.create(title, body);
      navigate(`/questions/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-question-page">
      <h1>Ask a Question</h1>
      <p className="help-text">
        Your question will be answered instantly by AI based on lab materials.
      </p>

      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of your question"
            required
            autoFocus
            maxLength={200}
          />
          <span className="char-count">{title.length}/200</span>
        </div>

        <div className="form-group">
          <label>Details</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your problem in detail..."
            required
            rows={6}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Post Question"}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
