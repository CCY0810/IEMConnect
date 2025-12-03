"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import api from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { validateEmail, validatePassword } from "@/lib/validation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { login } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error || "";
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error || "";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (fieldName: string, value: string) => {
    let validation;
    
    switch (fieldName) {
      case "email":
        validation = validateEmail(value);
        break;
      case "password":
        validation = validatePassword(value);
        break;
      default:
        return;
    }
    
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.error || "" }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate form
    if (!validateForm()) {
      setError("Please fix all errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;

      // Handle 2FA flow
      if (data.tempToken) {
        login(data.tempToken);
        router.push("/verify-2fa");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          (err instanceof Error ? err.message : "Login failed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      email.trim() !== "" &&
      password !== "" &&
      Object.keys(errors).length === 0
    );
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Mobile Logo */}
      <div className="md:hidden text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-background">IC</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">IEM Connect</h1>
      </div>

      <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Sign in to your account
        </h2>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear general error when user starts typing
                if (touched.email) validateField("email", e.target.value);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, email: true }));
                validateField("email", email);
              }}
              required
              disabled={isLoading}
              className={touched.email && errors.email ? "border-red-500" : ""}
            />
            {touched.email && errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password *
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(""); // Clear general error when user starts typing
                  if (touched.password) validateField("password", e.target.value);
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }));
                  validateField("password", password);
                }}
                required
                disabled={isLoading}
                className={touched.password && errors.password ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {touched.password && errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
            <div className="text-right mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
