import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS;
    let time = 0;

    const isMobile = window.innerWidth < 768;
    const DOT_SPACING = isMobile ? 20 : 14;
    const DOT_RADIUS = 0.6;
    const BASE_OPACITY = 0.07;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);
      if (timestamp - lastTime < FRAME_TIME) return;
      lastTime = timestamp;
      time += 0.003;

      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // Radial gradient glow — bottom-right teal accent
      const grd = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.85, H * 0.75, W * 0.55);
      grd.addColorStop(0, 'rgba(0,210,160,0.06)');
      grd.addColorStop(0.4, 'rgba(0,180,140,0.025)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Secondary subtle red glow — top-left
      const grd2 = ctx.createRadialGradient(W * 0.1, H * 0.15, 0, W * 0.1, H * 0.15, W * 0.4);
      grd2.addColorStop(0, 'rgba(255,60,60,0.03)');
      grd2.addColorStop(0.5, 'rgba(255,60,60,0.01)');
      grd2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, W, H);

      // Dot grid
      const cols = Math.ceil(W / DOT_SPACING) + 1;
      const rows = Math.ceil(H / DOT_SPACING) + 1;

      for (let row = 0; row < rows; row++) {
        const y = row * DOT_SPACING;
        for (let col = 0; col < cols; col++) {
          const x = col * DOT_SPACING;

          // Distance from center for vignette
          const dx = (x / W - 0.5) * 2;
          const dy = (y / H - 0.5) * 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = Math.max(0, 1 - dist * 0.6);

          // Subtle wave animation
          const wave = Math.sin(x * 0.008 + time * 2) * Math.cos(y * 0.006 + time * 1.5);
          const opacity = BASE_OPACITY * vignette * (0.7 + 0.3 * (wave * 0.5 + 0.5));

          if (opacity < 0.008) continue;

          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, 6.2832);
          ctx.fillStyle = `rgba(255,255,255,${opacity})`;
          ctx.fill();
        }
      }

      // Edge vignette overlay
      const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    resize();
    animationId = requestAnimationFrame(animate);

    let resizeTimeout: number;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 250);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -5, willChange: 'transform' }}
    />
  );
};

export default AnimatedBackground;
