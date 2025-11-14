"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import api from "@/lib/api";

export default function Verify2FAPage() {
  const router = useRouter();
  const { tempToken, token, verify2FA } = useAuth();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (token) router.push("/dashboard");
    else if (!tempToken) router.push("/login");
  }, [tempToken, token, router]);

  if (!tempToken) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    try {
      const res = await api.post(
        "/auth/verify-2fa",
        { code },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      const { accessToken, user } = res.data;
      verify2FA(user, accessToken);
      router.push("/dashboard");
    } catch (err) {
      // error toast here if needed
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      <div
        className="absolute inset-0 bg-fixed"
        style={{
          backgroundImage: "url('/main-page-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      <div className="absolute inset-0 bg-white/45"></div>


      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl"></div>


      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg border border-white/60 rounded-2xl shadow-2xl shadow-blue-500/10 p-10">

          <div className="text-center mb-8 flex flex-col items-center space-y-4">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/60">
              <img
                src="/iem-logo.jpg"
                alt="IEM Logo"
                className="w-20 h-20 object-contain drop-shadow"
              />
            </div>

            <h1 className="text-3xl font-bold text-blue-900">IEM CONNECT</h1>
            <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
              Enter the 6-digit verification code sent to your registered email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup className="flex gap-3">
                  <InputOTPSlot index={0} className="w-12 h-12 rounded-xl text-lg" />
                  <InputOTPSlot index={1} className="w-12 h-12 rounded-xl text-lg" />
                  <InputOTPSlot index={2} className="w-12 h-12 rounded-xl text-lg" />
                  <InputOTPSlot index={3} className="w-12 h-12 rounded-xl text-lg" />
                  <InputOTPSlot index={4} className="w-12 h-12 rounded-xl text-lg" />
                  <InputOTPSlot index={5} className="w-12 h-12 rounded-xl text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>


            {/*Verify Button*/}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold"
              disabled={code.length !== 6}
            >
              Verify
            </Button>
          </form>

          {/* Security Note */}
          <p className="text-center mt-6 text-xs text-gray-500">
            This verification ensures your account security.
          </p>
        </div>
      </div>
    </div>
  );
}
