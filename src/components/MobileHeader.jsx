import React from "react";
import { BookOpen, Sun, Moon } from "lucide-react";

export default function MobileHeader({
  currentDocName,
  readProgress,
  theme,
  setTheme,
}) {
  return (
    <header className="md:hidden sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2 overflow-hidden max-w-[60%]">
        <BookOpen size={16} className="text-sky-500 shrink-0" />
        <h1 className="text-xs font-black uppercase tracking-widest truncate">
          {currentDocName}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-sky-500">
          {readProgress}%
        </span>
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="p-1 text-zinc-400"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div
        className="absolute bottom-0 left-0 h-[2.5px] bg-sky-500 transition-all duration-700 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
        style={{ width: `${readProgress}%` }}
      />
    </header>
  );
}
