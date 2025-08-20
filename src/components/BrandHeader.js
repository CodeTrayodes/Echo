// src/components/BrandHeader.js - Minimal Header
import Link from "next/link";

export default function BrandHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          
          <span className="text-lg font-bold text-white">Echo</span>
          <span className="text-md text-purple-400">by PathAIde</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 text-xs text-white/60">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/interview" className="hover:text-white transition-colors">Interview</Link>
          <Link href="https://pathaide.com" className="hover:text-white transition-colors">PathAIde</Link>
        </nav>
      </div>
    </header>
  );
}