import { Check, X, Zap, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const rows = [
  { label: 'Работно време', employee: '8 часа/ден', neo: '24/7/365', neoWins: true },
  { label: 'Месечна цена', employee: '~1 000 EUR', neo: 'от 25 EUR', neoWins: true },
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            NEO vs <span className="text-primary">служител</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Същата работа — 40 пъти по-евтино. Без болнични, без закъснения, без пропуснати обаждания.
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
              NEO
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

          {/* Bottom row — cost anchoring */}
          <div className="border-t border-primary/15 bg-primary/5 px-5 py-4">
            <div className="grid grid-cols-3 items-center">
              <span className="text-xs font-bold text-foreground">Годишна разлика</span>
              <span className="text-center text-sm font-bold text-red-400/80 line-through">12 000 EUR</span>
              <span className="text-center text-sm font-black text-primary">от 300 EUR</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <Button
            variant="outline"
            className="neo-glass-premium border-0 text-foreground/60 hover:text-foreground text-xs px-5 py-2.5 h-auto rounded-full font-bold gap-1.5"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Пресметнете колко спестявате
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;
