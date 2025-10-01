'use client';

import { useEffect, useRef, useState } from 'react';

export default function TestParticlesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    console.log('🚀 TestParticlesPage useEffect started');
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas ref is null!');
      return;
    }

    console.log('✅ Canvas found:', canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Canvas context is null!');
      return;
    }

    console.log('✅ Canvas context created:', ctx);

    // Set canvas size
    const resizeCanvas = () => {
      if (typeof window !== 'undefined') {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log('📏 Canvas resized to:', canvas.width, 'x', canvas.height);
        particles.length = 0;
        createParticles();
      }
    };

    const particles: any[] = [];

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
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = '#ffffff';
      }

      update() {
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

    // Create particles
    const createParticles = () => {
      const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 8000));
      console.log('🎯 Creating particles:', particleCount);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      
      console.log('✅ Particles created:', particles.length);
      setDebugInfo(prev => ({ ...prev, particleCount: particles.length }));
    };

    // Draw connections
    const drawConnections = () => {
      let connectionCount = 0;
      
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            connectionCount++;
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
      
      setDebugInfo(prev => ({ ...prev, connections: connectionCount }));
    };

    // Animation loop
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background for debugging
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        
        // Log first particle for debugging
        if (index === 0 && frameCount % 60 === 0) {
          console.log('🔵 First particle position:', { x: particle.x, y: particle.y, size: particle.size });
        }
      });

      // Draw connections
      drawConnections();

      // Log every 60 frames (1 second at 60fps)
      if (frameCount % 60 === 0) {
        console.log('🎬 Animation frame:', frameCount, 'Particles:', particles.length);
      }

      requestAnimationFrame(animate);
    };

    // Initialize
    console.log('🔧 Initializing...');
    resizeCanvas();
    createParticles();
    
    console.log('🎬 Starting animation...');
    animate();

    // Event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        console.log('🧹 Cleaning up...');
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-red-600">
      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Debug Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded max-w-sm">
        <h2 className="text-xl font-bold mb-2">🔍 Debug Info</h2>
        <div className="space-y-1 text-sm">
          <p>Canvas: {canvasRef.current ? '✅ Found' : '❌ Not found'}</p>
          <p>Particles: {debugInfo.particleCount || 0}</p>
          <p>Connections: {debugInfo.connections || 0}</p>
          <p>Window: {typeof window !== 'undefined' ? '✅ Client' : '❌ Server'}</p>
        </div>
        <p className="text-xs mt-2 text-gray-300">
          Check console for detailed logs
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded max-w-sm">
        <h3 className="text-lg font-bold mb-2">📋 Instructions</h3>
        <div className="text-sm space-y-1">
          <p>1. Open browser console (F12)</p>
          <p>2. Look for debug logs</p>
          <p>3. Check if particles are being created</p>
          <p>4. Verify canvas context</p>
        </div>
      </div>
    </div>
  );
}