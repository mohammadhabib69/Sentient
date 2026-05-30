"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = React.useState<"pending" | "loading" | "success" | "error">(
    token ? "loading" : "pending"
  );
  const [resending, setResending] = React.useState(false);
  const [resentAt, setResentAt] = React.useState<Date | null>(null);

  // Verify token if present in URL
  React.useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await apiClient.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
      } catch (err) {
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await apiClient.post("/auth/send-verification");
      setResentAt(new Date());
    } catch (err) {
      // ignore
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[20px] text-center"
    >
      {/* Pending — shown right after registration */}
      {status === "pending" && (
        <div className="py-2">
          <div className="flex justify-center mb-6">
            <div className="flex size-[56px] items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20">
              <Mail className="size-7" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Check your email
          </h2>
          <p className="mt-3 text-sm text-[var(--foreground-2)] max-w-[320px] mx-auto leading-relaxed">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold text-foreground">{user?.email ?? "your email"}</span>.
            Click the link to activate your account.
          </p>

          <p className="mt-6 text-xs text-[var(--foreground-2)]">
            Didn&apos;t receive it? Check spam, or{" "}
          </p>

          <Button
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="mt-3 h-[42px] rounded-lg px-6 text-sm font-medium gap-2"
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {resending ? "Sending..." : "Resend verification email"}
          </Button>

          {resentAt && (
            <p className="mt-3 text-xs text-green-500 font-medium">
              ✓ Verification email sent! Check your inbox.
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <Link href="/login" className="text-sm text-[var(--foreground-2)] hover:text-foreground transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      )}

      {/* Loading — verifying token */}
      {status === "loading" && (
        <div className="py-8">
          <Loader2 className="size-8 animate-spin mx-auto text-mist-teal mb-4" />
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Verifying your email...
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground-2)]">
            Please wait while we verify your email address.
          </p>
        </div>
      )}

      {/* Success */}
      {status === "success" && (
        <div className="py-2">
          <div className="flex justify-center mb-6">
            <div className="flex size-[48px] items-center justify-center rounded-full bg-green/15 text-green border border-green/20">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Email Verified! 🎉
          </h2>
          <p className="mt-2.5 text-sm text-[var(--foreground-2)] mb-8">
            Your email has been successfully verified. You can now access all features.
          </p>
          <Link href="/dashboard">
            <Button className="w-full h-[44px] rounded-lg bg-forest-green text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="py-2">
          <div className="flex justify-center mb-6">
            <div className="flex size-[48px] items-center justify-center rounded-full bg-red/15 text-red border border-red/20">
              <XCircle className="size-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Verification Failed
          </h2>
          <p className="mt-2.5 text-sm text-[var(--foreground-2)] mb-8">
            The verification link is invalid or has expired. Please request a new one.
          </p>
          <Button
            onClick={handleResend}
            disabled={resending}
            className="w-full h-[44px] rounded-lg bg-forest-green text-white gap-2"
          >
            {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {resending ? "Sending..." : "Resend verification email"}
          </Button>
          {resentAt && (
            <p className="mt-3 text-xs text-green-500 font-medium">
              ✓ New verification email sent! Check your inbox.
            </p>
          )}
          <div className="mt-6">
            <Link href="/login" className="text-sm text-[var(--foreground-2)] hover:text-foreground transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
