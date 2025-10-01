'use client';

import { useEffect, useRef, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

export default function LoadingScreen({ onComplete, duration = 3000 }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (typeof window !== 'undefined') {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recreate particles after resize
        particlesRef.current = [];
        createParticles();
      }
    };

    // Particle class - giống particles.js
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1; // Size từ 1-3
        this.opacity = Math.random() * 0.5 + 0.3; // Opacity từ 0.3-0.8
        this.color = '#ffffff'; // White particles
      }

      update() {
        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Create particles function
    const createParticles = () => {
      const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 8000));
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    // Draw connections between particles
    const drawConnections = () => {
      particlesRef.current.forEach((particle, i) => {
        particlesRef.current.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) { // Connection distance
            ctx.save();
            ctx.globalAlpha = (120 - distance) / 120 * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      drawConnections();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    animate();

    // Event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas);
      
      // Mouse interaction
      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      };
      
      canvas.addEventListener('mousemove', handleMouseMove);
      
      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('mousemove', handleMouseMove);
      };
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            onComplete?.();
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    return () => {
      clearInterval(progressInterval);
    };
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center">
      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Loading Content */}
      <div className="relative z-10 text-center text-white">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 animate-pulse text-white">
            EatNow
          </h1>
          <p className="text-xl text-red-100">
            Đang tải ứng dụng...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mx-auto mb-8">
          <div className="bg-red-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-white to-red-200 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-red-100 mt-2">
            {progress}%
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}