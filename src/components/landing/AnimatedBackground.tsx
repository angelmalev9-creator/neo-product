import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Aurora gradient blobs */}
      <motion.div
        className="absolute w-[800px] h-[600px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(239 84% 67%), transparent 70%)',
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
        className="absolute w-[600px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(263 70% 50%), transparent 70%)',
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
        className="absolute w-[500px] h-[400px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(239 60% 55%), transparent 70%)',
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

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
