import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

export default function Notification({ notification, setNotification }) {
  if (!notification) return null;
  return (
    <div
      className={`fixed bottom-20 md:bottom-10 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xs p-4 rounded-3xl shadow-2xl z-[200] flex items-center gap-3 animate-in border ${notification.type === "error" ? "bg-red-600 text-white" : "bg-zinc-900 text-white"}`}
    >
      {notification.type === "error" ? (
        <AlertCircle size={20} />
      ) : (
        <Check size={20} />
      )}
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {notification.text}
      </span>
      <button
        onClick={() => setNotification(null)}
        className="ml-auto opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  );
}
