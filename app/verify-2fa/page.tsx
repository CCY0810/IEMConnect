"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Verify2FAPage() {
  const [totp_code, setTotpCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { verify2FA, error, clearError, isLoading, twoFAState, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!twoFAState.requires_2fa && !twoFAState.totp_secret) {
      router.push("/login")
    }
  }, [twoFAState, router])

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!totp_code || totp_code.length !== 6) {
      return
    }

    try {
      setIsSubmitting(true)
      await verify2FA(totp_code)
    } catch {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-900">
              <p className="font-medium mb-2">Your TOTP Secret:</p>
              <code className="block break-all text-xs bg-white p-2 rounded border border-blue-100 font-mono">
                {twoFAState.totp_secret}
              </code>
              <p className="text-xs mt-2 text-blue-800">
                Save this secret in your authenticator app (Google Authenticator, Authy, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="totp-code" className="text-sm font-medium">
                6-Digit Code
              </label>
              <Input
                id="totp-code"
                type="text"
                placeholder="000000"
                value={totp_code}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={isSubmitting || isLoading}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading || totp_code.length !== 6}>
              {isSubmitting ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
