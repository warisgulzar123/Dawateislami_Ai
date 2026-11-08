import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChatHeader from './components/ChatHeader';
import ChatDrawer from './components/ChatDrawer';
import ChatMessage from './components/ChatMessage';
import SuggestedQuestions from './components/SuggestedQuestions';
import ChatInput from './components/ChatInput';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import { AlertCircle, Bot } from 'lucide-react';
import { API_BASE_URL } from './config/api';

export default function App() {
  // Navigation & View State ('chat' | 'admin')
  const [activeView, setActiveView] = useState('chat');

  // Drawer State (Mobile Sidebar)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Chat State
  const [sessionId, setSessionId] = useState('');
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize or restore Auth & Session ID from localStorage
  useEffect(() => {
    // Restore User & Token
    const savedToken = localStorage.getItem('dawateislami_auth_token');
    const savedUserStr = localStorage.getItem('dawateislami_user');
    if (savedToken && savedUserStr) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUserStr));
      } catch (err) {
        console.warn('Failed to parse saved user:', err);
      }
    }

    // Restore or Create Session ID
    let savedSessionId = localStorage.getItem('dawateislami_session_id');
    if (!savedSessionId) {
      savedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('dawateislami_session_id', savedSessionId);
    }
    setSessionId(savedSessionId);
  }, []);

  // Auto-scroll to bottom on new message or loading/streaming state
  useEffect(() => {
    if (activeView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeView]);

  // Auth Success Callback
  const handleAuthSuccess = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);

    // If Admin logged in, switch directly to Admin Dashboard
    if (authenticatedUser && authenticatedUser.role === 'admin') {
      setActiveView('admin');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('dawateislami_auth_token');
    localStorage.removeItem('dawateislami_user');
    setUser(null);
    setToken('');
    setActiveView('chat');
  };

  // Send message to backend with Real-Time Token Streaming (SSE)
  // GUEST ACCESS: Works completely without login!
  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    // Immediately mark chat as started and hide suggestions permanently
    setHasChatStarted(true);
    setErrorBanner('');

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessagePlaceholder = {
      id: aiMessageId,
      sender: 'ai',
      text: '', // Tokens stream into this in real time
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage, aiMessagePlaceholder]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          sessionId: sessionId || localStorage.getItem('dawateislami_session_id'),
          message: textToSend,
          stream: true
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
              if (parsed.sessionId && parsed.sessionId !== sessionId) {
                setSessionId(parsed.sessionId);
                localStorage.setItem('dawateislami_session_id', parsed.sessionId);
              }
            } catch (parseErr) {
              // Ignore partial stream frames
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await response.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, text: data.reply || '' } : m
          )
        );
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorMsg =
        err.message ||
        'Unable to connect to the assistant server. Please check your network connection.';

      setErrorBanner(errorMsg);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: `⚠️ **Server Connection Notice:** ${errorMsg}\n\nPlease verify that the backend server is running.`
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation history & reset to landing screen
  const handleClearChat = async () => {
    try {
      if (sessionId) {
        await axios.post(`${API_BASE_URL}/chat/reset`, { sessionId }).catch(() => {});
      }
    } catch (err) {
      console.warn('Reset endpoint notice:', err);
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('dawateislami_session_id', newSessionId);
    setMessages([]);
    setHasChatStarted(false);
    setErrorBanner('');
  };

  // Render Admin Dashboard View
  if (activeView === 'admin' && user && user.role === 'admin') {
    return (
      <AdminPanel
        token={token}
        onBackToChat={() => setActiveView('chat')}
      />
    );
  }

  // Render Public AI Chat Assistant (with optional login & guest access)
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* Mobile Sidebar / Drawer */}
      <ChatDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNewChat={handleClearChat}
        onSelectTopic={handleSendMessage}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigateAdmin={() => setActiveView('admin')}
        messageCount={messages.length}
      />

      {/* Header with Navigation & Auth */}
      <ChatHeader
        onClearChat={handleClearChat}
        messageCount={messages.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigateAdmin={() => setActiveView('admin')}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Main Conversation Container with Mobile-First Responsive Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-2 sm:px-4 py-4 flex flex-col justify-between">
        {/* Connection Error Banner */}
        {errorBanner && (
          <div className="mx-2 mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between text-xs md:text-sm animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner('')}
              className="text-xs font-semibold underline hover:text-rose-900 ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Data-Grounded Suggested Questions Landing Screen (Render ONLY when messages.length === 0 and !hasChatStarted) */}
        {!hasChatStarted && messages.length === 0 && (
          <SuggestedQuestions onSelectQuestion={handleSendMessage} />
        )}

        {/* Messages List during active conversation */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-1">
            {messages.map((msg) => {
              if (msg.sender === 'ai' && !msg.text && isLoading) {
                return (
                  <div key={msg.id} className="flex items-start gap-2.5 sm:gap-3 my-3.5 px-2 md:px-3 animate-fade-in">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Bot className="w-4 h-4 text-emerald-100" />
                    </div>
                    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-sans">AI is writing response</span>
                      <div className="flex items-center gap-1 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                />
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Sticky Bottom Input Bar */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
