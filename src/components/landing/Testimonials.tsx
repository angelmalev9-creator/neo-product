import { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  { name: 'Д-р Мария Петрова', role: 'Собственик на стоматологична клиника', business: 'ДенталКеър София', content: 'NEO отговаря на над 80% от обажданията ни извън работно време. Пациентите записват часове в 2 часа през нощта, а сутринта виждам потвърдени записвания. Спестихме една цяла заплата на рецепционист.', rating: 5, initials: 'МП', metric: '80%', metricLabel: 'автоматични отговори' },
  { name: 'Георги Иванов', role: 'Управител на автосервиз', business: 'АвтоЕксперт Пловдив', content: 'Преди губехме клиенти, защото не вдигахме телефона докато сме под колите. Сега NEO обяснява услугите, дава ориентировъчни цени и записва часове. Приходите ни скочиха с 30% за първия месец.', rating: 5, initials: 'ГИ', metric: '+30%', metricLabel: 'ръст в приходите' },
  { name: 'Елена Николова', role: 'Собственик на салон за красота', business: 'BeautyLab Варна', content: 'Клиентките ми обичат, че могат да питат за свободни часове по всяко време. NEO знае всички ни услуги и цени. Най-доброто е, че говори на 3 езика — перфектно за туристите през лятото!', rating: 5, initials: 'ЕН', metric: '3', metricLabel: 'езика поддържа' },
  { name: 'Стоян Димитров', role: 'Управител на фитнес център', business: 'PowerGym Бургас', content: 'Имахме проблем с пропуснати обаждания в пиковите часове. Сега NEO поема всичко — от въпроси за абонаменти до записване за персонални тренировки. Инвестицията се изплати за 2 седмици.', rating: 5, initials: 'СД', metric: '2 седм.', metricLabel: 'за ROI' },
];

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => { setDirection(1); setCurrent(p => (p + 1) % testimonials.length); }, []);
  const prev = useCallback(() => { setDirection(-1); setCurrent(p => (p - 1 + testimonials.length) % testimonials.length); }, []);

  useEffect(() => {
    if (isPaused || !isVisible) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPaused, isVisible, next]);

  const t = testimonials[current];
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="testimonials"
      className={`py-20 sm:py-24 lg:py-28 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-5xl">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-medium mb-3">
            Доверието говори
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-foreground mb-2 max-w-2xl mx-auto leading-tight tracking-tight">
            <PencilUnderline>Какво казват</PencilUnderline>{' '}
            <span className="neo-gradient-text">клиентите</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Реални бизнеси. Реални резултати. Без филтри.
          </p>
        </div>

        <div className="max-w-3xl mx-auto" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="relative min-h-[280px] sm:min-h-[260px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={current} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }} className="absolute inset-0">
                <div className="relative rounded-xl sm:rounded-2xl border border-border/25 bg-card/40 backdrop-blur-lg p-5 sm:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/15">
                        <span className="text-xl font-black text-primary">{t.metric}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{t.metricLabel}</span>
                    </div>
                    <Quote className="w-8 h-8 text-primary/8 shrink-0" />
                  </div>

                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <blockquote className="text-sm sm:text-base text-foreground/85 leading-relaxed mb-5 font-medium">
                    "{t.content}"
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 flex items-center justify-center text-sm font-black text-foreground">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                      <p className="text-xs text-primary font-semibold">{t.business}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-5 mt-6">
            <button onClick={prev} className="w-9 h-9 rounded-full border border-border/25 bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {testimonials.map((_, idx) => (
                <button key={idx} onClick={() => { setDirection(idx > current ? 1 : -1); setCurrent(idx); }} className="p-1">
                  <div className={`h-1.5 rounded-full transition-all duration-400 ${idx === current ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/25'}`} />
                </button>
              ))}
            </div>
            <button onClick={next} className="w-9 h-9 rounded-full border border-border/25 bg-card/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
