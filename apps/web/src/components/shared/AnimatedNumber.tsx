"use client";

import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number | string;
  className?: string;
  format?: (val: number) => string;
}

export function AnimatedNumber({ value, className, format }: AnimatedNumberProps) {
  // If value is a string (like "10.7k" or "99.9%"), we just render it with a simple fade
  // Real spring-based tick animation is applied to pure numbers.
  const isNumber = typeof value === "number";

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  React.useEffect(() => {
    if (isNumber) {
      spring.set(value);
    }
  }, [spring, value, isNumber]);

  const display = useTransform(spring, (current) => {
    if (format) return format(current);
    return Math.floor(current).toLocaleString();
  });

  if (!isNumber) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        {value}
      </motion.span>
    );
  }

  return <motion.span className={className}>{display}</motion.span>;
}
