import { Star, Quote, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Д-р Мария Петрова',
    role: 'Стоматологична клиника',
    content: 'NEO отговаря на 80% от обажданията извън работно време. Пациентите записват часове в 2 сутринта.',
    metric: '80%', metricLabel: 'автоматични отговори', initials: 'МП',
  },
  {
    name: 'Георги Иванов',
    role: 'Автосервиз',
    content: 'Губехме клиенти, защото не вдигахме. Сега NEO обяснява услугите и записва часове. +30% приходи.',
    metric: '+30%', metricLabel: 'ръст в приходите', initials: 'ГИ',
  },
];

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="testimonials"
      className="neo-section-spacing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="neo-heading-section font-display font-black text-foreground mb-3">
            Реални <span className="text-primary">резултати</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-md mx-auto">
            Бизнеси, които вече работят с NEO.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative rounded-2xl border border-border/15 bg-card/30 backdrop-blur-xl p-6"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-primary/6" />

              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xl font-black text-primary">{t.metric}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t.metricLabel}</span>
              </div>

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="text-sm text-foreground/80 leading-relaxed mb-5">
                &laquo;{t.content}&raquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-xs font-black text-foreground">
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

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Вижте плановете <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
