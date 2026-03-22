import { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { PencilUnderline } from '@/components/ui/PencilUnderline';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    name: 'Д-р Мария Петрова',
    role: 'Собственик на стоматологична клиника',
    business: 'ДенталКеър София',
    content: 'NEO отговаря на над 80% от обажданията ни извън работно време. Пациентите записват часове в 2 часа през нощта, а сутринта виждам потвърдени записвания. Спестихме една цяла заплата на рецепционист.',
    rating: 5,
    initials: 'МП',
    metric: '80%',
    metricLabel: 'автоматични отговори',
  },
  {
    name: 'Георги Иванов',
    role: 'Управител на автосервиз',
    business: 'АвтоЕксперт Пловдив',
    content: 'Преди губехме клиенти, защото не вдигахме телефона докато сме под колите. Сега NEO обяснява услугите, дава ориентировъчни цени и записва часове. Приходите ни скочиха с 30% за първия месец.',
    rating: 5,
    initials: 'ГИ',
    metric: '+30%',
    metricLabel: 'ръст в приходите',
  },
  {
    name: 'Елена Николова',
    role: 'Собственик на салон за красота',
    business: 'BeautyLab Варна',
    content: 'Клиентките ми обичат, че могат да питат за свободни часове по всяко време. NEO знае всички ни услуги и цени. Най-доброто е, че говори на 3 езика — перфектно за туристите през лятото!',
    rating: 5,
    initials: 'ЕН',
    metric: '3',
    metricLabel: 'езика поддържа',
  },
  {
    name: 'Стоян Димитров',
    role: 'Управител на фитнес център',
    business: 'PowerGym Бургас',
    content: 'Имахме проблем с пропуснати обаждания в пиковите часове. Сега NEO поема всичко — от въпроси за абонаменти до записване за персонални тренировки. Инвестицията се изплати за 2 седмици.',
    rating: 5,
    initials: 'СД',
    metric: '2 седм.',
    metricLabel: 'за ROI',
  },
];

const Testimonials = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused || !isVisible) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPaused, isVisible, next]);

  const t = testimonials[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="testimonials"
      className={`py-20 lg:py-32 relative overflow-hidden neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-5 sm:px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Доверието говори
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black text-foreground mb-4 max-w-3xl mx-auto leading-[1.1] tracking-wide">
            <PencilUnderline>Какво казват</PencilUnderline>{' '}
            <span className="neo-gradient-text">клиентите</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Реални бизнеси. Реални резултати. Без филтри.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative min-h-[380px] sm:min-h-[300px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0"
              >
                <div className="relative rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-primary/5">
                  {/* Decorative gradient */}
                  <div className="absolute -z-10 inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

                  {/* Top row: metric + quote icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                        <span className="text-2xl sm:text-3xl font-black text-primary">{t.metric}</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">{t.metricLabel}</span>
                    </div>
                    <Quote className="w-10 h-10 text-primary/10 shrink-0" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <blockquote className="text-base sm:text-lg lg:text-xl text-foreground/90 leading-relaxed mb-8 font-medium">
                    "{t.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-base font-black text-foreground shadow-lg shadow-primary/10">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                      <p className="text-sm text-primary font-semibold">{t.business}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border/30 bg-card/50 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hover:scale-110"
              aria-label="Предишен"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > current ? 1 : -1);
                    setCurrent(idx);
                  }}
                  className="group relative p-1"
                  aria-label={`Отзив ${idx + 1}`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      idx === current
                        ? 'w-8 bg-primary shadow-lg shadow-primary/30'
                        : 'w-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-border/30 bg-card/50 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hover:scale-110"
              aria-label="Следващ"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Auto-play progress */}
          <div className="max-w-xs mx-auto mt-4">
            <div className="h-0.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                key={`progress-${current}`}
                className="h-full bg-primary/40 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: isPaused ? undefined : '100%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
