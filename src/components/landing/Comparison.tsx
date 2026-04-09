import { Check, X, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const rows = [
  { label: 'Работно време', employee: '8ч/ден', neo: '24/7/365' },
  { label: 'Месечна цена', employee: '~1 000 EUR', neo: 'от 25 EUR' },
  { label: 'Пропуснати клиенти', employee: 'Често', neo: 'Никога' },
  { label: 'Едновременни разговори', employee: '1', neo: '∞' },
  { label: 'Записва часове', employee: 'Ръчно', neo: 'Автоматично' },
  { label: 'Събира контакти', employee: 'Понякога', neo: 'Винаги' },
];

const Comparison = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="comparison"
      className="neo-section-spacing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            NEO vs <span className="text-primary">Служител</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-md mx-auto">
            Същата работа — 40 пъти по-евтино.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto rounded-2xl border border-border/15 bg-card/30  overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border/10 bg-card/50">
            <div className="px-4 py-3" />
            <div className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center border-x border-border/8">
              Служител
            </div>
            <div className="px-4 py-3 text-[10px] font-bold text-primary uppercase tracking-widest text-center">
              NEO
            </div>
          </div>

          {rows.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 ${i < rows.length - 1 ? 'border-b border-border/8' : ''} hover:bg-card/30 transition-colors`}>
              <div className="px-4 py-3 text-xs sm:text-sm text-foreground font-medium">{row.label}</div>
              <div className="px-4 py-3 text-xs sm:text-sm text-muted-foreground text-center border-x border-border/8 flex items-center justify-center gap-1.5">
                <X className="w-3 h-3 text-red-400/50 shrink-0" />
                <span className="hidden sm:inline">{row.employee}</span>
                <span className="sm:hidden text-[11px]">{row.employee}</span>
              </div>
              <div className="px-4 py-3 text-xs sm:text-sm text-foreground font-medium text-center flex items-center justify-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                {row.neo}
              </div>
            </div>
          ))}

          {/* Bottom */}
          <div className="border-t border-primary/15 bg-primary/5 px-4 py-3.5 grid grid-cols-3 items-center">
            <span className="text-[11px] font-bold text-foreground">Годишна цена</span>
            <span className="text-center text-sm font-bold text-red-400/70 line-through">12 000 EUR</span>
            <span className="text-center text-sm font-black text-primary">от 300 EUR</span>
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 w-full sm:w-auto"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Пресметнете колко спестявате <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
