# LabAssist

> AI-powered Q&A forum for lab courses. Instant answers from lab materials via RAG, with TA review for edge cases.

---

## What is LabAssist?

LabAssist is an AI-powered Q&A forum built for students taking lab-based courses. When you're stuck on a lab, you get instant answers sourced from your actual lab materials — not generic AI responses. TAs step in only when the AI can't help.

### How it works

1. **Post a question** — describe what you're stuck on
2. **AI retrieves context** — searches lab docs for the most relevant sections using semantic similarity
3. **Instant answer** — an LLM generates an answer grounded in your lab materials
4. **Rate the answer** — 👍 or 👎; low-rated answers get flagged for TA review

---

## Features

- **RAG-powered answers** — answers are grounded in your actual lab documents, not hallucinated
- **Semantic search** — finds similar questions before you post, reducing duplicates
- **Feedback loop** — rating system surfaces bad answers for TA review
- **JWT authentication** — per-user accounts with student/TA roles
- **Confidence scores** — every AI answer includes a self-assessed confidence level
- **Dockerized** — one command to spin up the full stack locally

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + SQLModel + Alembic |
| Database | PostgreSQL + pgvector |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2, local) |
| LLM | Qwen API |
| Frontend | React + TypeScript + Vite + React Router + Axios |
| Infrastructure | Docker Compose + Caddy |
| Auth | JWT tokens (PyJWT) |
| Logging | structlog (structured JSON) |
| Rate Limiting | SlowAPI |

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

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- A Qwen API key

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/labassist.git
cd labassist
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/labassist

# LLM
LLM_API_BASE=https://api.qwen.ai/v1
LLM_API_KEY=your-api-key-here

# Auth
SECRET_KEY=change-this-to-a-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000
```

### 3. Start all services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** (with pgvector) on port `5432`
- **Backend** (FastAPI) on port `8000`
- **Frontend** (React + Vite) on port `3000`

### 4. Seed the database

```bash
docker compose exec backend python -m seed
```

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000) and start asking questions.

---

## Project Structure

```
labassist/
├── backend/
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── models/         # SQLModel database models
│   │   ├── services/       # Business logic (RAG pipeline, auth)
│   │   ├── config.py       # pydantic-settings configuration
│   │   └── main.py         # FastAPI app entry point
│   ├── alembic/            # Database migrations
│   ├── seed/               # Seed data (lab docs, demo users)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page views
│   │   ├── api/            # Axios API client
│   │   ├── context/        # Auth context
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── Caddyfile
├── .env.example
└── README.md
```

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/questions` | List questions (filter by `?status=open|answered|closed`) |
| `GET` | `/api/v1/questions/{id}` | Get question with all answers |
| `GET` | `/api/v1/search?q=...` | Search similar questions (V2) |
| `GET` | `/api/v1/stats` | Forum analytics (V2) |

### Authenticated

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/questions` | student | Create question (triggers AI answer) |
| `POST` | `/api/v1/questions/{id}/answer` | TA | TA adds manual answer |
| `POST` | `/api/v1/answers/{id}/rate` | student | Rate answer helpful or not |
| `POST` | `/api/v1/auth/register` | — | Register a new user |
| `POST` | `/api/v1/auth/login` | — | Login, returns JWT token |

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

## RAG Pipeline

The core AI logic runs inside the backend on every new question:

1. **Embed** — question text → 384-dimensional vector via `all-MiniLM-L6-v2`
2. **Retrieve** — cosine similarity search in pgvector, returns top 3 lab docs
3. **Generate** — prompt built with question + context → Qwen API call → answer + confidence score
4. **Return** — answer stored in DB with `source=ai` and returned to frontend

---

## Development

### Run services individually (without Docker)

**PostgreSQL:**

```bash
docker run --name labassist-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d pgvector/pgvector:pg16
```

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Run Alembic migrations

```bash
cd backend
alembic upgrade head
```

### Run tests

```bash
cd backend
pytest
```

---

## Deployment

### Production Docker

```bash
docker compose -f docker-compose.prod.yml up -d
```

### VM with Caddy

1. Point your domain to the VM
2. Update `Caddyfile` with your domain
3. Set `.env` with production values
4. Run `docker compose -f docker-compose.prod.yml up -d`
5. Caddy auto-provisions HTTPS via Let's Encrypt

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI generates incorrect answers | Confidence score + rating system + TA override |
| LLM API is slow or down | Timeout set, question marked "pending" if needed |
| pgvector unavailable on target VM | Fallback to PostgreSQL full-text search |
| No relevant lab docs found | LLM answers from general knowledge, marked as "unverified" |
| Embedding model too heavy for VM | Lightweight 80MB model, runs on CPU |

---

## License

MIT
