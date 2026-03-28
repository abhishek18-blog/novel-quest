import React from 'react';
import { BookOpen } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 font-sans">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2500&auto=format&fit=crop')`,
        }}
      />
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-24 h-24 bg-amber-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-500/40 transform transition-transform hover:scale-105 duration-300">
          <BookOpen size={48} className="text-white" />
        </div>

        <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight">
          Novel <span className="text-amber-500">Quest</span>
        </h1>

        <p className="text-lg md:text-2xl text-zinc-300 mb-12 font-medium max-w-2xl leading-relaxed">
          Embark on your scholarly journey. Intelligently extract, deeply explore, and immerse yourself in your manuscripts.
        </p>

        <button
          onClick={onGetStarted}
          className="px-10 py-5 bg-amber-500 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
