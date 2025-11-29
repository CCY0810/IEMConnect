"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateMembershipNumber,
  validateMatricNumber,
  validateFaculty,
  validateConfirmPassword,
} from "@/lib/validation";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Field-level errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  // Redirect to login page after 3 seconds on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) newErrors.name = nameValidation.error || "";
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error || "";
    
    const membershipValidation = validateMembershipNumber(membershipNumber);
    if (!membershipValidation.isValid) newErrors.membershipNumber = membershipValidation.error || "";
    
    const matricValidation = validateMatricNumber(matricNumber);
    if (!matricValidation.isValid) newErrors.matricNumber = matricValidation.error || "";
    
    const facultyValidation = validateFaculty(faculty);
    if (!facultyValidation.isValid) newErrors.faculty = facultyValidation.error || "";
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error || "";
    
    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmPasswordValidation.isValid) newErrors.confirmPassword = confirmPasswordValidation.error || "";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate single field
  const validateField = (fieldName: string, value: string) => {
    let validation;
    
    switch (fieldName) {
      case "name":
        validation = validateName(value);
        break;
      case "email":
        validation = validateEmail(value);
        break;
      case "membershipNumber":
        validation = validateMembershipNumber(value);
        break;
      case "matricNumber":
        validation = validateMatricNumber(value);
        break;
      case "faculty":
        validation = validateFaculty(value);
        break;
      case "password":
        validation = validatePassword(value);
        break;
      case "confirmPassword":
        validation = validateConfirmPassword(password, value);
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
    setTouched({
      name: true,
      email: true,
      membershipNumber: true,
      matricNumber: true,
      faculty: true,
      password: true,
      confirmPassword: true,
    });

    // Validate form
    if (!validateForm()) {
      setError("Please fix all errors before submitting");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        membership_number: membershipNumber.trim(),
        matric_number: matricNumber.trim(),
        faculty,
      });

      // Show success message
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          (err instanceof Error ? err.message : "Registration failed")
      );
      setIsLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      name.trim() !== "" &&
      email.trim() !== "" &&
      membershipNumber.trim() !== "" &&
      matricNumber.trim() !== "" &&
      faculty !== "" &&
      password !== "" &&
      confirmPassword !== "" &&
      Object.keys(errors).length === 0
    );
  };

  // Show success message after registration
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-center">
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>You will be redirected to the login page shortly...</p>
            </div>
            <p className="text-sm text-muted-foreground">
              If you are not redirected automatically,{" "}
              <Link href="/login" className="text-primary hover:underline">
                click here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Full Name *
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched.name) validateField("name", e.target.value);
            }}
            onBlur={() => {
              setTouched(prev => ({ ...prev, name: true }));
              validateField("name", name);
            }}
            required
            disabled={isLoading}
            className={touched.name && errors.name ? "border-red-500" : ""}
          />
          {touched.name && errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

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
            htmlFor="membershipNumber"
            className="block text-sm font-medium mb-1"
          >
            Membership Number *
          </label>
          <Input
            id="membershipNumber"
            type="text"
            value={membershipNumber}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setMembershipNumber(value);
              if (touched.membershipNumber) validateField("membershipNumber", value);
            }}
            onBlur={() => {
              setTouched(prev => ({ ...prev, membershipNumber: true }));
              validateField("membershipNumber", membershipNumber);
            }}
            required
            disabled={isLoading}
            maxLength={6}
            placeholder="6 characters"
            className={touched.membershipNumber && errors.membershipNumber ? "border-red-500" : ""}
          />
          {touched.membershipNumber && errors.membershipNumber && (
            <p className="text-sm text-red-500 mt-1">{errors.membershipNumber}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="matricNumber"
            className="block text-sm font-medium mb-1"
          >
            Matric Number *
          </label>
          <Input
            id="matricNumber"
            type="text"
            value={matricNumber}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setMatricNumber(value);
              if (touched.matricNumber) validateField("matricNumber", value);
            }}
            onBlur={() => {
              setTouched(prev => ({ ...prev, matricNumber: true }));
              validateField("matricNumber", matricNumber);
            }}
            required
            disabled={isLoading}
            maxLength={9}
            placeholder="9 characters"
            className={touched.matricNumber && errors.matricNumber ? "border-red-500" : ""}
          />
          {touched.matricNumber && errors.matricNumber && (
            <p className="text-sm text-red-500 mt-1">{errors.matricNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="faculty" className="block text-sm font-medium mb-1">
            Faculty *
          </label>
          <select
            id="faculty"
            value={faculty}
            onChange={(e) => {
              setFaculty(e.target.value);
              if (touched.faculty) validateField("faculty", e.target.value);
            }}
            onBlur={() => {
              setTouched(prev => ({ ...prev, faculty: true }));
              validateField("faculty", faculty);
            }}
            required
            disabled={isLoading}
            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              touched.faculty && errors.faculty ? "border-red-500" : "border-input"
            }`}
          >
            <option value="">Select your faculty</option>
            <option value="Azman Hashim International Business School (AHIBS)">
              Azman Hashim International Business School (AHIBS)
            </option>
            <option value="Faculty of Artificial Intelligence (FAI)">
              Faculty of Artificial Intelligence (FAI)
            </option>
            <option value="Faculty of Built Environment and Surveying">
              Faculty of Built Environment and Surveying
            </option>
            <option value="Faculty of Chemical & Energy Engineering">
              Faculty of Chemical & Energy Engineering
            </option>
            <option value="Faculty of Computing">Faculty of Computing</option>
            <option value="Faculty of Educational Sciences and Technology (FEST)">
              Faculty of Educational Sciences and Technology (FEST)
            </option>
            <option value="Faculty of Electrical Engineering">
              Faculty of Electrical Engineering
            </option>
            <option value="Faculty of Management">Faculty of Management</option>
            <option value="Faculty of Mechanical Engineering">
              Faculty of Mechanical Engineering
            </option>
            <option value="Faculty of Science">Faculty of Science</option>
            <option value="Faculty of Social Sciences and Humanities">
              Faculty of Social Sciences and Humanities
            </option>
            <option value="Malaysia-Japan International Institute of Technology (MJIIT)">
              Malaysia-Japan International Institute of Technology (MJIIT)
            </option>
          </select>
          {touched.faculty && errors.faculty && (
            <p className="text-sm text-red-500 mt-1">{errors.faculty}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password *
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) validateField("password", e.target.value);
                // Re-validate confirm password if it's been touched
                if (touched.confirmPassword) validateField("confirmPassword", confirmPassword);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, password: true }));
                validateField("password", password);
              }}
              required
              disabled={isLoading}
              minLength={6}
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
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) validateField("confirmPassword", e.target.value);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, confirmPassword: true }));
                validateField("confirmPassword", confirmPassword);
              }}
              required
              disabled={isLoading}
              className={touched.confirmPassword && errors.confirmPassword ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
