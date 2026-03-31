import React from "react";
import { BookOpen, LogIn, User, Sparkles, Wand2 } from "lucide-react";

export default function LandingPage({
  handleGoogleSignIn,
  handleGuestSignIn,
  isSigningIn,
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        {/* Vibrant Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-500/40 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-sky-600/30 blur-[150px] mix-blend-screen animate-pulse-slower"></div>
        <div className="absolute top-[30%] left-[60%] w-[50vw] h-[50vw] rounded-full bg-purple-600/30 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-600/20 blur-[100px] mix-blend-screen animate-pulse-slower"></div>

        {/* Stardust Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="max-w-[460px] w-full bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 p-10 text-center space-y-10 animate-in relative z-10 transition-all duration-700 hover:shadow-sky-500/20 hover:border-white/30 group">
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-sky-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-spin-slow"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl text-sky-500 transform rotate-3 group-hover:rotate-12 transition-transform duration-500 relative z-10">
            <BookOpen size={40} className="drop-shadow-lg" />
            <Sparkles
              size={16}
              className="absolute -top-2 -right-2 text-sky-300 animate-pulse"
            />
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <h1 className="text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-sky-200 tracking-tight leading-tight">
            NovelQuest
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-2 max-w-[320px] mx-auto leading-relaxed">
            Your ultimate interactive novel companion. Immerse yourself in
            stories, explore deep character arcs, uncover hidden lore, and weave
            new narrative threads.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4 pt-6 border-t border-white/5">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full relative flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest overflow-hidden transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-white/10 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <LogIn size={18} className="text-sky-400" />
            {isSigningIn ? "Authenticating..." : "Sign In with Google"}
          </button>

          <button
            onClick={handleGuestSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-950/50 hover:bg-zinc-800/80 text-zinc-300 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 hover:text-white"
          >
            <User size={18} />
            {isSigningIn ? "..." : "Continue as Guest"}
          </button>
        </div>
      </div>

      <style>{`
        .animate-in { 
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        @keyframes slideUpFade { 
          from { opacity: 0; transform: translateY(40px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        .animate-pulse-slow {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-pulse-slower {
          animation: pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
