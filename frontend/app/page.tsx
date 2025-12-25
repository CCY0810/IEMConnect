"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden text-slate-100 bg-slate-950">
      
      {/* 1. OPTIMIZED BACKGROUND LAYER */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/welcome_page_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // This ensures the image stays crisp and fills the viewport perfectly
          width: '100vw',
          height: '100vh'
        }}
      >
        {/* Professional Gradient Overlay: Darkens the top for header and bottom for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/80 via-slate-900/70 to-slate-950" />
        
        
      </div>

      {/* 2. RESPONSIVE HEADER */}
      <header className="fixed top-0 w-full z-[100] bg-slate-900/55 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-4 sm:px-8 h-20 flex items-center justify-end">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              asChild 
              variant="ghost" 
              className="text-slate-200 hover:text-white hover:bg-white/10 font-medium px-4 sm:px-6 h-10"
            >
              <Link href="/register">Register</Link>
            </Button>

            <Button 
              asChild 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-8 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 h-10"
            >
              <Link href="/login" className="flex items-center gap-2">
                <LogIn size={16} />
                Login
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center relative z-10 pt-20">
        <section className="w-full py-16 md:py-24 flex items-center justify-center">
          
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center">
              
              {/* LOGO ABOVE TITLE */}
              <div className="mb-8 md:mb-12 group">
                <div className="bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 transition-transform group-hover:scale-105 border-4 border-white/10">
                  <img src="/iem-logo.jpg" alt="IEM UTM Logo" className="object-contain w-full h-full" />
                </div>
              </div>

              <div className="space-y-6 max-w-4xl">
                <div className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-2 uppercase tracking-wider">
                  Official IEM UTM Student Section Portal
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-xl">
                  IEM Connect: Streamlining <br className="hidden md:block" /> 
                  Engineering Excellence
                </h1>

                <p className="mx-auto max-w-[700px] text-slate-200 text-base md:text-lg font-medium drop-shadow-md opacity-90">
                  The integrated platform for professional event tracking, 
                  automated attendance management, and seamless digital 
                  certification for the next generation of engineers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 mt-10 md:mt-14">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 rounded-xl shadow-xl transition-all hover:scale-105 font-bold text-lg"
                >
                  <Link href="/register" className="flex items-center gap-2">
                    Get Started <ArrowRight size={20} />
                  </Link>
                </Button>

               
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* 4. FOOTER */}
      <footer className="py-8 bg-slate-950/90 backdrop-blur-md border-t border-white/5 relative z-10">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
            © {new Date().getFullYear()} IEM UTM Student Section
          </p>
          <div className="flex items-center space-x-6 text-sm font-medium text-slate-400">
            <Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
