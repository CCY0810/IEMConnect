'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-background">IC</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">IEM Connect</h1>
        </div>

        {/* Registration Form */}
        <RegisterForm />
      </div>
    </div>
  );
}
