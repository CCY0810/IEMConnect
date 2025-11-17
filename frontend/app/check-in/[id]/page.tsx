"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const codeFromUrl = searchParams.get("code") || "";

  // Redirect to the new attendance page with code if provided
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (codeFromUrl) {
      router.push(`/attendance?code=${codeFromUrl}`);
    } else {
      router.push("/attendance");
    }
  }, [token, codeFromUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600">Redirecting to attendance page...</p>
    </div>
  );
}
