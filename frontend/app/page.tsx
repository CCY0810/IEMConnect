"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
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

      <div className="absolute inset-0 bg-white/55 "></div>

      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl"></div>


      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">

        {/*LOGO*/}
        <div className="mb-10 flex flex-col items-center space-y-4">
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/70">
            <img
              src="/iem-logo.jpg"
              alt="IEM Logo"
              className="w-28 h-28 object-contain drop-shadow-md"
            />
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            IEM Connect
          </h1>

          <p className="text-black-800 text-lg max-w-md leading-relaxed font-bold">
            The official secure authentication gateway for IEM UTM Student
            Section members.
          </p>
        </div>

        {/*BUTTONS*/}
        <div className="flex flex-col gap-5 w-full mt-4">
          <Button asChild className="py-5 text-lg font-semibold shadow-md">
            <Link href="/login">Login</Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="py-5 text-lg font-semibold border-2 border-blue-600 text-blue-700 hover:bg-blue-50"
          >
            <Link href="/register">Register</Link>
          </Button>
        </div>

        {/*Footer*/}
        <p className="mt-10 text-xs text-gray-800">
          © 2025 IEM UTM Student Section — Engineering the Future
        </p>
      </div>
    </div>
  );
}

