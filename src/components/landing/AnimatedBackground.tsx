const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -5 }}>
      {[
        { x: '10%', y: '15%', size: 200, opacity: 0.06 },
        { x: '75%', y: '10%', size: 240, opacity: 0.05 },
        { x: '60%', y: '55%', size: 280, opacity: 0.04 },
        { x: '25%', y: '70%', size: 220, opacity: 0.05 },
        { x: '85%', y: '75%', size: 180, opacity: 0.06 },
        { x: '40%', y: '30%', size: 160, opacity: 0.04 },
        { x: '5%', y: '50%', size: 200, opacity: 0.05 },
        { x: '50%', y: '85%', size: 190, opacity: 0.05 },
        { x: '90%', y: '40%', size: 170, opacity: 0.04 },
        { x: '30%', y: '5%', size: 150, opacity: 0.05 },
        { x: '70%', y: '35%', size: 220, opacity: 0.035 },
        { x: '15%', y: '90%', size: 260, opacity: 0.04 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            background: i % 3 === 0
              ? 'radial-gradient(circle, hsl(0, 85%, 40%) 0%, hsl(0, 90%, 20%) 60%, transparent 100%)'
              : i % 3 === 1
              ? 'radial-gradient(circle, hsl(355, 80%, 35%) 0%, hsl(0, 70%, 15%) 60%, transparent 100%)'
              : 'radial-gradient(circle, hsl(0, 60%, 25%) 0%, hsl(0, 50%, 10%) 60%, transparent 100%)',
            opacity: dot.opacity,
            filter: 'blur(50px)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
