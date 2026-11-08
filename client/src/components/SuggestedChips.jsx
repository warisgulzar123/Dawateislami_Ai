import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';

const DEFAULT_TOPICS = [
  'دعوتِ اسلامی کا قیام اور مقصد',
  'امیرِ اہل سنت کا مختصر تعارف',
  'مدنی چینل کے مقبول پروگرامات',
  'جامعۃ المدینہ اور تعلیمی شعبے',
  'FGRF کی فلاحی سرگرمیاں',
  'دار الافتاء اہلسنت سے شرعی رہنمائی'
];

/**
 * SuggestedChips Component
 * Renders quick interactive topic pills to guide conversation flow.
 */
export default function SuggestedChips({ onSelectTopic, customTopics = [] }) {
  const topicsToDisplay = customTopics.length > 0 ? customTopics : DEFAULT_TOPICS;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <div className="flex items-center gap-1.5 text-xs text-emerald-900/70 mb-2 font-medium">
        <Compass className="w-3.5 h-3.5 text-[#0F5132]" />
        <span>تجویز کردہ موضوعات / Suggested Topics:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {topicsToDisplay.map((topic, index) => (
          <button
            key={index}
            onClick={() => onSelectTopic(topic)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-[13px] font-medium bg-emerald-50/90 hover:bg-[#0F5132] text-[#0F5132] hover:text-white border border-emerald-200/80 hover:border-[#0F5132] transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer font-urdu"
          >
            <span>{topic}</span>
            <ArrowLeft className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}
