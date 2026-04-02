import { Star, Quote, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Д-р Мария Петрова',
    role: 'Стоматологична клиника',
    business: 'ДенталКеър София',
    content: 'NEO отговаря на 80% от обажданията извън работно време. Пациентите записват часове в 2 сутринта, а сутрин виждам потвърдени записвания. Спестихме една цяла заплата.',
    metric: '80%',
    metricLabel: 'автоматични отговори',
    initials: 'МП',
    timeSaved: '15 часа седмично',
  },
  {
    name: 'Георги Иванов',
    role: 'Автосервиз',
    business: 'АвтоЕксперт Пловдив',
    content: 'Губехме клиенти, защото не вдигахме телефона. Сега NEO обяснява услугите, дава цени и записва часове. Приходите скочиха с 30% за месец.',
    metric: '+30%',
    metricLabel: 'ръст в приходите',
    initials: 'ГИ',
    timeSaved: '22 часа седмично',
  },
];

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="testimonials"
      className={`py-16 sm:py-24 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            Реални <span className="text-primary">резултати</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Бизнеси, които вече работят с NEO — и техните конкретни числа.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl p-6 sm:p-8"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/8" />

              {/* Metric */}
              <div className="flex items-center gap-3 mb-5">
                <div className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xl font-black text-primary">{t.metric}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">{t.metricLabel}</span>
                  <span className="text-[10px] text-foreground/30">{t.timeSaved} спестени</span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-sm text-foreground/85 leading-relaxed mb-6">
                &laquo;{t.content}&raquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-xs font-black text-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social proof nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-xs text-foreground/30 mb-4">
            Над 500 бизнеса в България вече използват NEO ежедневно.
          </p>
          <Button
            variant="outline"
            className="neo-glass-premium border-0 text-foreground/50 hover:text-foreground text-xs px-5 py-2.5 h-auto rounded-full font-bold gap-1.5"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Вижте плановете
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
