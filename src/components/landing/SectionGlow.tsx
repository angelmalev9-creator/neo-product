/**
 * Subtle glow divider between landing page sections.
 * Adds a radial gradient band that visually separates "подложки".
 */
const SectionGlow = ({ variant = 'blue' }: { variant?: 'blue' | 'cyan' | 'mixed' }) => {
  const gradients: Record<string, string> = {
    blue: 'radial-gradient(ellipse 70% 50% at 50% 50%, hsl(220 70% 55% / 0.07), transparent 70%)',
    cyan: 'radial-gradient(ellipse 70% 50% at 50% 50%, hsl(192 80% 50% / 0.06), transparent 70%)',
    mixed: 'radial-gradient(ellipse 80% 50% at 40% 50%, hsl(220 70% 55% / 0.05), hsl(192 80% 50% / 0.04) 50%, transparent 80%)',
  };

  return (
    <div className="relative w-full h-24 -my-12 pointer-events-none select-none" aria-hidden="true">
      {/* Horizontal line accent */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 w-[60%] max-w-3xl h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{ background: gradients[variant] }}
      />
    </div>
  );
};

export default SectionGlow;
