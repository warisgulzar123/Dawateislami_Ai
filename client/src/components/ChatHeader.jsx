import React from 'react';
import { Menu, Plus, Database, LogIn, LogOut, UserCheck } from 'lucide-react';

/**
 * ChatHeader Component
 * Clean, sober header with soft emerald accents, responsive mobile hamburger drawer trigger,
 * pure English UI labels, and seamless Admin/User authentication controls.
 */
export default function ChatHeader({
  onClearChat,
  messageCount,
  user,
  onOpenAuth,
  onLogout,
  onNavigateAdmin,
  onOpenDrawer
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2.5 sm:px-6 sm:py-3 transition-all shadow-2xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Hamburger Menu Button (for Mobile Drawer) */}
          <button
            onClick={onOpenDrawer}
            className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Icon */}
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white shadow-xs flex-shrink-0">
            <span className="text-lg select-none" role="img" aria-label="Crescent">
              🕌
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight font-sans">
                Dawat-e-Islami <span className="text-emerald-600 font-semibold">AI Assistant</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Online</span>
            </p>
          </div>
        </div>

        {/* Right: Actions (New Chat, Admin Dashboard, Auth) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Admin Dashboard Pill Button (Visible only to Admin) */}
          {user && user.role === 'admin' && (
            <button
              onClick={onNavigateAdmin}
              title="Open Admin Knowledge Dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* New Chat Button */}
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              title="Start a new conversation"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/90 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}

          {/* User Status / Login / Logout */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 rounded-xl">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium max-w-[90px] truncate">{user.name || user.email}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
