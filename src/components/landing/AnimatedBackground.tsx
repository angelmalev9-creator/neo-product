import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  const dots = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: `${(i * 17 + 7) % 100}%`,
    y: `${(i * 23 + 11) % 100}%`,
    size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
    color: i % 3 === 0 ? 'hsl(200 70% 55%)' : i % 3 === 1 ? 'hsl(210 60% 50%)' : 'hsl(195 65% 48%)',
    delay: (i * 0.4) % 6,
    duration: 8 + (i % 6) * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Subtle neural network lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ai-line1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200 70% 50%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(200 70% 50%)" stopOpacity="0.08" />
            <stop offset="70%" stopColor="hsl(210 60% 45%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(210 60% 45%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 65% 48%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(195 65% 48%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(200 70% 50%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(210 60% 45%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(210 60% 45%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(200 70% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sparse diagonal lines */}
        <motion.line x1="5%" y1="15%" x2="95%" y2="75%" stroke="url(#ai-line1)" strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3, delay: 0.5 }} />
        <motion.line x1="85%" y1="10%" x2="15%" y2="85%" stroke="url(#ai-line3)" strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 4, delay: 1 }} />
        <motion.line x1="10%" y1="45%" x2="90%" y2="50%" stroke="url(#ai-line2)" strokeWidth="0.4"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3.5, delay: 1.5 }} />
        <motion.line x1="30%" y1="5%" x2="70%" y2="95%" stroke="url(#ai-line2)" strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 4, delay: 2 }} />
        <motion.line x1="60%" y1="0%" x2="40%" y2="100%" stroke="url(#ai-line1)" strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 4.5, delay: 2.5 }} />

        {/* Node dots */}
        <motion.circle cx="75%" cy="25%" r="2.5" fill="hsl(200 70% 55%)" fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2 }} />
        <motion.circle cx="25%" cy="70%" r="2" fill="hsl(210 60% 50%)" fillOpacity="0.10"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.3 }} />
        <motion.circle cx="50%" cy="47%" r="3" fill="hsl(195 65% 48%)" fillOpacity="0.08"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.6 }} />

        {/* Orbit ring */}
        <motion.circle cx="50%" cy="50%" r="300" fill="none" stroke="hsl(200 70% 50%)" strokeWidth="0.4" strokeOpacity="0.04" strokeDasharray="6 18"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ scale: { duration: 2, delay: 1 }, opacity: { duration: 2, delay: 1 }, rotate: { duration: 150, repeat: Infinity, ease: 'linear' } }} />
      </svg>

      {/* Floating dot particles */}
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            top: dot.y,
            left: dot.x,
            width: dot.size,
            height: dot.size,
            background: dot.color,
          }}
          animate={{
            y: [0, -15 - dot.size * 4, 8, 0],
            x: [0, 8 + dot.size * 2, -6, 0],
            opacity: [0.05, 0.2, 0.08, 0.05],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot.delay,
          }}
        />
      ))}

      {/* Faint grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(200 60% 50% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(200 60% 50% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
