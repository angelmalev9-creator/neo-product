import { motion } from 'framer-motion';

const floatingWords = [
  { text: 'NEO', x: '8%', y: '15%', size: 'text-[80px]', delay: 0, duration: 25 },
  { text: 'AI', x: '75%', y: '25%', size: 'text-[60px]', delay: 3, duration: 30 },
  { text: '24/7', x: '85%', y: '60%', size: 'text-[50px]', delay: 6, duration: 22 },
  { text: 'NEO', x: '20%', y: '70%', size: 'text-[70px]', delay: 2, duration: 28 },
  { text: 'AI', x: '55%', y: '85%', size: 'text-[45px]', delay: 8, duration: 26 },
  { text: 'NEO', x: '45%', y: '40%', size: 'text-[55px]', delay: 5, duration: 32 },
  { text: '24/7', x: '15%', y: '45%', size: 'text-[40px]', delay: 10, duration: 24 },
  { text: 'AI', x: '65%', y: '10%', size: 'text-[50px]', delay: 7, duration: 27 },
];

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -5 }}>
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(355 50% 45% / 0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      {/* Floating brand words */}
      {floatingWords.map((word, i) => (
        <motion.span
          key={i}
          className={`absolute font-mono font-black ${word.size} text-primary/[0.025] select-none`}
          style={{ left: word.x, top: word.y }}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, 0, -8, 0],
            rotate: [0, 1, 0, -1, 0],
          }}
          transition={{
            duration: word.duration,
            repeat: Infinity,
            delay: word.delay,
            ease: 'easeInOut',
          }}
        >
          {word.text}
        </motion.span>
      ))}

      {/* Floating geometric shapes */}
      {[
        { x: '30%', y: '20%', size: 80, delay: 0 },
        { x: '70%', y: '50%', size: 60, delay: 4 },
        { x: '10%', y: '80%', size: 50, delay: 8 },
        { x: '90%', y: '15%', size: 40, delay: 2 },
        { x: '50%', y: '65%', size: 70, delay: 6 },
      ].map((shape, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute rounded-full border border-primary/[0.04]"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
