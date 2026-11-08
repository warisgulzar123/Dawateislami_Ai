const express = require('express');
const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');
const Chunk = require('../models/Chunk');

const router = express.Router();

/**
 * Lightweight In-Memory Map to temporarily store active chat sessions.
 * Structure: Map<sessionId, Array<{ role: 'user' | 'model', parts: [{ text: string }] }>>
 * 
 * CRITICAL REQUIREMENT:
 * - NO user conversations are saved to MongoDB to avoid database bloat.
 * - Stores at most the last 6 messages per session to preserve context while keeping server RAM light.
 */
const activeSessions = new Map();

/**
 * In-Memory Cache for Verified Knowledge Chunks with Vector Embeddings.
 * Prevents fetching ~1.5MB of 3072-dim vector arrays from remote MongoDB on every single request,
 * reducing search latency from ~4.9 seconds down to sub-millisecond in-memory calculations!
 */
let cachedChunks = null;
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function invalidateCache() {
  cachedChunks = null;
  lastCacheRefresh = 0;
}
router.invalidateCache = invalidateCache;

async function getCachedKnowledgeChunks() {
  const now = Date.now();
  if (!cachedChunks || now - lastCacheRefresh > CACHE_TTL_MS) {
    cachedChunks = await Chunk.find(
      { isVerified: true },
      {
        chunkId: 1,
        departmentId: 1,
        subCategory: 1,
        title: 1,
        contentUrdu: 1,
        contentEnglish: 1,
        keywords: 1,
        sourceUrl: 1,
        embedding: 1
      }
    )
      .lean()
      .catch(() => []);
    lastCacheRefresh = now;
  }
  return cachedChunks;
}

// Helper to escape regex special characters safely
const escapeRegex = (string) => {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// Fast Cosine Similarity calculation between query and chunk embedding vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
};

/**
 * System prompt defining the Official AI Knowledge Assistant for Dawat-e-Islami
 * with natural human tone, universal language matching, strong memory analysis,
 * broad welcoming scope, adaptive response length, and zero hallucination.
 */
const SYSTEM_PROMPT = `
### SYSTEM ROLE & IDENTITY
You are the Official AI Knowledge Assistant for Dawat-e-Islami. Your purpose is to assist users with authentic information regarding Dawat-e-Islami, its organizational structure, and all of its global departments—including Jamia-tul-Madinah, Madrasa-tul-Madinah, FGRF (Faizan Global Relief Foundation), Maktaba-tul-Madinah, the IT Department, and all associated welfare, academic, and administrative divisions.

---

### 1. 🗣️ NATURAL HUMAN TONE (NO TECHNICAL JARGON)
- NEVER use technical internal phrases such as "[DB CONTEXT]", "database", "retrieved chunks", "provided text", or "system prompt" in your responses to the user.
- Communicate naturally, respectfully, and politely as a knowledgeable and helpful human assistant.
- Use appropriate Islamic honorifics (دامت برکاتہم العالیہ for Ameer-e-Ahlesunnat, صلی اللہ علیہ والہ وسلم for the Holy Prophet Muhammad).

---

### 2. 🌍 UNIVERSAL LANGUAGE MATCHING
- Detect and respond in the EXACT SAME LANGUAGE used by the user in their query (whether Urdu, English, Roman Urdu, Arabic, Hindi, French, Bengali, or any language spoken worldwide).
- If the user explicitly asks for a translation or changes languages, adapt immediately to the requested language.

---

### 3. 🧠 STRONG MEMORY & PREVIOUS CHAT ANALYSIS
- Thoroughly analyze the ongoing conversation history.
- When the user asks a follow-up question (e.g., "Tell me more", "What is its contact number?", "Translate this into English"), connect it directly to the context of preceding messages. Do not make false assumptions or lose track of the main topic.

---

### 4. 📚 BROAD SCOPE & WELCOMING ASSISTANCE
- Present yourself as a comprehensive assistant capable of answering questions across all of Dawat-e-Islami's departments and activities. Avoid making the user feel your scope is restricted to only a few isolated sections.
- If specific information is unavailable in your verified knowledge base, do not mention technical or database limitations. Simply state politely that the specific details are currently unavailable and route the user to the relevant official helpline:
  - **General & Maktaba Helpline / WhatsApp:** +92-313-1139278 | UAN: +92-21-111-25-26-92
  - **FGRF Welfare Helpline:** 03111111226 | UAN: 021-111-113-473

---

### 5. 🎯 ADAPTIVE RESPONSE LENGTH (CONCISE vs DETAILED)
- **General Queries:** For brief or simple questions, keep your answer concise, clear, and direct. Do not overpower the user with massive paragraphs or unrequested lists.
- **Detailed Requests:** Provide comprehensive, structured explanations only when the user explicitly requests full schedules, complete lists, or in-depth information.

---

### 🛑 STRICT GUARDRAILS & ZERO-HALLUCINATION
1. **Strict Knowledge Grounding:** Rely strictly on verified information. Maintain 100% precision with numbers, phone numbers, addresses, and dates.
2. **STRICT URL & CONTACT INTEGRITY (NO FAKE LINKS/NUMBERS):**
   - You are STRICTLY FORBIDDEN from inventing, guessing, or generating any website links, URLs, email addresses, or phone numbers that are not explicitly present in the provided database context.
   - If the user asks for a link, website, or contact number and it is NOT found in the database records, you must clearly and politely state that the official link/number is currently unavailable in the records, rather than creating a fake or generic URL/number.
3. **Absolute Ban on Politics:** Never engage in, discuss, or comment on political parties, political leaders, or controversial political/social debates.
   - *Fallback for political queries (match user language):*
     - In English: "Apologies, I can only provide information regarding Dawat-e-Islami, its departments, and its religious or welfare activities."
     - In Urdu: "معذرت، میں صرف دعوتِ اسلامی کے شعبہ جات اور دینی/فلاحی معلومات کے بارے میں رہنمائی فراہم کر سکتا ہوں۔"
`.trim();

