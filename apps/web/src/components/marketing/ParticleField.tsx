"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

const PARTICLE_COUNT = 200
const PARTICLE_COLOR = "rgba(116, 149, 155, 0.15)"
const LINE_COLOR = "rgba(116, 149, 155, 0.05)"
const CONNECTION_DISTANCE = 100
const PARTICLE_RADIUS = 1.5
const SPEED = 0.3

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      })
    }
    particlesRef.current = particles
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    const particles = particlesRef.current

    ctx.clearRect(0, 0, width, height)

    // Update positions
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > width) p.vx *= -1
      if (p.y < 0 || p.y > height) p.vy *= -1

      p.x = Math.max(0, Math.min(width, p.x))
      p.y = Math.max(0, Math.min(height, p.y))
    }

    // Draw connecting lines
    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = 1
    for (let i = 0; i < particles.length; i++) {
      const pi = particles[i]!
      for (let j = i + 1; j < particles.length; j++) {
        const pj = particles[j]!
        const dx = pi.x - pj.x
        const dy = pi.y - pj.y
        const distSq = dx * dx + dy * dy

        if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
          ctx.beginPath()
          ctx.moveTo(pi.x, pi.y)
          ctx.lineTo(pj.x, pj.y)
          ctx.stroke()
        }
      }
    }

    // Draw particles
    ctx.fillStyle = PARTICLE_COLOR
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!
      ctx.beginPath()
      ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.scale(dpr, dpr)
      initParticles(rect.width, rect.height)
    }

    resize()
    animationRef.current = requestAnimationFrame(draw)

    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [draw, initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}

export default ParticleCanvas
export { ParticleCanvas }
