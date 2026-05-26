"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
