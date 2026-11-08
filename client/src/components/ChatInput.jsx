import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';

/**
 * ChatInput Component
 * Fixed bottom input container with backdrop blur, rounded pill input bar,
 * Urdu voice input support (ur-PK), and soft emerald send styling.
 */
export default function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API for Urdu (ur-PK)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ur-PK';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission required for voice input.');
        } else if (event.error !== 'no-speech') {
          setSpeechError('Could not recognize voice. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');
    setSpeechError('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Auto-resize input height
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2.5 sm:px-6 sm:py-3.5 transition-all z-20">
      <div className="max-w-4xl mx-auto">
        {speechError && (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-2 font-sans animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
            <span>{speechError}</span>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-50/90 border border-slate-200 focus-within:border-emerald-600 focus-within:ring-3 focus-within:ring-emerald-600/10 rounded-2xl p-1.5 sm:p-2 transition-all shadow-2xs">
          {/* Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            disabled={isLoading}
            title={isListening ? 'Listening... click to stop' : 'Voice input (Urdu)'}
            className={`relative p-2 rounded-xl transition-all flex-shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            dir="auto"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isListening
                ? 'Listening to Urdu voice input...'
                : 'Type your message or question here... (e.g. جامعۃ المدینہ میں داخلہ)'
            }
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-hidden resize-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 py-1.5 sm:py-2 px-1 max-h-32 leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            title="Send Message"
            className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 transition-all duration-150 cursor-pointer ${
              input.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95'
                : 'bg-slate-200/80 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-2 font-sans">
          Official Dawat-e-Islami AI Assistant • For formal legal fatwas, consult Dar-ul-Ifta Ahlesunnat.
        </p>
      </div>
    </div>
  );
}
