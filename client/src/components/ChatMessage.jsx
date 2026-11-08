import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Copy, Check, Sparkles } from 'lucide-react';

/**
 * Checks if a string primarily contains Arabic or Urdu Unicode characters
 */
const isUrduText = (text) => {
  if (!text) return false;
  const urduArabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return urduArabicRegex.test(text);
};

export default function ChatMessage({ message }) {
  const { sender, text, timestamp } = message;
  const isAI = sender === 'ai';
  const displayText =
    isAI && (!text || !text.trim())
      ? '⚠️ معذرت، سرور سے جواب موصول نہیں ہو سکا۔ براہ کرم دوبارہ کوشش فرمائیں۔ (Empty response)'
      : text;
  const isUrdu = isUrduText(displayText);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex items-start gap-2.5 sm:gap-3 w-full my-3.5 px-2 md:px-3 transition-all duration-200 ${
        isAI ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs mt-0.5">
          <Sparkles className="w-4 h-4 text-emerald-100" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[90%] sm:max-w-[82%] md:max-w-[76%] rounded-2xl p-3.5 sm:p-4 transition-all ${
          isAI
            ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
            : 'bg-emerald-600 text-white shadow-xs rounded-tr-xs'
        }`}
      >
        {/* Header inside Bubble */}
        <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100">
          <span
            className={`text-[11px] font-semibold tracking-wide uppercase ${
              isAI ? 'text-emerald-700' : 'text-emerald-100'
            }`}
          >
            {isAI ? 'Dawat-e-Islami AI' : 'You'}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] ${
                isAI ? 'text-slate-400' : 'text-emerald-200'
              }`}
            >
              {timestamp || 'Just now'}
            </span>

            {isAI && (
              <button
                onClick={handleCopy}
                title="Copy response"
                className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div
          dir={isUrdu ? 'rtl' : 'ltr'}
          className={`text-sm md:text-[15px] prose prose-sm max-w-none break-words ${
            isUrdu
              ? 'font-urdu leading-loose text-right'
              : 'leading-relaxed text-left'
          } ${
            isAI
              ? 'prose-emerald prose-headings:text-slate-900 prose-p:text-slate-800 prose-li:text-slate-800'
              : 'text-white prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white'
          }`}
        >
          {isAI ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="my-2 space-y-1 list-disc list-inside">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 space-y-1 list-decimal list-inside">{children}</ol>
                ),
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                strong: ({ children }) => (
                  <strong className={isAI ? 'font-bold text-emerald-800' : 'font-bold text-white'}>
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-r-4 border-emerald-500 pr-3 my-2 italic bg-emerald-50/60 py-1 rounded text-slate-700">
                    {children}
                  </blockquote>
                )
              }}
            >
              {displayText}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{displayText}</p>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shadow-2xs mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
