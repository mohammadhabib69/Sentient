"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;
    
    resetPasswordMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
      }
    );
  };

  const isSubmitting = resetPasswordMutation.isPending;

  if (!token) {
    return (
      <div className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 text-center shadow-[0_16px_48px_rgba(0,0,0,0.15)] backdrop-blur-[20px]">
        <h2 className="text-xl font-bold mb-2">Invalid or missing token</h2>
        <p className="text-sm text-[var(--foreground-2)] mb-6">
          Please check your email and try clicking the link again.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full h-[44px] rounded-lg bg-forest-green hover:bg-forest-green/90 text-white">
            Back to Forgot Password
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-[20px] border border-[var(--border)] dark:border-[rgba(116,149,155,0.18)] bg-[rgba(255,255,255,0.80)] dark:bg-[rgba(44,61,51,0.45)] p-10 shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.40)] backdrop-blur-[20px]"
    >
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="reset-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-center mb-6">
              <div className="flex size-[48px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 text-mist-teal shadow-inner">
                <Lock className="size-5" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
                Set new password
              </h2>
              <p className="mt-1.5 text-sm text-[var(--foreground-2)] font-sans px-2">
                Your new password must be at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[var(--surface-2)]/60 border border-[var(--border)] focus:border-mist-teal focus:ring-3 focus:ring-mist-teal/15 transition-all text-foreground rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-2)] hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[var(--red)] mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--foreground-2)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-[var(--surface-2)]/60 border border-[var(--border)] focus:border-mist-teal focus:ring-3 focus:ring-mist-teal/15 transition-all text-foreground rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-2)] hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[var(--red)] mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {resetPasswordMutation.isError && (
                <p className="text-xs text-[var(--red)] font-sans mt-1">
                  {resetPasswordMutation.error?.message || "Failed to reset password. Token may be expired."}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-[44px] rounded-lg bg-forest-green hover:bg-forest-green/90 text-white mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="reset-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2"
          >
            <div className="flex justify-center mb-6">
              <div className="flex size-[48px] items-center justify-center rounded-full bg-green/15 text-green border border-green/20">
                <CheckCircle2 className="size-6" />
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Password Reset
            </h2>
            <p className="mt-2.5 text-sm text-[var(--foreground-2)] mb-8">
              Your password has been successfully reset.
            </p>

            <Link href="/login">
              <Button className="w-full h-[44px] rounded-lg bg-forest-green text-white">
                Continue to Login
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
