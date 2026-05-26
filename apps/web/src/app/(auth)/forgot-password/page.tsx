"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const schema = z.object({
  email: z.string().email("Invalid email address"),
})

export default function ForgotPasswordPage() {
  const [success, setSuccess] = React.useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
    setSuccess(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Reset Password</h2>
        <p className="mt-1 text-sm text-[var(--foreground-3)]">
          {success ? "Check your email for reset instructions." : "Enter your email to receive a reset link."}
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
            {errors.email && <p className="text-xs text-[var(--red)]">{errors.email?.message as string}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <Button onClick={() => window.location.href = '/login'} variant="outline" className="w-full">
          Return to Login
        </Button>
      )}

      <div className="mt-6 text-center text-sm text-[var(--foreground-3)]">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Sign in
        </Link>
      </div>
    </motion.div>
  )
}
