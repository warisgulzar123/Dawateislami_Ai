import React from 'react';
import {
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Smartphone,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * Data-grounded suggested questions strictly based on stored Dawat-e-Islami departments:
 * 1. Jamia-tul-Madinah (Education)
 * 2. FGRF (Relief & Welfare)
 * 3. Maktaba-tul-Madinah (Books & Publications)
 * 4. IT Department (Apps & Digital Services)
 */
const DATA_GROUNDED_QUESTIONS = [
  {
    id: 'jamia_admission',
    tag: 'Education',
    question: 'جامعۃ المدینہ میں داخلے کا کیا طریقہ کار ہے؟',
    icon: GraduationCap
  },
  {
    id: 'fgrF_relief',
    tag: 'Welfare',
    question: 'ایف جی آر ایف (FGRF) کے تحت کون سے امدادی کام کیے جاتے ہیں؟',
    icon: HeartHandshake
  },
  {
    id: 'maktaba_order',
    tag: 'Books',
    question: 'مکتبۃ المدینہ سے کتب آن لائن آرڈر کرنے کا طریقہ کیا ہے؟',
    icon: BookOpen
  },
  {
    id: 'it_apps',
    tag: 'Digital Apps',
    question: 'دعوتِ اسلامی کے آفیشل موبائل ایپس کون سی ہیں؟',
    icon: Smartphone
  }
];

/**
 * SuggestedQuestions Component
 * Compact, mobile-first pill-shaped chips with smooth flex-wrap layout.
 * Rendered strictly on the empty landing state and permanently auto-hidden on chat start.
 */
export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="w-full max-w-xl mx-auto my-auto py-8 px-4 flex flex-col items-center animate-fade-in text-center">
      {/* Sleek Hero Icon */}
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/90 flex items-center justify-center shadow-xs mb-3">
        <Sparkles className="w-6 h-6 text-emerald-600" />
      </div>

      {/* Main Title & Subtitle */}
      <h2 className="text-lg md:text-xl font-bold text-slate-800 font-sans tracking-tight mb-1">
        Welcome to Dawat-e-Islami AI
      </h2>
      <p className="text-xs text-slate-500 max-w-sm mb-5 font-sans leading-relaxed">
        Select a suggested topic below or type your question to start exploring verified knowledge:
      </p>

      {/* Compact Pill-Shaped Chips Container */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
        {DATA_GROUNDED_QUESTIONS.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectQuestion(item.question)}
              className="group inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full text-xs font-medium border border-emerald-200/90 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            >
              <IconComponent className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-urdu leading-normal text-right">{item.question}</span>
              <ArrowRight className="w-3 h-3 text-emerald-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
