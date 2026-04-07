const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -5 }}>
      {/* Large blurred dots */}
      {[
        { x: '10%', y: '15%', size: 180, opacity: 0.04 },
        { x: '75%', y: '10%', size: 220, opacity: 0.035 },
        { x: '60%', y: '55%', size: 260, opacity: 0.03 },
        { x: '25%', y: '70%', size: 200, opacity: 0.04 },
        { x: '85%', y: '75%', size: 160, opacity: 0.045 },
        { x: '40%', y: '30%', size: 140, opacity: 0.03 },
        { x: '5%', y: '50%', size: 190, opacity: 0.035 },
        { x: '50%', y: '85%', size: 170, opacity: 0.04 },
        { x: '90%', y: '40%', size: 150, opacity: 0.03 },
        { x: '30%', y: '5%', size: 130, opacity: 0.035 },
        { x: '70%', y: '35%', size: 200, opacity: 0.025 },
        { x: '15%', y: '90%', size: 240, opacity: 0.03 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
