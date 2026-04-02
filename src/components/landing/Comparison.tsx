import { Check, X, Zap } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const rows = [
  { label: 'Работно време', employee: '8 часа/ден', neo: '24/7/365', neoWins: true },
  { label: 'Месечна цена', employee: '~€1,000', neo: 'от €25', neoWins: true },
  { label: 'Пропуснати клиенти', employee: 'Често', neo: 'Никога', neoWins: true },
  { label: 'Едновременни разговори', employee: '1', neo: 'Неограничени', neoWins: true },
  { label: 'Записва часове', employee: 'Ръчно', neo: 'Автоматично', neoWins: true },
  { label: 'Събира контакти', employee: 'Понякога', neo: 'Винаги', neoWins: true },
];

const Comparison = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="comparison"
      className={`py-16 sm:py-24 neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            NEO vs <span className="neo-gradient-text">служител</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Същата работа — 40 пъти по-евтино.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border/15 bg-card/60">
            <div className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider" />
            <div className="px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center border-x border-border/10">
              Служител
            </div>
            <div className="px-5 py-4 text-xs font-bold text-primary uppercase tracking-wider text-center">
              NEO ✦
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 ${i < rows.length - 1 ? 'border-b border-border/10' : ''} hover:bg-card/40 transition-colors`}
            >
              <div className="px-5 py-3.5 text-sm text-foreground font-medium">{row.label}</div>
              <div className="px-5 py-3.5 text-sm text-muted-foreground text-center border-x border-border/10 flex items-center justify-center gap-1.5">
                <X className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
                {row.employee}
              </div>
              <div className="px-5 py-3.5 text-sm text-foreground font-medium text-center flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {row.neo}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors text-sm"
          >
            Опитайте безплатно
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
