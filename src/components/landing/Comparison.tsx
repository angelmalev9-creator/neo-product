import { Check, X, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const rows = [
  { label: 'Работно време', employee: '8 часа', neo: '24 часа, всеки ден' },
  { label: 'Месечна цена', employee: '1,000+ EUR', neo: 'от 25 EUR' },
  { label: 'Едновременни разговори', employee: '1', neo: 'Неограничен' },
  { label: 'Записва часове автоматично', employee: 'Понякога', neo: 'Винаги' },
  { label: 'Отговаря за 2 секунди', employee: 'Не', neo: 'Да' },
  { label: 'Взима отпуск', employee: 'Да', neo: 'Не' },
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-3 font-mono">
            NEO срещу <span className="text-secondary">наемане на човек</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            NEO прави това, което хората не могат — отговаря на всички, по всяко време.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto rounded-2xl border border-secondary bg-card/30 overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border/10 bg-card/50">
            <div className="px-4 py-3" />
            <div className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center border-x border-border/8">
              Служител
            </div>
            <div className="px-4 py-3 text-[10px] font-bold text-accent uppercase tracking-widest text-center">
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
            <span className="text-center text-sm font-bold text-red-400/70 line-through">12,000+ EUR</span>
            <span className="text-center text-sm font-black text-accent">от 300 EUR</span>
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 w-full sm:w-auto"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Пробвайте NEO безплатно <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
