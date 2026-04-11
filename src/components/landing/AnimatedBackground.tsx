import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Warm orange aurora blob */}
      <motion.div
        className="absolute w-[800px] h-[600px] rounded-full opacity-[0.08]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(19 55% 50%), transparent 70%)',
          top: '-10%',
          left: '10%',
          filter: 'blur(120px)',
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Warm chestnut blob */}
      <motion.div
        className="absolute w-[600px] h-[500px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(16 14% 56%), transparent 70%)',
          bottom: '5%',
          right: '5%',
          filter: 'blur(120px)',
        }}
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle brown blob */}
      <motion.div
        className="absolute w-[500px] h-[400px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(18 9% 40%), transparent 70%)',
          top: '40%',
          left: '50%',
          filter: 'blur(130px)',
        }}
        animate={{
          x: [0, 50, -70, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating geometric lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(19 55% 46%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(19 55% 46%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(19 55% 46%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(16 14% 56%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(16 14% 56%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(16 14% 56%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0%" y1="30%" x2="100%" y2="60%"
          stroke="url(#line1)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.5 }}
        />
        <motion.line
          x1="20%" y1="0%" x2="80%" y2="100%"
          stroke="url(#line2)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, delay: 1 }}
        />
        <motion.circle
          cx="75%" cy="25%" r="120"
          fill="none"
          stroke="hsl(19 55% 46%)"
          strokeWidth="0.5"
          strokeOpacity="0.06"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
        <motion.circle
          cx="25%" cy="70%" r="80"
          fill="none"
          stroke="hsl(16 14% 56%)"
          strokeWidth="0.5"
          strokeOpacity="0.05"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 2 }}
        />
      </svg>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
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

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(19 55% 46% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(19 55% 46% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
