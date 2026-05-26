"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Redirect to onboarding flow after successful registration
    window.location.href = "/onboarding/org"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Create an Account</h2>
        <p className="mt-1 text-sm text-[var(--foreground-3)]">Get started with Sentient Engine.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Full Name</label>
          <input
            {...register("name")}
            type="text"
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {errors.name && <p className="text-xs text-[var(--red)]">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Work Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {errors.email && <p className="text-xs text-[var(--red)]">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
          />
          {errors.password && <p className="text-xs text-[var(--red)]">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--foreground-3)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Sign in
        </Link>
      </div>
    </motion.div>
  )
}
