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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        
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

    <div className="absolute inset-0 bg-white/45"></div>


      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-300/15 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-6xl px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        <div className="hidden lg:flex flex-col justify-center space-y-8">
          
          {/*LOGO*/}
          <div className="flex items-center space-x-6 mb-10">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/70">
              <img
                src="/iem-logo.jpg"
                alt="IEM Logo"
                className="w-24 h-24 object-contain drop-shadow-md"
              />
            </div>
              
            <div className="h-20 w-px bg-blue-300/70"></div>
            
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-700 tracking-wider">
                INSTITUTION OF ENGINEERS, MALAYSIA
              </div>
              <div className="text-md font-semibold text-red-600">
                UTM STUDENT SECTION
              </div>
            </div>
          </div>


          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                IEM
              </span>
              <br />
              <span className="text-gray-900">Connect</span>
            </h1>
            
            <div className="flex items-center space-x-3">
              <div className="w-70 h-px bg-gradient-to-r from-blue-600 to-transparent"></div>
              
            </div>
          </div>

          {/*Description*/}
          <p className="text-lg text-gray-700 leading-relaxed max-w-lg">
            Login to manage your membership, register for events, and access all essential IEM Connect services with secure authentication.
          </p>

          {/*Feature highlights*/}
          <div className="space-y-3">
            {[
              "✓ 2-Factor Authentication secured",
              "✓ Real-time member verification", 
              "✓ Encrypted data transmission",
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          
        </div>

        <div className="flex justify-center items-center">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-lg border border-white/60 rounded-2xl shadow-2xl shadow-blue-500/10 p-12">
              
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Member Login
                </h2>
                <p className="text-gray-500 font-medium">
                  Access your engineering portal
                </p>
              </div>

              {/* Login Form */}
              <LoginForm />

              <div className="mt-8 pt-6 border-t border-gray-200/60">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Only For Verified Member</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Secured Login</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}