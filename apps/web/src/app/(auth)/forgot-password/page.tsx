"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmittedEmail(data.email);
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsResending(false);
    setResendSuccess(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[20px] relative"
    >
      <AnimatePresence mode="wait">
        {!submittedEmail ? (
          <motion.div
            key="forgot-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. Back link */}
            <div className="mb-6 -mt-2">
              <Link
                href="/login"
                className="text-[13px] text-[var(--foreground-2)] hover:text-foreground transition-colors font-sans"
              >
                ← Back to login
              </Link>
            </div>

            {/* 2. Icon (Lock) */}
            <div className="flex justify-center mb-6">
              <div className="flex size-[48px] items-center justify-center rounded-full border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[var(--surface-2)]/60 dark:bg-[var(--surface-2)]/40 text-mist-teal shadow-inner">
                <Lock className="size-5" />
              </div>
            </div>

            {/* 3 & 4. Heading & Sub */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                Reset your password
              </h2>
              <p className="mt-1.5 text-sm text-[var(--foreground-2)] font-sans px-2">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* 5. Email input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]"
                >
                  Email
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

              {/* 6. Send Reset Link button */}
              <Button
                type="submit"
                className="w-full h-[44px] rounded-lg bg-forest-green hover:bg-forest-green/90 text-white font-medium text-sm transition-all shadow-md mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            {/* 7. Bottom footer */}
            <div className="mt-8 text-center text-[13px] text-[var(--foreground-2)] font-sans">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-mist-teal hover:underline">
                Sign in →
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="forgot-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-center py-2"
          >
            {/* Success Envelope Icon in Green Glass Circle */}
            <div className="flex justify-center mb-6">
              <div className="flex size-[48px] items-center justify-center rounded-full bg-green/15 text-green border border-green/20 shadow-[0_0_12px_rgba(73,119,107,0.15)]">
                <Mail className="size-5 animate-pulse" />
              </div>
            </div>

            {/* Success Header & Sub */}
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Check your email
            </h2>
            <p className="mt-2.5 text-sm text-[var(--foreground-2)] font-sans px-4 leading-relaxed">
              We sent a reset link to{" "}
              <strong className="text-foreground font-medium">{submittedEmail}</strong>
            </p>

            {/* Actions */}
            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[13px] font-semibold text-mist-teal hover:text-mist-teal/80 transition-colors block w-full text-center hover:underline disabled:opacity-50"
              >
                {isResending ? "Resending..." : resendSuccess ? "✓ Email Resent" : "Resend email"}
              </button>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex h-[40px] items-center justify-center rounded-lg bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 px-6 text-sm font-semibold transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
