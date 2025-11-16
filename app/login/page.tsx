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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] relative">

      {/* Engineering soft blueprint background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1700&auto=format')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 w-full max-w-6xl px-8 grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-center">

          {/* Logo */}
          <img src="IEMConnect\public\iem-logo.jpg" alt="IEM Logo" className="w-40 mb-6 drop-shadow-md" />


          <h1 className="text-5xl font-extrabold text-[#0057A8] leading-tight">
            IEM UTM
          </h1>

          <h2 className="text-3xl font-bold text-[#7A0026] mt-1">
            Student Section
          </h2>

          <p className="mt-4 text-lg text-[#3A4A5F] max-w-md leading-relaxed">
            Official engineering membership portal for IEM UTM Student Section.
            Access exclusive tools, verification, and member services.
          </p>

          <div className="h-px w-48 bg-[#0057A8]/40 mt-8"></div>

          <p className="text-sm text-[#6C7A89] mt-4">
            Powered by engineering authenticity • Verified membership • Secure by design
          </p>
        </div>

        {/* RIGHT FORM CARD */}
        <div className="flex justify-center items-center">
          <div className="
            w-full max-w-md 
            bg-white
            border border-[#E2E8F0] 
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            rounded-2xl 
            p-10
          ">
            <h2 className="text-3xl font-semibold text-center text-[#0057A8] mb-2">
              Member Login
            </h2>

            <p className="text-center text-sm text-[#445569] mb-6">
              Sign in with your verified IEM credentials
            </p>

            <LoginForm />

            <p className="mt-6 text-center text-xs text-[#6C7A89]">
              Secure Access • IEM Verified • 2FA Enabled
            </p>

            <div className="mt-4 flex justify-center">
              <div className="h-1 w-20 bg-[#D4A626] rounded-full"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

