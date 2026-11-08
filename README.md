# Dawat-e-Islami AI Assistant Backend 🕌

A production-ready MERN backend and knowledge-grounded AI assistant for **Dawat-e-Islami**, powered by Node.js, Express, MongoDB (Mongoose), and Google's official `@google/genai` SDK using the `gemini-1.5-flash` model.

---

## 🌟 Key Features

- **Official Google Gen AI SDK Integration**: Built with `@google/genai` accessing `gemini-1.5-flash` for high-speed, cost-effective, and authentic responses.
- **In-Memory Session Architecture (Zero DB Chat Bloat)**:
  - User messages and conversation histories are **never** stored in MongoDB to prevent database bloat.
  - Active sessions are maintained temporarily in a server-side JavaScript `Map` (`activeSessions`).
  - Automatically prunes conversation context to the **last 6 messages** (3 user + 3 model turns), preserving recent context while keeping server RAM light.
- **RAG / Knowledge Grounding**: Queries MongoDB for verified Dawat-e-Islami knowledge chunks via bilingual keywords and regex search to ground the assistant with authentic facts.
- **Authentic Urdu Persona & Engagement**:
  - Responds in polite, respectful Urdu with Islamic honorifics (دامت برکاتہم العالیہ، صلی اللہ علیہ والہ وسلم).
  - Automatically suggests 2–3 relevant follow-up topics/questions at the end of every reply to keep users engaged.
  - Redirects complex fiqhi queries and fatwas to Dar-ul-Ifta Ahlesunnat.
- **Data Seeding Pipeline**: Idempotent upsert script using Mongoose `bulkWrite` for quick knowledge base population.

---

## 📂 Project Structure

```
dawat-e-islami-ai/
├── client/                   # Modern React + Tailwind CSS Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader.jsx       # Header with branding & Clear Chat
│   │   │   ├── ChatMessage.jsx      # Bubbles with ReactMarkdown & RTL Urdu
│   │   │   ├── SuggestedChips.jsx   # Interactive follow-up topic pills
│   │   │   └── ChatInput.jsx        # Input bar with Speech-to-Text ('ur-PK')
│   │   ├── App.jsx                  # Main state, Axios caller, auto-scroll
│   │   ├── index.css                # Tailwind CSS & Urdu typography
│   │   └── main.jsx
│   ├── index.html                   # Urdu Nastaliq Google Fonts & meta
│   ├── tailwind.config.js           # Theme configuration (#0F5132 emerald)
│   └── vite.config.js
├── config/
│   └── db.js                 # MongoDB connection logic
├── data/
│   └── knowledge.js          # Authentic Dawat-e-Islami knowledge chunks (Urdu + Metadata)
├── models/
│   └── Chunk.js              # Mongoose schema for knowledge base chunks
├── routes/
│   └── chatRoutes.js         # /api/chat endpoint with in-memory session memory & Gemini API call
├── scripts/
│   └── seedKnowledge.js      # Pipeline to upsert knowledge chunks into MongoDB
├── .env.example              # Environment variable template
├── .gitignore
├── package.json              # Backend dependencies and run scripts
├── server.js                 # Express application entry point
└── README.md                 # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or later recommended)
- **MongoDB** (Local instance or MongoDB Atlas)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Configure Backend Environment
Ensure `.env` in the root directory contains your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dawat_e_islami_ai
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Seed Knowledge Base & Start Backend
```bash
# Seed authentic Dawat-e-Islami knowledge chunks
npm run seed

# Run backend server (http://localhost:5000)
npm run dev
```

### 4. Start the React Frontend
In a new terminal window:
```bash
# From project root:
npm run client

# Or from inside the client folder:
cd client
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 📡 API Reference

### 1. Send Message
- **Endpoint**: `POST /api/chat`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "sessionId": "session-xyz-123", // Optional: if omitted, the server generates a UUID
    "message": "دعوتِ اسلامی کا قیام کب اور کہاں ہوا؟"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "sessionId": "session-xyz-123",
    "reply": "السلام علیکم ورحمۃ اللہ وبرکاتہ! دعوتِ اسلامی کا قیام 1981ء (ذوالقعدۃ الحرام 1401ھ) میں باب المدینہ کراچی (پاکستان) میں رکھا گیا...\n\n📌 مزید جاننے کے لیے آپ ان موضوعات کے بارے میں دریافت فرما سکتے ہیں:\n1. امیرِ اہل سنت کی حیات اور خدمات\n2. عالمی مدنی مرکز فیضانِ مدینہ کی تفصیلات\n3. مدنی چینل کے دینی پروگرامز"
  }
  ```

### 2. Reset Session Memory
- **Endpoint**: `POST /api/chat/reset`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "sessionId": "session-xyz-123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Session session-xyz-123 memory cleared."
  }
  ```

### 3. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "uptime": 12.4,
    "timestamp": "2026-11-07T14:30:00.000Z"
  }
  ```

---

## 🔐 Authentication & Roles

- **Guest Access**: Users can chat with the AI Assistant without logging in.
- **Fixed Admin Account**:
  - **Email**: `admin@gmail.com`
  - **Password**: `admin123`
  - **Role**: `admin` (Full CRUD privileges on knowledge base)
- **Regular Users**: Can register and sign in with email and password (`role: 'user'`).

### Auth Endpoints
- `POST /api/auth/login`: Accepts `{ email, password }` -> Returns `{ success, token, user }`
- `POST /api/auth/register`: Accepts `{ name, email, password }` -> Returns `{ success, token, user }`
- `GET /api/auth/me`: Protected endpoint returning authenticated profile

---

## 📊 Admin Knowledge CRUD Endpoints (Protected: Admin Only)

All endpoints require `Authorization: Bearer <token>` with `role: 'admin'`.

- `GET /api/knowledge`: List chunks with query filtering (`?search=...&departmentId=...`), includes stats (`totalCount`, `verifiedCount`, `departments`).
- `POST /api/knowledge`: Insert new knowledge chunk with automatic vector embedding generation.
- `PUT /api/knowledge/:id`: Update existing knowledge chunk and re-generate vector embedding if content changed.
- `DELETE /api/knowledge/:id`: Delete a knowledge chunk.

---

## 🧪 Automated End-to-End Test Suite

Run the full E2E test suite covering Health, Guest Chat, Fixed Admin Login, User Auth, RBAC Security, and Admin Knowledge CRUD:

```bash
node scripts/testSuite.js
```
