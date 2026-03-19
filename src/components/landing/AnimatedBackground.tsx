import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 25 : 45;
    const BAND_COUNT = isMobile ? 3 : 5;
    const CONNECTION_DIST = isMobile ? 100 : 130;
    const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;

    let particles: { x: number; y: number; size: number; sx: number; sy: number; opacity: number; color: string }[] = [];
    let bands: { y: number; height: number; speed: number; opacity: number; dir: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const init = () => {
      particles = [];
      bands = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w(),
          y: Math.random() * h(),
          size: Math.random() * 2.5 + 0.8,
          sx: (Math.random() - 0.5) * 0.4,
          sy: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? '255,60,60' : '255,100,150',
        });
      }
      for (let i = 0; i < BAND_COUNT; i++) {
        bands.push({
          y: Math.random() * h(),
          height: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.25 + 0.08,
          opacity: Math.random() * 0.12 + 0.04,
          dir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };

    const animate = () => {
      const W = w(), H = h();
      ctx.clearRect(0, 0, W, H);

      // Bands
      for (const b of bands) {
        b.y += b.speed * b.dir;
        if (b.y > H + 30) b.y = -30;
        if (b.y < -30) b.y = H + 30;
        const g = ctx.createLinearGradient(0, b.y, W, b.y);
        g.addColorStop(0, `rgba(255,60,60,0)`);
        g.addColorStop(0.3, `rgba(255,60,60,${b.opacity})`);
        g.addColorStop(0.7, `rgba(255,100,150,${b.opacity})`);
        g.addColorStop(1, `rgba(255,60,60,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, b.y, W, b.height);
      }

      // Connections (spatial skip for perf)
      ctx.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < CONNECTION_DIST_SQ) {
            const opacity = (1 - Math.sqrt(distSq) / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,60,60,${opacity})`;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        p.x += p.sx;
        p.y += p.sy;
        if (p.x > W) p.x = 0;
        if (p.x < 0) p.x = W;
        if (p.y > H) p.y = 0;
        if (p.y < 0) p.y = H;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    init();
    animate();

    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.6, zIndex: -5, willChange: 'contents' }}
    />
  );
};

export default AnimatedBackground;