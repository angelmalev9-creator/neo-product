import { Star, Quote } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Иван П.',
    role: 'Стоматологичен кабинет',
    content: 'NEO спести на екипа ни 4 часа на ден. Клиентите дори не разбират, че говорят с AI.',
    initials: 'ИП',
  },
  {
    name: 'Мария К.',
    role: 'Салон за красота',
    content: 'Откакто NEO отговаря на обажданията ни, не сме пропуснали нито един клиент.',
    initials: 'МК',
  },
  {
    name: 'Георги Д.',
    role: 'Автосервиз',
    content: 'Настройката отне 30 секунди. Буквално сложих линка на сайта и NEO беше готов.',
    initials: 'ГД',
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
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            Какво казват <span className="text-primary">нашите клиенти</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-md mx-auto">
            Бизнеси, които вече работят с NEO.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative rounded-2xl border border-border/15 bg-card/30 backdrop-blur-sm p-6 hover:border-primary/20 transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-primary/10" />

              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="text-sm text-foreground/80 leading-relaxed mb-6">
                &laquo;{t.content}&raquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-xs font-black text-foreground">
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
      </div>
    </section>
  );
};

export default Testimonials;
