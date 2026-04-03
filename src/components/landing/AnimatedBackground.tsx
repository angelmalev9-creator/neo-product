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
    const DOT_SPACING = isMobile ? 28 : 18;
    const DOT_RADIUS = 0.8;
    const BASE_OPACITY = 0.09;
    const MOUSE_RADIUS = isMobile ? 0 : 140;
    const REPEL_STRENGTH = 18;

    // Mouse tracking
    const mouse = { x: -9999, y: -9999 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

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

      // Deep crimson radial glow — bottom-right
      const grd = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.5);
      grd.addColorStop(0, 'rgba(140,20,20,0.06)');
      grd.addColorStop(0.4, 'rgba(100,10,10,0.025)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Secondary dark red glow — top-left
      const grd2 = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, W * 0.35);
      grd2.addColorStop(0, 'rgba(160,30,30,0.04)');
      grd2.addColorStop(0.5, 'rgba(120,15,15,0.015)');
      grd2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, W, H);

      // Interactive dot grid with mouse repulsion
      const cols = Math.ceil(W / DOT_SPACING) + 1;
      const rows = Math.ceil(H / DOT_SPACING) + 1;
      const mouseRadiusSq = MOUSE_RADIUS * MOUSE_RADIUS;

      for (let row = 0; row < rows; row++) {
        const baseY = row * DOT_SPACING;
        for (let col = 0; col < cols; col++) {
          const baseX = col * DOT_SPACING;

          let drawX = baseX;
          let drawY = baseY;
          let mouseGlow = 0;

          // Mouse repulsion
          if (!isMobile) {
            const mdx = baseX - mouse.x;
            const mdy = baseY - mouse.y;
            const distSq = mdx * mdx + mdy * mdy;

            if (distSq < mouseRadiusSq && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / MOUSE_RADIUS);
              const forceCubed = force * force * force;
              drawX += (mdx / dist) * REPEL_STRENGTH * forceCubed;
              drawY += (mdy / dist) * REPEL_STRENGTH * forceCubed;
              mouseGlow = forceCubed;
            }
          }

          // Vignette
          const dx = (baseX / W - 0.5) * 2;
          const dy = (baseY / H - 0.5) * 2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = Math.max(0, 1 - dist * 0.55);

          // Wave
          const wave = Math.sin(baseX * 0.008 + time * 2) * Math.cos(baseY * 0.006 + time * 1.5);
          let opacity = BASE_OPACITY * vignette * (0.7 + 0.3 * (wave * 0.5 + 0.5));

          // Boost opacity near mouse
          opacity += mouseGlow * 0.25;

          if (opacity < 0.008) continue;

          // Dot color: white normally, crimson glow near mouse
          const r = Math.round(255 - mouseGlow * 95);
          const g = Math.round(255 - mouseGlow * 220);
          const b = Math.round(255 - mouseGlow * 220);

          const radius = DOT_RADIUS + mouseGlow * 1.2;

          ctx.beginPath();
          ctx.arc(drawX, drawY, radius, 0, 6.2832);
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.fill();
        }
      }

      // Edge vignette
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
      if (!isMobile) window.removeEventListener('mousemove', onMouseMove);
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
