# Implementation Plan — LabAssist

## Product Info

| Field | Details |
|-------|---------|
| **Product name** | LabAssist |
| **End-user** | Students taking the course who get stuck on labs |
| **Problem** | Waiting for TA feedback slows down learning; students ask the same recurring questions |
| **Product idea** | An AI-powered Q&A forum where students get instant answers from lab materials, and TAs step in only when needed |
| **Core feature** | Post a question → backend retrieves relevant lab docs → LLM generates answer → student rates helpfulness |

---

## Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌───────────┐
│   React     │  REST  │   FastAPI        │  HTTP  │  LLM API  │
│  Frontend   │───────►│   Backend        │───────►│  (Qwen)   │
└─────────────┘        │                  │        └───────────┘
                       │  ┌─────────────┐ │
                       │  │  RAG Engine │ │
                       │  │  (embed →   │ │
                       │  │  search →   │ │
                       │  │  generate)  │ │
                       │  └──────┬──────┘ │
                       └─────────┼────────┘
                                 │
                        ┌────────▼────────┐
                        │    PostgreSQL   │
                        │  (relational +  │
                        │   pgvector)     │
                        └─────────────────┘
```

### How It Works

1. Student submits a question through the web UI
2. Backend converts the question text to an embedding vector using a local sentence-transformer model
3. Backend searches lab documentation for the most semantically similar content
4. Backend constructs a prompt with the question and retrieved context, then calls the LLM API
5. The LLM generates an answer, which is stored in the database and returned to the student
6. Student rates the answer helpful or not — low-rated answers are flagged for TA review

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) + SQLModel + Alembic (migrations) |
| Database | PostgreSQL with pgvector extension |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2, local) |
| LLM | Qwen Code API (direct HTTP calls) |
| Frontend | React + TypeScript + Vite + React Router + Axios |
| Infrastructure | Docker Compose (dev + prod) + Caddy reverse proxy |
| Auth | JWT tokens (PyJWT) in V1, optional OAuth in V2 |
| Logging | structlog (structured JSON logging) |
| Rate Limiting | SlowAPI |
| Config | pydantic-settings + `.env` files |

---

## Version 1 — Core Feature

| Component | Details |
|-----------|---------|
| **Feature** | Student posts a question → RAG pipeline runs → LLM generates answer → student rates 👍/👎 |
| **Backend** | FastAPI with CRUD endpoints for questions, answers, and ratings |
| **Database** | PostgreSQL with pgvector for semantic search on lab documents |
| **AI layer** | Backend runs RAG pipeline directly: embed question → search docs → prompt LLM → store answer |
| **Frontend** | React app with: post question form, question list, detail view with answers and rating buttons |
| **Auth** | JWT-based per-user authentication (student / TA roles) |
| **Docker** | All services containerized from day 1 — PostgreSQL, backend, frontend with hot-reload volumes |
| **Demo** | Live flow: register/login → post a question → watch AI answer appear → rate it |

### V1 Steps

| # | Step | Status |
|---|------|--------|
| 1 | Scaffold project structure + Docker Compose (postgres, backend, frontend) | ⬜ |
| 2 | Define database models + set up Alembic for migrations | ⬜ |
| 3 | Configure `.env` strategy with pydantic-settings + create `.env.example` | ⬜ |
| 4 | Build FastAPI CRUD endpoints with JWT auth + SlowAPI rate limiting | ⬜ |
| 5 | Seed database with demo users and lab docs (from `seed/` directory) | ⬜ |
| 6 | Add pgvector extension and embedding column to lab_docs | ⬜ |
| 7 | Integrate sentence-transformers for text embeddings (with Docker volume for model cache) | ⬜ |
| 8 | Build RAG pipeline: embed → vector search → prompt → LLM call | ⬜ |
| 9 | Connect question creation to RAG pipeline (auto-generate AI answer) | ⬜ |
| 10 | Add structured logging (structlog) + error handling middleware | ⬜ |
| 11 | Build React frontend with routing (post question, list, detail, rate) | ⬜ |
| 12 | Configure Docker health checks + service dependencies | ⬜ |
| 13 | Self-test end-to-end, fix bugs | ⬜ |

---

## Version 2 — Deployed

| Component | Details |
|-----------|---------|
| **New features** | TA review queue for flagged answers, semantic search for similar questions, stats dashboard |
| **Polish** | Per-user authentication, confidence scores on AI answers, loading states, error handling |
| **Dockerize** | All services in Docker Compose (backend, frontend, PostgreSQL with pgvector) |
| **Deploy** | Deploy on VM behind Caddy reverse proxy, publicly accessible |
| **TA feedback** | Address all feedback points from V1 demo |

### V2 Steps

| # | Step | Status |
|---|------|--------|
| 1 | TA review queue for 👎 flagged answers | ⬜ |
| 2 | Semantic search similar questions before posting | ⬜ |
| 3 | Stats dashboard page | ⬜ |
| 4 | Production Docker multi-stage builds + optimized images | ⬜ |
| 5 | Deploy on VM with Caddy + HTTPS | ⬜ |

---

## Presentation & Submission

| # | Step | Status |
|---|------|--------|
| 1 | Record 2-minute demo video with voice-over | ⬜ |
| 2 | Write README.md with usage and deployment docs | ⬜ |
| 3 | Create 5-slide presentation PDF | ⬜ |
| 4 | Submit to GitHub + Moodle | ⬜ |

---

## Database Schema

### `user`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `username` | str | unique, not null |
| `role` | str | student / ta / admin |
| `created_at` | datetime | |

### `question`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → user, not null |
| `title` | str | max 200 chars |
| `body` | str | not null |
| `status` | str | open / answered / closed |
| `ai_answer_id` | UUID | FK → answer, nullable |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### `answer`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `question_id` | UUID | FK → question, not null |
| `user_id` | UUID | FK → user, nullable (null for AI) |
| `body` | str | not null |
| `source` | str | ai / ta / student |
| `confidence` | float | nullable (0–1) |
| `created_at` | datetime | |

### `rating`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `answer_id` | UUID | FK → answer, not null |
| `user_id` | UUID | FK → user, not null |
| `helpful` | bool | not null |
| `created_at` | datetime | |

### `lab_doc`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `lab_number` | int | not null |
| `title` | str | not null |
| `content` | str | not null (full text) |
| `embedding` | vector(384) | sentence-transformers embedding |
| `updated_at` | datetime | |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/api/v1/questions` | student | Create question (triggers AI answer) |
| `GET` | `/api/v1/questions` | — | List questions, filter by status |
| `GET` | `/api/v1/questions/{id}` | — | Get question with all answers |
| `POST` | `/api/v1/questions/{id}/answer` | TA | TA adds manual answer |
| `POST` | `/api/v1/answers/{id}/rate` | student | Rate answer helpful / not |
| `GET` | `/api/v1/search?q=...` | — | Search similar questions (V2) |
| `GET` | `/api/v1/stats` | — | Forum analytics (V2) |

---

## RAG Pipeline

The core AI logic runs inside the backend on every new question:

### 1. Embed
- Input: question title + body
- Model: `sentence-transformers/all-MiniLM-L6-v2` (runs locally in backend)
- Output: 384-dimensional vector

### 2. Retrieve
- Storage: pgvector column on `lab_doc` table
- Query: cosine similarity between question embedding and all lab doc embeddings
- Returns: top 3 most relevant lab documents

### 3. Generate
- Build prompt with system instruction, question, and retrieved context
- Call Qwen Code API with prompt
- Parse response: answer text + self-assessed confidence score + source lab numbers
- Store answer in database with source = "ai"

### 4. Return
- Return the question with the generated answer to the frontend
- Student can rate the answer with 👍 or 👎

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI generates incorrect answers | Confidence score + rating system + TA can override |
| LLM API is slow or down | Set timeout, mark question as "pending" if needed |
| pgvector unavailable on target VM | Fall back to PostgreSQL full-text search |
| No relevant lab docs found | LLM answers from general knowledge, marks as "unverified" |
| Embedding model too heavy for VM | Use lightweight all-MiniLM-L6-v2 (80MB), runs on CPU |
