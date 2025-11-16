'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) router.push('/dashboard');
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

          {/*Logo*/}
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

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Create Your
              </span>
              <br />
              <span className="text-gray-900">IEM Connect Account</span>
            </h1>

            <div className="flex items-center space-x-3">
              <div className="w-70 h-px bg-gradient-to-r from-blue-600 to-transparent"></div>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-700 leading-relaxed max-w-lg">
            Register to access verified membership features, event participation, 
            and all IEM Connect engineering services through a secure platform.
          </p>

          <div className="space-y-3">
            {[
              "✓ Only For Verified Member",
              "✓ Secure password encryption",
              "✓ Email + 2FA verification ready",
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/*Registration block*/}
        <div className="flex justify-center items-center">
          <div className="w-full max-w-md">

            <div className="bg-white/80 backdrop-blur-lg border border-white/60 rounded-2xl shadow-2xl shadow-blue-500/10 p-12">

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  Registration will be reviewed and verified by Admin
                </p>
              </div>

              {/* Registration Form */}
              <RegisterForm />

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

