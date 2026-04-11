import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: `${(i * 17 + 7) % 100}%`,
    y: `${(i * 23 + 11) % 100}%`,
    size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    color: i % 3 === 0 ? 'hsl(220 70% 55%)' : i % 3 === 1 ? 'hsl(192 80% 50%)' : 'hsl(200 70% 52%)',
    delay: (i * 0.3) % 5,
    duration: 6 + (i % 8) * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

      {/* Glowing AI circles — top right & bottom left */}
      <motion.div
        className="absolute"
        style={{
          top: '-5%', right: '-8%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, hsl(220 70% 65% / 0.12) 0%, hsl(220 70% 55% / 0.06) 30%, hsl(192 80% 50% / 0.03) 55%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }}
        animate={{
          scale: [1, 1.08, 0.96, 1],
          rotate: [0, 15, -10, 0],
          opacity: [0.7, 1, 0.8, 0.7],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '-5%', right: '-8%',
          width: '380px', height: '380px',
          background: 'radial-gradient(circle, hsl(220 80% 70% / 0.08) 0%, transparent 60%)',
          borderRadius: '50%',
          filter: 'blur(15px)',
          border: '1px solid hsl(220 70% 65% / 0.06)',
        }}
        animate={{
          scale: [1, 0.92, 1.06, 1],
          rotate: [0, -20, 12, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <motion.div
        className="absolute"
        style={{
          bottom: '-8%', left: '-6%',
          width: '450px', height: '450px',
          background: 'radial-gradient(circle, hsl(192 80% 50% / 0.10) 0%, hsl(192 75% 48% / 0.05) 30%, hsl(220 70% 55% / 0.02) 55%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }}
        animate={{
          scale: [1, 1.06, 0.94, 1],
          rotate: [0, -12, 18, 0],
          opacity: [0.6, 0.9, 0.7, 0.6],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: '-8%', left: '-6%',
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, hsl(192 85% 55% / 0.07) 0%, transparent 55%)',
          borderRadius: '50%',
          filter: 'blur(12px)',
          border: '1px solid hsl(192 80% 50% / 0.05)',
        }}
        animate={{
          scale: [1, 1.08, 0.93, 1],
          rotate: [0, 15, -8, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

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
          background: 'radial-gradient(ellipse at center, hsl(192 80% 50%), transparent 65%)',
          bottom: '0%', right: '0%', filter: 'blur(90px)', opacity: 0.08,
        }}
        animate={{ x: [0, -60, 40, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(200 70% 52%), transparent 65%)',
          top: '35%', left: '45%', filter: 'blur(100px)', opacity: 0.06,
        }}
        animate={{ x: [0, 50, -70, 0], y: [0, -40, 60, 0], scale: [1, 1.2, 0.85, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Extra accent blobs */}
      <motion.div
        className="absolute w-[400px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(185 70% 45%), transparent 65%)',
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
          background: 'radial-gradient(ellipse at center, hsl(195 75% 48%), transparent 65%)',
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
            <stop offset="70%" stopColor="hsl(192 80% 50%)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(192 80% 50%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(200 70% 52%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(200 70% 52%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(192 80% 50%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(192 80% 50%)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ai-line4" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="hsl(220 70% 55%)" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(195 75% 48%)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="hsl(192 80% 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Primary diagonals */}
        <motion.line x1="5%" y1="15%" x2="95%" y2="75%" stroke="url(#ai-line1)" strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3, delay: 0.5 }} />
        <motion.line x1="85%" y1="10%" x2="15%" y2="85%" stroke="url(#ai-line3)" strokeWidth="0.6"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 4, delay: 1 }} />
        <motion.line x1="10%" y1="45%" x2="90%" y2="50%" stroke="url(#ai-line2)" strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3.5, delay: 1.5 }} />
        
        {/* Additional crossing lines */}
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

        {/* Node circles at intersections */}
        <motion.circle cx="75%" cy="25%" r="3.5" fill="hsl(220 70% 55%)" fillOpacity="0.18"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2 }} />
        <motion.circle cx="25%" cy="70%" r="3" fill="hsl(192 80% 50%)" fillOpacity="0.15"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.3 }} />
        <motion.circle cx="50%" cy="47%" r="4" fill="hsl(200 70% 52%)" fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.6 }} />
        <motion.circle cx="15%" cy="30%" r="2.5" fill="hsl(220 70% 55%)" fillOpacity="0.14"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 2.8 }} />
        <motion.circle cx="85%" cy="60%" r="2" fill="hsl(192 80% 50%)" fillOpacity="0.12"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3 }} />
        <motion.circle cx="40%" cy="15%" r="2" fill="hsl(195 75% 48%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.2 }} />
        <motion.circle cx="65%" cy="80%" r="2.5" fill="hsl(220 70% 55%)" fillOpacity="0.11"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.4 }} />
        <motion.circle cx="90%" cy="40%" r="2" fill="hsl(200 70% 52%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.6 }} />
        <motion.circle cx="10%" cy="55%" r="1.5" fill="hsl(192 80% 50%)" fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 3.8 }} />

        {/* Orbit rings */}
        <motion.circle cx="50%" cy="50%" r="280" fill="none" stroke="hsl(220 70% 55%)" strokeWidth="0.5" strokeOpacity="0.05" strokeDasharray="8 16"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ scale: { duration: 2, delay: 1 }, opacity: { duration: 2, delay: 1 }, rotate: { duration: 120, repeat: Infinity, ease: 'linear' } }} />
        <motion.circle cx="50%" cy="50%" r="450" fill="none" stroke="hsl(192 80% 50%)" strokeWidth="0.3" strokeOpacity="0.035" strokeDasharray="4 20"
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: -360 }}
          transition={{ scale: { duration: 2, delay: 1.5 }, opacity: { duration: 2, delay: 1.5 }, rotate: { duration: 180, repeat: Infinity, ease: 'linear' } }} />

        {/* Neural burst — top right */}
        <g opacity="0.12">
          <motion.circle cx="72%" cy="18%" r="6" fill="url(#ai-line1-fill)" 
            initial={{ scale: 0 }} animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="72%" cy="18%" r="18" fill="none" stroke="hsl(220 70% 55%)" strokeWidth="0.4" strokeOpacity="0.3" strokeDasharray="3 6" />
          <circle cx="72%" cy="18%" r="35" fill="none" stroke="hsl(192 80% 50%)" strokeWidth="0.3" strokeOpacity="0.15" strokeDasharray="2 8" />
          
          {[
            { x2: '85%', y2: '8%', curve: '76% 12%' },
            { x2: '90%', y2: '22%', curve: '80% 16%' },
            { x2: '88%', y2: '32%', curve: '78% 22%' },
            { x2: '60%', y2: '6%', curve: '68% 10%' },
            { x2: '55%', y2: '15%', curve: '64% 14%' },
            { x2: '62%', y2: '28%', curve: '66% 22%' },
            { x2: '80%', y2: '5%', curve: '74% 8%' },
            { x2: '95%', y2: '16%', curve: '82% 14%' },
            { x2: '58%', y2: '24%', curve: '65% 20%' },
            { x2: '82%', y2: '30%', curve: '76% 26%' },
          ].map((path, i) => (
            <motion.path
              key={`neural-burst-${i}`}
              d={`M 72% 18% Q ${path.curve} ${path.x2} ${path.y2}`}
              fill="none"
              stroke={i % 2 === 0 ? 'hsl(220 70% 55%)' : 'hsl(192 80% 50%)'}
              strokeWidth={0.6 - i * 0.03}
              strokeOpacity={0.5 - i * 0.03}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2 + i * 0.3, delay: 1.5 + i * 0.15, ease: 'easeOut' }}
            />
          ))}
          {[
            { cx: '85%', cy: '8%' }, { cx: '90%', cy: '22%' }, { cx: '88%', cy: '32%' },
            { cx: '60%', cy: '6%' }, { cx: '55%', cy: '15%' }, { cx: '62%', cy: '28%' },
            { cx: '80%', cy: '5%' }, { cx: '95%', cy: '16%' },
          ].map((node, i) => (
            <motion.circle
              key={`burst-node-${i}`}
              cx={node.cx} cy={node.cy} r={1.5}
              fill={i % 2 === 0 ? 'hsl(220 70% 55%)' : 'hsl(192 80% 50%)'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 0.5, delay: 2.5 + i * 0.2 }}
            />
          ))}
        </g>

        {/* Second neural burst — bottom left */}
        <g opacity="0.09">
          <motion.circle cx="22%" cy="75%" r="5" fill="url(#ai-line3-fill)"
            initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
          <circle cx="22%" cy="75%" r="22" fill="none" stroke="hsl(192 80% 50%)" strokeWidth="0.3" strokeOpacity="0.25" strokeDasharray="3 8" />
          {[
            { x2: '10%', y2: '68%', curve: '16% 70%' },
            { x2: '8%', y2: '80%', curve: '14% 78%' },
            { x2: '15%', y2: '88%', curve: '18% 82%' },
            { x2: '35%', y2: '70%', curve: '28% 72%' },
            { x2: '38%', y2: '82%', curve: '30% 78%' },
            { x2: '30%', y2: '65%', curve: '26% 68%' },
            { x2: '12%', y2: '62%', curve: '18% 66%' },
            { x2: '32%', y2: '88%', curve: '28% 84%' },
          ].map((path, i) => (
            <motion.path
              key={`neural-burst2-${i}`}
              d={`M 22% 75% Q ${path.curve} ${path.x2} ${path.y2}`}
              fill="none"
              stroke={i % 2 === 0 ? 'hsl(192 80% 50%)' : 'hsl(220 70% 55%)'}
              strokeWidth={0.5 - i * 0.03}
              strokeOpacity={0.4 - i * 0.03}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.5 + i * 0.2, delay: 3 + i * 0.2, ease: 'easeOut' }}
            />
          ))}
        </g>

        {/* Radial fill defs for neural bursts */}
        <defs>
          <radialGradient id="ai-line1-fill">
            <stop offset="0%" stopColor="hsl(220 70% 65%)" />
            <stop offset="100%" stopColor="hsl(220 70% 45%)" />
          </radialGradient>
          <radialGradient id="ai-line3-fill">
            <stop offset="0%" stopColor="hsl(192 85% 55%)" />
            <stop offset="100%" stopColor="hsl(192 75% 40%)" />
          </radialGradient>
        </defs>
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

      {/* Grid overlay */}
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
