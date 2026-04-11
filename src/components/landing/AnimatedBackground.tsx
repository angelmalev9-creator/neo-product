import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Aurora gradient blobs — blue/purple AI palette */}
      <motion.div
        className="absolute w-[800px] h-[600px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(220 70% 55%), transparent 70%)',
          top: '-10%',
          left: '10%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(260 55% 55%), transparent 70%)',
          bottom: '5%',
          right: '5%',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[400px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(250 50% 55%), transparent 70%)',
          top: '40%',
          left: '50%',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, 50, -70, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* AI neural network lines — geometric connections */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ai-line1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(220 70% 55%)" stopOpacity="0.1" />
            <stop offset="70%" stopColor="hsl(260 55% 55%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(260 55% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(250 50% 55%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(250 50% 55%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280 55% 55%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(280 55% 55%)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary diagonal — top-left to bottom-right */}
        <motion.line
          x1="5%" y1="15%" x2="95%" y2="75%"
          stroke="url(#ai-line1)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.5 }}
        />
        {/* Cross diagonal */}
        <motion.line
          x1="85%" y1="10%" x2="15%" y2="85%"
          stroke="url(#ai-line3)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, delay: 1 }}
        />
        {/* Horizontal connector */}
        <motion.line
          x1="10%" y1="45%" x2="90%" y2="50%"
          stroke="url(#ai-line2)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3.5, delay: 1.5 }}
        />
        {/* Secondary connectors — thinner */}
        <motion.line
          x1="30%" y1="5%" x2="70%" y2="95%"
          stroke="url(#ai-line2)"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 4, delay: 2 }}
        />
        <motion.line
          x1="60%" y1="0%" x2="40%" y2="100%"
          stroke="url(#ai-line1)"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 4.5, delay: 2.5 }}
        />

        {/* Node circles at intersections */}
        <motion.circle
          cx="75%" cy="25%" r="3"
          fill="hsl(220 70% 55%)"
          fillOpacity="0.15"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        />
        <motion.circle
          cx="25%" cy="70%" r="2.5"
          fill="hsl(260 55% 55%)"
          fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.3 }}
        />
        <motion.circle
          cx="50%" cy="47%" r="3.5"
          fill="hsl(250 50% 55%)"
          fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.6 }}
        />

        {/* Outer ring — orbit feel */}
        <motion.circle
          cx="50%" cy="50%" r="280"
          fill="none"
          stroke="hsl(220 70% 55%)"
          strokeWidth="0.4"
          strokeOpacity="0.04"
          strokeDasharray="8 16"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ scale: { duration: 2, delay: 1 }, opacity: { duration: 2, delay: 1 }, rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }}
        />
      </svg>

      {/* Floating node particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
            background: i % 2 === 0 ? 'hsl(220 70% 55%)' : 'hsl(260 55% 55%)',
            opacity: 0.2,
          }}
          animate={{
            y: [0, -30, 10, 0],
            x: [0, 15, -10, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Subtle grid overlay — circuit board feel */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(220 70% 55% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220 70% 55% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
