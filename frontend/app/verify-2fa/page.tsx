'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import api from '@/lib/api';

export default function Verify2FAPage() {
  const router = useRouter();
  const { tempToken, token, verify2FA } = useAuth();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else if (!tempToken) {
      router.push('/login');
    }
  }, [tempToken, token, router]);

  if (!tempToken) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    try {
      const res = await api.post(
        '/auth/verify-2fa',
        { code },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      const { accessToken, user } = res.data;
      verify2FA(user, accessToken);
      router.push('/dashboard');
    } catch (err) {
      // Optionally display an error message/toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-background">IC</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">IEM Connect</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit code sent to your email
            </p>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button type="submit" className="w-full" disabled={code.length !== 6}>
            Verify
          </Button>
        </form>
      </div>
    </div>
  );
}