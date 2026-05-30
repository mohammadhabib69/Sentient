"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[20px] text-center"
    >
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

      {status === "success" && (
        <div className="py-2">
          <div className="flex justify-center mb-6">
            <div className="flex size-[48px] items-center justify-center rounded-full bg-green/15 text-green border border-green/20">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Email Verified!
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
            The verification link is invalid or has expired.
          </p>
          <Link href="/login">
            <Button className="w-full h-[44px] rounded-lg bg-forest-green text-white">
              Back to Login
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
