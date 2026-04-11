import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  // Generate scattered dot particles
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: `${(i * 17 + 7) % 100}%`,
    y: `${(i * 23 + 11) % 100}%`,
    size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    color: i % 3 === 0 ? 'hsl(220 70% 55%)' : i % 3 === 1 ? 'hsl(260 55% 55%)' : 'hsl(250 50% 60%)',
    delay: (i * 0.3) % 5,
    duration: 6 + (i % 8) * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Large glow blobs — branding spots */}
      <motion.div
        className="absolute w-[900px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(220 70% 55%), transparent 65%)',
          top: '-15%', left: '5%', filter: 'blur(80px)', opacity: 0.09,
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[700px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(260 55% 55%), transparent 65%)',
          bottom: '0%', right: '0%', filter: 'blur(90px)', opacity: 0.08,
        }}
        animate={{ x: [0, -60, 40, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(250 50% 58%), transparent 65%)',
          top: '35%', left: '45%', filter: 'blur(100px)', opacity: 0.06,
        }}
        animate={{ x: [0, 50, -70, 0], y: [0, -40, 60, 0], scale: [1, 1.2, 0.85, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Extra accent blobs for more branding presence */}
      <motion.div
        className="absolute w-[400px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(280 55% 55%), transparent 65%)',
          top: '60%', left: '-5%', filter: 'blur(80px)', opacity: 0.07,
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[350px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(220 75% 60%), transparent 65%)',
          top: '10%', right: '-5%', filter: 'blur(70px)', opacity: 0.07,
        }}
        animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[300px] h-[250px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(240 55% 55%), transparent 65%)',
          top: '80%', left: '55%', filter: 'blur(75px)', opacity: 0.06,
        }}
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Dense AI neural network lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ai-line1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(220 70% 55%)" stopOpacity="0.12" />
            <stop offset="70%" stopColor="hsl(260 55% 55%)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(260 55% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(250 50% 55%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(250 50% 55%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280 55% 55%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(280 55% 55%)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line4" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(240 55% 55%)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="hsl(260 55% 55%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary diagonals */}
        <motion.line x1="5%" y1="15%" x2="95%" y2="75%" stroke="url(#ai-line1)" strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3, delay: 0.5 }} />
        <motion.line x1="85%" y1="10%" x2="15%" y2="85%" stroke="url(#ai-line3)" strokeWidth="0.6"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 4, delay: 1 }} />
        <motion.line x1="10%" y1="45%" x2="90%" y2="50%" stroke="url(#ai-line2)" strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3.5, delay: 1.5 }} />
        
        {/* Additional crossing lines for density */}
        <motion.line x1="30%" y1="5%" x2="70%" y2="95%" stroke="url(#ai-line2)" strokeWidth="0.4"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ duration: 4, delay: 2 }} />
        <motion.line x1="60%" y1="0%" x2="40%" y2="100%" stroke="url(#ai-line1)" strokeWidth="0.4"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ duration: 4.5, delay: 2.5 }} />
        <motion.line x1="0%" y1="25%" x2="100%" y2="30%" stroke="url(#ai-line4)" strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 5, delay: 1.8 }} />
        <motion.line x1="0%" y1="70%" x2="100%" y2="65%" stroke="url(#ai-line4)" strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 5, delay: 2.2 }} />
        <motion.line x1="20%" y1="0%" x2="80%" y2="100%" stroke="url(#ai-line3)" strokeWidth="0.25"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 5.5, delay: 3 }} />
        <motion.line x1="90%" y1="5%" x2="10%" y2="60%" stroke="url(#ai-line1)" strokeWidth="0.25"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 5, delay: 3.2 }} />
        <motion.line x1="45%" y1="0%" x2="55%" y2="100%" stroke="url(#ai-line2)" strokeWidth="0.2"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.35 }} transition={{ duration: 6, delay: 3.5 }} />

        {/* Node circles at intersections — more of them */}
        <motion.circle cx="75%" cy="25%" r="3.5" fill="hsl(220 70% 55%)" fillOpacity="0.18"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2 }} />
        <motion.circle cx="25%" cy="70%" r="3" fill="hsl(260 55% 55%)" fillOpacity="0.15"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.3 }} />
        <motion.circle cx="50%" cy="47%" r="4" fill="hsl(250 50% 55%)" fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.6 }} />
        <motion.circle cx="15%" cy="30%" r="2.5" fill="hsl(220 70% 55%)" fillOpacity="0.14"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.8 }} />
        <motion.circle cx="85%" cy="60%" r="2" fill="hsl(280 55% 55%)" fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3 }} />
        <motion.circle cx="40%" cy="15%" r="2" fill="hsl(260 55% 55%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.2 }} />
        <motion.circle cx="65%" cy="80%" r="2.5" fill="hsl(220 70% 55%)" fillOpacity="0.11"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.4 }} />
        <motion.circle cx="90%" cy="40%" r="2" fill="hsl(250 50% 55%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.6 }} />
        <motion.circle cx="10%" cy="55%" r="1.5" fill="hsl(280 55% 55%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.8 }} />

        {/* Orbit rings */}
        <motion.circle cx="50%" cy="50%" r="280" fill="none" stroke="hsl(220 70% 55%)" strokeWidth="0.5" strokeOpacity="0.05" strokeDasharray="8 16"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ scale: { duration: 2, delay: 1 }, opacity: { duration: 2, delay: 1 }, rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }} />
        <motion.circle cx="50%" cy="50%" r="450" fill="none" stroke="hsl(260 55% 55%)" strokeWidth="0.3" strokeOpacity="0.035" strokeDasharray="4 20"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: -360 }}
          transition={{ scale: { duration: 2, delay: 1.5 }, opacity: { duration: 2, delay: 1.5 }, rotate: { duration: 180, repeat: Infinity, ease: 'linear' } }} />
      </svg>

      {/* Floating dot particles — scattered across entire viewport */}
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
            y: [0, -20 - dot.size * 5, 10, 0],
            x: [0, 10 + dot.size * 3, -8, 0],
            opacity: [0.08, 0.3, 0.12, 0.08],
            scale: [1, 1.4, 0.9, 1],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: dot.delay,
          }}
        />
      ))}

      {/* Grid overlay — circuit board feel */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(220 70% 55% / 0.35) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220 70% 55% / 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
