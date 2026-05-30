"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { useRegister } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agree: z.literal(true, {
    message: "You must agree to the Terms of Service",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const extractErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (data.error?.details && typeof data.error.details === "object") {
    const msgs = Object.values(data.error.details).flat();
    if (msgs.length > 0) return msgs.join(", ");
  }

  if (data.details && typeof data.details === "object") {
    const msgs = Object.values(data.details).flat();
    if (msgs.length > 0) return msgs.join(", ");
  }

  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (typeof data.error?.message === "string") return data.error.message;

  return fallback;
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name.trim(),
    });
  };

  const isSubmitting = registerMutation.isPending;

  // Calculate password strength (0 to 4 segments)
  const calculateStrength = (pass: string): number => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = calculateStrength(passwordValue);

  // Get color for segments
  const getSegmentColor = (index: number) => {
    if (index >= strengthScore) {
      return "bg-[var(--surface-3)] dark:bg-[var(--surface-2)]"; // empty segment
    }
    if (strengthScore === 1) return "bg-red"; // red alert
    if (strengthScore <= 3) return "bg-amber"; // amber warning
    return "bg-green"; // strong green
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[20px]"
    >
      {/* 1. Logo area */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--primary))] shadow-sm">
          <span className="text-[11px] font-bold text-white leading-none">S</span>
        </div>
        <span className="text-[18px] font-bold tracking-tight text-foreground font-sans">
          Sentient
        </span>
      </div>

      {/* 2 & 3. Header & Sub */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-[var(--foreground-2)] font-sans">
          Start your free 14-day trial
        </p>
      </div>

      {/* 4. Google OAuth Button */}
      <button
        type="button"
        onClick={() => authService.googleLogin()}
        className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-card text-foreground hover:bg-[var(--surface-3)] text-sm font-medium transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.5l3.87 3C6.24 7.65 8.89 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.3 3.48l3.57 2.77c2.09-1.93 3.29-4.77 3.29-8.4z"
          />
          <path
            fill="#FBBC05"
            d="M5.29 14.5c-.25-.75-.39-1.56-.39-2.4s.14-1.65.39-2.4L1.42 6.7C.51 8.5 0 10.5 0 12.5s.51 4 1.42 5.8l3.87-3z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.57-2.77c-.99.66-2.23 1.06-4.39 1.06-3.11 0-5.76-2.61-6.71-5.46l-3.87 3C3.37 20.35 7.35 23 12 23z"
          />
        </svg>
        Continue with Google
      </button>

      {/* 5. Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-[var(--border)] dark:bg-[rgba(116,149,155,0.18)]" />
        <span className="px-3 text-[11px] font-mono text-[var(--foreground-3)] uppercase tracking-wider">
          or
        </span>
        <div className="flex-1 h-px bg-[var(--border)] dark:bg-[rgba(116,149,155,0.18)]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]"
          >
            Full name
          </label>
          <input
            {...register("name")}
            id="name"
            type="text"
            placeholder="Mohammad Habib"
            className="w-full bg-[var(--surface-2)]/60 dark:bg-[var(--surface-2)]/40 border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] focus:border-mist-teal focus:ring-3 focus:ring-mist-teal/15 transition-all text-foreground placeholder-[var(--foreground-3)] rounded-lg px-3.5 py-2.5 text-sm outline-none"
          />
          {errors.name && (
            <p className="text-xs text-[var(--red)] font-sans mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]"
          >
            Work email
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="you@company.com"
            className="w-full bg-[var(--surface-2)]/60 dark:bg-[var(--surface-2)]/40 border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] focus:border-mist-teal focus:ring-3 focus:ring-mist-teal/15 transition-all text-foreground placeholder-[var(--foreground-3)] rounded-lg px-3.5 py-2.5 text-sm outline-none"
          />
          {errors.email && (
            <p className="text-xs text-[var(--red)] font-sans mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]"
          >
            Password
          </label>
          <div className="relative">
            <input
              {...register("password", {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full bg-[var(--surface-2)]/60 dark:bg-[var(--surface-2)]/40 border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] focus:border-mist-teal focus:ring-3 focus:ring-mist-teal/15 transition-all text-foreground placeholder-[var(--foreground-3)] rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-2)] hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Password Strength Indicator (4 segments) */}
          <div className="flex gap-1.5 mt-2 h-1 w-full">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${getSegmentColor(idx)}`}
              />
            ))}
          </div>
          {passwordValue && (
            <div className="flex justify-between items-center text-[10px] text-[var(--foreground-2)] font-mono uppercase tracking-wider mt-1">
              <span>Complexity</span>
              <span
                className={
                  strengthScore === 1
                    ? "text-red"
                    : strengthScore <= 3
                      ? "text-amber"
                      : "text-green"
                }
              >
                {strengthScore === 0 && "none"}
                {strengthScore === 1 && "weak"}
                {strengthScore === 2 && "fair"}
                {strengthScore === 3 && "good"}
                {strengthScore === 4 && "strong"}
              </span>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-[var(--red)] font-sans mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Terms row */}
        <div className="space-y-1.5 pt-2">
          <label className="flex items-start gap-2.5 text-[13px] text-[var(--foreground-2)] font-sans cursor-pointer select-none leading-tight">
            <input
              {...register("agree")}
              type="checkbox"
              className="mt-0.5 size-4 rounded border-[var(--border)] text-mist-teal focus:ring-0 cursor-pointer accent-mist-teal"
            />
            <span>
              I agree to the{" "}
              <Link href="#" className="font-semibold text-mist-teal hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold text-mist-teal hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agree && (
            <p className="text-xs text-[var(--red)] font-sans">{errors.agree.message}</p>
          )}
        </div>

        {/* Submit Button */}
        {registerMutation.isError && (
          <div className="rounded-md bg-[var(--red)]/10 border border-[var(--red)]/20 p-3 mt-4">
            <p className="text-[13px] text-[var(--red)] font-sans font-medium flex items-start gap-2">
              <svg className="size-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{extractErrorMessage(registerMutation.error, "Failed to create account. Please try again.")}</span>
            </p>
          </div>
        )}
        <Button
          type="submit"
          className="w-full h-[44px] rounded-lg bg-forest-green hover:bg-forest-green/90 text-white font-medium text-sm transition-all shadow-md mt-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      {/* Bottom Footer */}
      <div className="mt-8 text-center text-[13px] text-[var(--foreground-2)] font-sans">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-mist-teal hover:underline">
          Sign in →
        </Link>
      </div>
    </motion.div>
  );
}
