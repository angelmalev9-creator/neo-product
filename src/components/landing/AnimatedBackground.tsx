const AnimatedBackground = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -5,
        backgroundImage:
          'radial-gradient(circle, hsl(355 50% 45% / 0.08) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        maskImage:
          'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
      }}
    />
  );
};

export default AnimatedBackground;
