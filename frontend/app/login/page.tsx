'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { token, tempToken } = useAuth();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else if (tempToken) {
      router.push('/verify-2fa');
    }
  }, [token, tempToken, router]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left Side - Logo/Branding */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-background">IC</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">IEM Connect</h1>
          <p className="text-muted-foreground text-lg">Secure Member Authentication</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-8">
        <LoginForm />
      </div>
    </div>
  );
}
