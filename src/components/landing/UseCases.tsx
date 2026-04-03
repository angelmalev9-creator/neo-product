import { Stethoscope, Scissors, Car, Dumbbell, Building2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { useState } from 'react';

import usecaseClinic from '@/assets/usecase-clinic.png';
import usecaseSalon from '@/assets/usecase-salon.png';
import usecaseAuto from '@/assets/usecase-auto.png';
import usecaseFitness from '@/assets/usecase-fitness.png';
import usecaseHotel from '@/assets/usecase-hotel.png';

const industries = [
  {
    icon: Stethoscope,
    title: 'Клиники',
    example: 'Записва пациенти и отговаря на въпроси за услуги и цени.',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/15 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
    hoverBorder: 'hover:border-emerald-500/40',
    image: usecaseClinic,
  },
  {
    icon: Scissors,
    title: 'Салони за красота',
    example: 'Управлява записвания и информира за свободни часове.',
    color: 'text-pink-400',
    bg: 'from-pink-500/15 to-pink-500/5',
    border: 'border-pink-500/20',
    iconBg: 'bg-pink-500/15',
    hoverBorder: 'hover:border-pink-500/40',
    image: usecaseSalon,
  },
  {
    icon: Car,
    title: 'Автосервизи',
    example: 'Приема заявки и дава ориентировъчни цени на ремонти.',
    color: 'text-amber-400',
    bg: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15',
    hoverBorder: 'hover:border-amber-500/40',
    image: usecaseAuto,
  },
  {
    icon: Dumbbell,
    title: 'Фитнеси',
    example: 'Записва за персонални тренировки и отговаря за абонаменти.',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/15 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/15',
    hoverBorder: 'hover:border-cyan-500/40',
    image: usecaseFitness,
  },
  {
    icon: Building2,
    title: 'Хотели',
    example: 'Отговаря на запитвания за стаи и прави резервации.',
    color: 'text-violet-400',
    bg: 'from-violet-500/15 to-violet-500/5',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15',
    hoverBorder: 'hover:border-violet-500/40',
    image: usecaseHotel,
  },
];

const UseCases = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="use-cases"
      className={`py-16 sm:py-24 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            За всеки бизнес,{' '}
            <span className="text-primary">който говори с клиенти</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            NEO се адаптира към Вашата индустрия за минути.
          </p>
        </div>

        {/* Desktop: cards + preview */}
        <div className="hidden lg:grid grid-cols-[1fr_1.2fr] gap-8 max-w-5xl mx-auto items-center">
          {/* Left: industry cards */}
          <div className="space-y-3">
            {industries.map((ind, i) => (
              <motion.button
                key={ind.title}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                onClick={() => setActiveIndex(i)}
                className={`group relative w-full rounded-2xl border ${ind.border} ${ind.hoverBorder} bg-gradient-to-b ${ind.bg} p-4 text-left transition-all duration-300 ${
                  activeIndex === i ? 'scale-[1.02] ring-1 ring-white/10' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${ind.iconBg} border ${ind.border} flex items-center justify-center shrink-0`}>
                    <ind.icon className={`w-5 h-5 ${ind.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{ind.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.example}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: preview image */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-2xl overflow-hidden border border-border/20"
          >
            <img
              src={industries[activeIndex].image}
              alt={industries[activeIndex].title}
              loading="lazy"
              width={512}
              height={512}
              className="w-full h-auto rounded-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </motion.div>
        </div>

        {/* Mobile: grid */}
        <div className="lg:hidden max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className={`group relative rounded-2xl border ${ind.border} bg-gradient-to-b ${ind.bg} overflow-hidden`}
            >
              <img
                src={ind.image}
                alt={ind.title}
                loading="lazy"
                width={512}
                height={512}
                className="w-full h-32 object-cover"
              />
              <div className="p-4 text-center">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${ind.iconBg} border ${ind.border} flex items-center justify-center`}>
                  <ind.icon className={`w-5 h-5 ${ind.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{ind.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.example}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;