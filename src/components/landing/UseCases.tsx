import { Stethoscope, Scissors, Car, Dumbbell, Building2, Clock, TrendingUp, Users, PhoneOff, PhoneCall, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import usecaseClinic from '@/assets/usecase-clinic.png';
import usecaseSalon from '@/assets/usecase-salon.png';
import usecaseAuto from '@/assets/usecase-auto.png';
import usecaseFitness from '@/assets/usecase-fitness.png';
import usecaseHotel from '@/assets/usecase-hotel.png';

const industries = [
  {
    icon: Stethoscope,
    title: 'Клиники',
    subtitle: 'AI рецепционист за Вашата клиника',
    description: 'NEO записва пациенти, отговаря на въпроси за услуги и цени — без чакане на линия.',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    accentBg: 'bg-emerald-500/15',
    image: usecaseClinic,
    savings: '~1 200 EUR/мес',
    available: '24/7',
    before: [
      'Пациенти чакат по 5–10 мин на линия',
      'Пропуснати обаждания = загубени часове',
      'Рецепцията е натоварена и прави грешки',
    ],
    after: [
      'Мигновен отговор без чакане',
      'Всяко обаждане е обслужено автоматично',
      'Точни записвания без човешки грешки',
    ],
    stat: { label: 'по-малко пропуснати', value: '94%' },
  },
  {
    icon: Scissors,
    title: 'Салони за красота',
    subtitle: 'Автоматизирайте записванията в салона',
    description: 'NEO управлява записвания, информира за свободни часове и напомня на клиентите.',
    color: 'text-pink-400',
    bg: 'from-pink-500/20 to-pink-500/5',
    border: 'border-pink-500/30',
    accentBg: 'bg-pink-500/15',
    image: usecaseSalon,
    savings: '~900 EUR/мес',
    available: '24/7',
    before: [
      'Клиенти не могат да се запишат извън работно време',
      'Рецепцията пропуска обаждания по време на процедури',
      'Ръчно напомняне за часове',
    ],
    after: [
      'Записване по всяко време — ден и нощ',
      'Нито едно обаждане не остава без отговор',
      'Автоматични напомняния преди часа',
    ],
    stat: { label: 'повече записвания', value: '+38%' },
  },
  {
    icon: Car,
    title: 'Автосервизи',
    subtitle: 'Интелигентен асистент за автосервиза',
    description: 'NEO приема заявки за ремонт, дава ориентировъчни цени и насочва клиентите.',
    color: 'text-amber-400',
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    accentBg: 'bg-amber-500/15',
    image: usecaseAuto,
    savings: '~1 000 EUR/мес',
    available: '24/7',
    before: [
      'Механиците нямат време да отговарят на телефона',
      'Клиенти се обаждат в друг сервиз при липса на отговор',
      'Няма система за проследяване на запитвания',
    ],
    after: [
      'NEO отговаря докато екипът работи',
      'Всеки клиент получава бърз отговор',
      'Всяко запитване е записано и проследимо',
    ],
    stat: { label: 'спестено време', value: '12ч/сед' },
  },
  {
    icon: Dumbbell,
    title: 'Фитнеси',
    subtitle: 'AI рецепция за Вашия фитнес',
    description: 'NEO записва за тренировки, отговаря за абонаменти и графици на треньори.',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
    accentBg: 'bg-cyan-500/15',
    image: usecaseFitness,
    savings: '~800 EUR/мес',
    available: '24/7',
    before: [
      'Рецепцията е заета с клиенти на място',
      'Пропуснати обаждания за записвания за тренировки',
      'Информация за абонаменти — само на място',
    ],
    after: [
      'Обажданията се обработват автоматично',
      'Записване за персонална тренировка без чакане',
      'Информация за абонаменти — по телефона, 24/7',
    ],
    stat: { label: 'по-доволни клиенти', value: '+45%' },
  },
  {
    icon: Building2,
    title: 'Хотели',
    subtitle: 'Виртуален рецепционист за хотела',
    description: 'NEO отговаря на запитвания за стаи, наличност и прави резервации автоматично.',
    color: 'text-violet-400',
    bg: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
    accentBg: 'bg-violet-500/15',
    image: usecaseHotel,
    savings: '~1 500 EUR/мес',
    available: '24/7',
    before: [
      'Гости чакат на линия за проверка на наличност',
      'Нощна смяна = допълнителни разходи за персонал',
      'Езикова бариера с чуждестранни гости',
    ],
    after: [
      'Мигновена проверка и резервация',
      'NEO работи нощна смяна — безплатно',
      'Многоезична комуникация без усилие',
    ],
    stat: { label: 'повече резервации', value: '+27%' },
  },
];

const UseCases = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          setIsLocked(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isLocked) return;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 600) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 20) {
        e.preventDefault();
        lastScrollTime.current = now;
        setActiveIndex((prev) => {
          if (prev >= industries.length - 1) {
            setIsLocked(false);
            return prev;
          }
          return prev + 1;
        });
      } else if (e.deltaY < -20) {
        e.preventDefault();
        lastScrollTime.current = now;
        setActiveIndex((prev) => {
          if (prev <= 0) {
            setIsLocked(false);
            return prev;
          }
          return prev - 1;
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 600) {
        e.preventDefault();
        return;
      }

      const deltaY = touchStartY.current - e.touches[0].clientY;

      if (Math.abs(deltaY) > 30) {
        e.preventDefault();
        lastScrollTime.current = now;

        if (deltaY > 0) {
          setActiveIndex((prev) => {
            if (prev >= industries.length - 1) {
              setIsLocked(false);
              return prev;
            }
            return prev + 1;
          });
        } else {
          setActiveIndex((prev) => {
            if (prev <= 0) {
              setIsLocked(false);
              return prev;
            }
            return prev - 1;
          });
        }
      }
    };

    const section = sectionRef.current;
    if (!section) return;

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Keep section in view while locked
    section.scrollIntoView({ block: 'start', behavior: 'smooth' });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLocked]);

  const current = industries[activeIndex];
  const Icon = current.icon;

  return (
    <section
      ref={sectionRef}
      id="use-cases"
      className="min-h-screen relative py-8 sm:py-12 flex flex-col"
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-2">
            За всеки бизнес,{' '}
            <span className="text-primary">който говори с клиенти</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            NEO се адаптира към Вашата индустрия за минути.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {industries.map((ind, i) => (
            <button
              key={ind.title}
              onClick={() => setActiveIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                i === activeIndex
                  ? `w-8 h-2 ${ind.accentBg.replace('/15', '/60')}`
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={ind.title}
            />
          ))}
          <span className="ml-3 text-xs text-muted-foreground font-medium">
            {activeIndex + 1} / {industries.length}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-full"
            >
              <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center max-w-5xl mx-auto">
                {/* Left: Image */}
                <div className={`relative rounded-2xl overflow-hidden border ${current.border} shadow-2xl`}>
                  <img
                    src={current.image}
                    alt={current.title}
                    width={1254}
                    height={1254}
                    className="w-full h-auto"
                  />
                  {/* Overlay badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className={`${current.accentBg} backdrop-blur-md border ${current.border} rounded-xl px-3 py-1.5 flex items-center gap-2`}>
                      <Icon className={`w-4 h-4 ${current.color}`} strokeWidth={2} />
                      <span className="text-xs font-bold text-foreground">{current.title}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-background/80 backdrop-blur-md border border-border/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-primary">{current.available} достъпен</span>
                    </div>
                  </div>
                </div>

                {/* Right: Info */}
                <div className="space-y-5">
                  {/* Title & description */}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${current.color} mb-1`}>
                      {current.subtitle}
                    </p>
                    <h3 className="text-lg sm:text-xl font-display font-black text-foreground mb-2">
                      {current.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {current.description}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div className={`${current.accentBg} border ${current.border} rounded-xl px-4 py-2.5 text-center`}>
                      <div className={`text-xl font-black ${current.color}`}>{current.stat.value}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{current.stat.label}</div>
                    </div>
                    <div className={`${current.accentBg} border ${current.border} rounded-xl px-4 py-2.5 text-center`}>
                      <div className="text-xl font-black text-emerald-400">{current.savings}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">спестявате месечно</div>
                    </div>
                    <div className={`${current.accentBg} border ${current.border} rounded-xl px-4 py-2.5 text-center`}>
                      <div className="text-xl font-black text-primary">24/7</div>
                      <div className="text-[10px] text-muted-foreground font-medium">без почивка</div>
                    </div>
                  </div>

                  {/* Before / After comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <PhoneOff className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-bold text-red-400">Без NEO</span>
                      </div>
                      <ul className="space-y-1.5">
                        {current.before.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <XCircle className="w-3 h-3 text-red-400/70 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-muted-foreground leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* After */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">С NEO</span>
                      </div>
                      <ul className="space-y-1.5">
                        {current.after.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400/70 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-muted-foreground leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Scroll hint */}
                  {isLocked && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 pt-2"
                    >
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-5 h-8 rounded-full border border-muted-foreground/30 flex items-start justify-center pt-1.5"
                      >
                        <div className="w-1 h-1.5 rounded-full bg-muted-foreground/50" />
                      </motion.div>
                      <span className="text-[10px] text-muted-foreground/50">
                        Скролнете за {activeIndex < industries.length - 1 ? 'следващата индустрия' : 'продължение'}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
