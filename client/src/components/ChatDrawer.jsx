import React from 'react';
import {
  X,
  Plus,
  MessageSquare,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Smartphone,
  ShieldAlert,
  Database,
  LogIn,
  LogOut,
  UserCheck,
  ExternalLink
} from 'lucide-react';

const DEPARTMENTS = [
  {
    name: 'Jamia-tul-Madinah',
    nameUrdu: 'جامعۃ المدینہ (تعلیم)',
    icon: GraduationCap,
    query: 'جامعۃ المدینہ میں داخلے کی شرائط اور تعلیمی نظام کیا ہے؟'
  },
  {
    name: 'FGRF Welfare',
    nameUrdu: 'ایف جی آر ایف (امدادی سرگرمیاں)',
    icon: HeartHandshake,
    query: 'ایف جی آر ایف (FGRF) کے تحت کون کون سے فلاحی کام کیے جاتے ہیں؟'
  },
  {
    name: 'Maktaba-tul-Madinah',
    nameUrdu: 'مکتبۃ المدینہ (کتب و اشاعت)',
    icon: BookOpen,
    query: 'مکتبۃ المدینہ سے کتب آن لائن آرڈر کرنے کا طریقہ کیا ہے؟'
  },
  {
    name: 'IT Department',
    nameUrdu: 'آئی ٹی ڈیپارٹمنٹ (موبائل ایپس)',
    icon: Smartphone,
    query: 'دعوتِ اسلامی کے آفیشل موبائل ایپس کون سی ہیں؟'
  },
  {
    name: 'Dar-ul-Ifta',
    nameUrdu: 'دار الافتاء اہلسنت (شرعی رہنمائی)',
    icon: ShieldAlert,
    query: 'دار الافتاء اہلسنت سے رابطہ اور فتویٰ حاصل کرنے کا کیا طریقہ ہے؟'
  }
];

export default function ChatDrawer({
  isOpen,
  onClose,
  onNewChat,
  onSelectTopic,
  user,
  onOpenAuth,
  onLogout,
  onNavigateAdmin,
  messageCount
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🕌
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Dawat-e-Islami</h2>
              <p className="text-[11px] text-slate-500">Official AI Knowledge</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Start New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation & Department Topics List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          <div>
            <p className="px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Explore Departments
            </p>
            <div className="space-y-1">
              {DEPARTMENTS.map((dept, index) => {
                const IconComponent = dept.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      onSelectTopic(dept.query);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 transition-colors group cursor-pointer border border-transparent hover:border-emerald-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100/80 transition-colors">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium truncate">{dept.name}</p>
                        <p className="text-[10px] text-slate-400 font-urdu truncate">{dept.nameUrdu}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Official Portals
            </p>
            <div className="space-y-1">
              <a
                href="https://www.dawateislami.net"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span>Main Website</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
              <a
                href="https://www.fgrf.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span>FGRF Global Relief</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
              <a
                href="https://maktabatulmadinah.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span>Maktaba Online Store</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Footer: User Profile & Admin Panel */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
          {user && user.role === 'admin' && (
            <button
              onClick={() => {
                onNavigateAdmin();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Knowledge Dashboard</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-800 truncate">{user.name || user.email}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">{user.role}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sign In / Admin Access</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
