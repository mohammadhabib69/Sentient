"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    window.location.href = "/dashboard"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Sign In</h2>
        <p className="mt-1 text-sm text-[var(--foreground-3)]">Enter your credentials to access your workspace.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {errors.email && <p className="text-xs text-[var(--red)]">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Password</label>
            <Link href="/forgot-password" className="text-xs text-[hsl(var(--primary))] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {errors.password && <p className="text-xs text-[var(--red)]">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--foreground-3)]">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Sign up
        </Link>
      </div>
    </motion.div>
  )
}
