import React from "react";

export default function NavItem({
  id,
  icon: Icon,
  label,
  activeTab,
  isSidebarOpen,
  setActiveTab,
  setIsSidebarOpen,
}) {
  return (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(true);
      }}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all
        ${activeTab === id && isSidebarOpen ? "text-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-inner" : "text-zinc-400"}`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-black uppercase tracking-tight">
        {label}
      </span>
    </button>
  );
}
