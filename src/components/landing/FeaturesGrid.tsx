import { Mic, MessageSquare, Calendar, Users, Brain, BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const features = [
  { icon: Mic, title: 'Глас + чат', desc: 'Говори и пише като истински човек.', color: 'text-primary' },
  { icon: Calendar, title: 'Автоматични резервации', desc: 'Записва часове директно в календара.', color: 'text-emerald-400' },
  { icon: Users, title: 'Събира контакти', desc: 'Име, имейл, телефон — автоматично.', color: 'text-amber-400' },
  { icon: Brain, title: 'AI разбира като човек', desc: 'Естествен разговор на 3 езика.', color: 'text-violet-400' },
  { icon: MessageSquare, title: 'Работи 24/7', desc: 'Не пропуска нито едно запитване.', color: 'text-cyan-400' },
  { icon: BarChart3, title: 'Пълен контрол', desc: 'Дашборд с анализи в реално време.', color: 'text-pink-400' },
];

const FeaturesGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`py-16 sm:py-24 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            Всичко, което <span className="neo-gradient-text">ви трябва</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            NEO заменя рецепционист, чатбот и колцентър — в един инструмент.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="neo-glass-subtle p-5 lg:p-7 rounded-2xl border border-border/15 hover:border-border/30 transition-all hover:scale-[1.02] text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-card/80 border border-border/10 flex items-center justify-center">
                <f.icon className={`w-6 h-6 ${f.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
