"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { token, tempToken } = useAuth();

  useEffect(() => {
    if (token) router.push("/dashboard");
    else if (tempToken) router.push("/verify-2fa");
  }, [token, tempToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "url('/login-page-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",     
        transform: "scale(1.05)",  
      }}
    ></div>

    <div className="absolute inset-0 bg-slate-900/60"></div>

    {/* Enhanced floating elements - Dark theme with gradients */}
    <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
    <div className="absolute top-1/4 right-20 w-48 h-48 bg-gradient-to-br from-blue-500/8 to-cyan-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
    <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-blue-600/6 to-indigo-600/6 rounded-full blur-2xl animate-pulse delay-500"></div>
    <div className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse delay-1500"></div>

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">

          {/* Left Side - Branding & Info */}
          <div className="hidden lg:flex flex-col justify-center space-y-8 order-2 lg:order-1">
            
            {/* Enhanced Logo Section */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="p-4 bg-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700 hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300">
                <img
                  src="/iem-logo.jpg"
                  alt="IEM Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
                />
              </div>
                
              <div className="h-16 w-px bg-gradient-to-b from-indigo-400 to-transparent"></div>
              
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold text-indigo-400 tracking-wider leading-tight">
                  INSTITUTION OF ENGINEERS, MALAYSIA
                </div>
                <div className="text-sm sm:text-base font-bold text-red-400">
                  UTM STUDENT SECTION
                </div>
              </div>
            </div>

            {/* Enhanced Title */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  IEM
                </span>
                <br />
                <span className="text-slate-100 drop-shadow-sm">
                  Connect
                </span>
              </h1>
              
              <div className="flex items-center space-x-3">
                <div className="w-16 h-px bg-gradient-to-r from-indigo-400 to-transparent"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg">
              Login to manage your membership, register for events, and access all essential IEM Connect services with secure authentication.
            </p>

            {/* Enhanced Feature Highlights */}
            <div className="space-y-3">
              {[
                "✓ 2-Factor Authentication secured",
                "✓ Real-time member verification", 
                "✓ Encrypted data transmission",
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 text-slate-300 group">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:bg-emerald-300 transition-colors duration-200"></div>
                  <span className="text-sm sm:text-base font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Mobile Logo - Show on small screens */}
            <div className="lg:hidden flex justify-center mt-8">
              <div className="p-3 bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700">
                
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center items-center order-1 lg:order-2">
            <div className="w-full max-w-md">
              <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl shadow-indigo-500/20 p-8 sm:p-10 lg:p-12 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300">
                
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6 hover:scale-105 transition-transform duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                    Member Login
                  </h2>
                  <p className="text-slate-400 font-medium text-sm sm:text-base">
                    Access your engineering portal
                  </p>
                </div>

                {/* Login Form */}
                <LoginForm />

                <div className="mt-8 pt-6 border-t border-slate-600/60">
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>Only For Verified Member</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>Secured Login</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Title - Show on small screens */}
              <div className="lg:hidden text-center mt-6">
                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                  <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    IEM Connect
                  </span>
                </h1>
                <p className="text-slate-400 text-sm">
                  Engineering Excellence Platform
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}