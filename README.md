# AI Voice Interview

Voice-powered mock interview app for IT professionals. Practice technical interviews with an AI interviewer, get instant feedback, and track your progress.

**Live:** [aiwebinterview.vercel.app](https://aiwebinterview.vercel.app)

---

## Features

- Voice interviews via speech-to-text and text-to-speech
- Role, level, and mode selection (behavioral / technical / mixed)
- AI-generated questions and real-time feedback
- Resume upload and analysis
- Leaderboard and interview history
- User profiles with authentication

## Stack

**Frontend** - React, Vite, react-router-dom

**Backend** - Vercel Serverless Functions (`/api/chat.js`, `/api/resume.js`)

**AI** - Groq API (llama-3.3-70b)

**Database / Auth / Storage** - Supabase (PostgreSQL, Auth, Storage)

**Deploy** - Vercel

## Database

| Table | Description |
|---|---|
| `profiles` | User profile data (username, avatar) |
| `interview_results` | Session results (role, level, score, feedback) |
| `leaderboard` | View aggregating top results |

## Testing

Playwright e2e suite - 11 tests covering auth, interview flow, resume, and protected routes.
CI runs on every push to main via GitHub Actions. Smoke test (real Groq) is triggered manually.

```bash
npx playwright test
npx playwright show-report
```

## Getting Started

```bash
git clone https://github.com/newzealandpanda/interview-ai
cd interview-ai
npm install
npm run dev
```

Create a `.env` file based on `.env.example` and add your Supabase and Groq credentials.

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```