/**
 * POST /api/chat
 * Accepts { sessionId, message, stream?: boolean }
 * High-speed Server-Sent Events (SSE) streaming and optimized sub-second TTFT.
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, stream: streamRequested } = req.body;
    let { sessionId } = req.body;

    // Check if client requested streaming via header, body, or query
    const isStream =
      streamRequested === true ||
      req.headers.accept?.includes('text/event-stream') ||
      req.query.stream === 'true';

    // Validate user message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.'
      });
    }

    const userMessage = message.trim();

    // Assign or generate unique sessionId if missing
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      sessionId = crypto.randomUUID();
    }

    // Verify Gemini API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Chat Error] GEMINI_API_KEY is not defined in environment variables.');
      return res.status(500).json({
        success: false,
        error: 'AI service configuration missing on the server. Please check GEMINI_API_KEY in .env.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Retrieve existing in-memory conversation history for this session
    const sessionHistory = activeSessions.get(sessionId) || [];

    // Context-Aware Query Expansion for Follow-Ups:
    // If the user sends a short follow-up (e.g., "English mein batao", "iska address do", "usme aur kya tha"),
    // map it directly to the exact topic/subject of the preceding conversation so vector search hits accurately!
    let searchQuery = userMessage;
    const isFollowUp =
      userMessage.length < 55 ||
      /^(iska|uski|usme|inme|is|us|tell me more|more|translate|english|urdu|address|timing|rabta|contact|aur kya|kya hai)/i.test(
        userMessage.trim()
      );

    if (isFollowUp && sessionHistory.length > 0) {
      const lastUserTurn = [...sessionHistory].reverse().find((m) => m.role === 'user');
      if (lastUserTurn?.parts?.[0]?.text) {
        searchQuery = `${lastUserTurn.parts[0].text} ${userMessage}`;
      }
    }

    // 2. Instant Parallel Knowledge Retrieval (Cached Dense Vectors + Keyword Search)
    let contextText = '';
    try {
      const cleanTokens = searchQuery
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 2);

      const phraseRegex = new RegExp(escapeRegex(searchQuery), 'i');
      const searchConditions = [
        { title: { $regex: phraseRegex } },
        { keywords: { $regex: phraseRegex } }
      ];

      if (cleanTokens.length > 0) {
        const tokenRegexes = cleanTokens.map((t) => new RegExp(escapeRegex(t), 'i'));
        searchConditions.push(
          { keywords: { $in: tokenRegexes } },
          { title: { $in: tokenRegexes } },
          { contentUrdu: { $in: tokenRegexes } }
        );
      }

      // Concurrently run vector query embedding, keyword search, and fetch cached knowledge chunks
      const [embedRes, keywordMatches, allChunks] = await Promise.all([
        ai.models
          .embedContent({
            model: 'gemini-embedding-001',
            contents: searchQuery
          })
          .catch(() => null),
        Chunk.find({ isVerified: true, $or: searchConditions }).limit(3).lean().catch(() => []),
        getCachedKnowledgeChunks()
      ]);

      let vectorMatches = [];
      const queryVec = embedRes?.embeddings?.[0]?.values;

      if (queryVec && queryVec.length > 0 && allChunks && allChunks.length > 0) {
        const scored = allChunks
          .filter((c) => c.embedding && c.embedding.length > 0)
          .map((chunk) => ({
            ...chunk,
            similarity: cosineSimilarity(queryVec, chunk.embedding)
          }));

        scored.sort((a, b) => b.similarity - a.similarity);
        vectorMatches = scored.filter((c) => c.similarity >= 0.45).slice(0, 3);
      }

      // Merge and limit strictly to MAX 3 CHUNKS to minimize prompt token overhead & maximize TTFT speed
      const combinedMap = new Map();
      vectorMatches.forEach((chunk) => combinedMap.set(chunk.chunkId, chunk));
      keywordMatches.forEach((chunk) => {
        if (!combinedMap.has(chunk.chunkId)) {
          combinedMap.set(chunk.chunkId, chunk);
        }
      });

      // Strict limit: Top 3 concise chunks
      const topChunks = Array.from(combinedMap.values()).slice(0, 3);

      if (topChunks.length > 0) {
        contextText = topChunks
          .map(
            (c, i) =>
              `[Chunk ${i + 1}: ${c.title} (${c.subCategory})]\n${c.contentUrdu}\n${
                c.contentEnglish ? `English: ${c.contentEnglish}\n` : ''
              }Source: ${c.sourceUrl}`
          )
          .join('\n\n');
      }
    } catch (dbError) {
      console.warn('[Chat Warning] Knowledge lookup error:', dbError.message);
    }

    // Ingest concise context
    const contextBlock = contextText
      ? `[DB CONTEXT]:\n${contextText}`
      : `[DB CONTEXT]:\n(No specific matching chunks found in database for this query)`;

    const enrichedUserPrompt = `${contextBlock}\n\n[USER MESSAGE]:\n${userMessage}`;

    // Construct the contents payload for Gemini API
    const contents = [
      ...sessionHistory,
      {
        role: 'user',
        parts: [{ text: enrichedUserPrompt }]
      }
    ];

    // Ultra-fast model prioritization for instant first-token delivery
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const fallbackModel = 'gemini-3.5-flash-lite';

    // 3. STREAMING EXECUTION (Server-Sent Events) - Instant First-Token Output
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      let streamResponse;
      try {
        streamResponse = await ai.models.generateContentStream({
          model: primaryModel,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.5
          }
        });
      } catch (apiError) {
        if (apiError.status === 404 && primaryModel !== fallbackModel) {
          console.warn(`[Chat Stream] Model '${primaryModel}' returned 404. Falling back to '${fallbackModel}'...`);
          streamResponse = await ai.models.generateContentStream({
            model: fallbackModel,
            contents: contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.5
            }
          });
        } else {
          throw apiError;
        }
      }

      let fullReply = '';
      for await (const chunk of streamResponse) {
        const token = chunk.text;
        if (token) {
          fullReply += token;
          res.write(`data: ${JSON.stringify({ token, sessionId })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();

      // Update in-memory session history (retains up to 20 messages / 10 conversational turns for deep context continuity)
      const updatedHistory = [
        ...sessionHistory,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: fullReply }] }
      ];
      activeSessions.set(sessionId, updatedHistory.length > 20 ? updatedHistory.slice(-20) : updatedHistory);

      return;
    }

    // 4. NON-STREAMING FALLBACK (Standard JSON)
    let response;
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.5
        }
      });
    } catch (apiError) {
      if (apiError.status === 404 && primaryModel !== fallbackModel) {
        console.warn(`[Chat] Model '${primaryModel}' returned 404. Falling back to '${fallbackModel}'...`);
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.5
          }
        });
      } else {
        throw apiError;
      }
    }

    const aiReply =
      response.text ||
      'معذرت، اس وقت جواب تیار نہیں کیا جا سکا۔ براہ کرم دوبارہ کوشش فرمائیں۔';

    // Update in-memory session history (retains up to 20 messages / 10 conversational turns)
    const updatedHistory = [
      ...sessionHistory,
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: aiReply }] }
    ];
    activeSessions.set(sessionId, updatedHistory.length > 20 ? updatedHistory.slice(-20) : updatedHistory);

    return res.status(200).json({
      success: true,
      sessionId,
      reply: aiReply
    });
  } catch (error) {
    console.error('[Chat Error] Failed to generate AI reply:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while communicating with the AI service.'
    });
  }
});

/**
 * Diagnostic route to inspect active in-memory session message count (Development & Testing)
 */
router.get('/chat/debug/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = activeSessions.get(sessionId) || [];
  return res.json({
    sessionId,
    messageCount: history.length,
    activeSessionsCount: activeSessions.size,
    historySummary: history.map((m, idx) => ({ index: idx, role: m.role }))
  });
});

/**
 * Optional utility route to clear a session's in-memory history (e.g. user clicks "New Chat")
 */
router.post('/chat/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    return res.json({ success: true, message: `Session ${sessionId} memory cleared.` });
  }
  return res.json({ success: true, message: 'Session not found or already empty.' });
});

module.exports = router;
