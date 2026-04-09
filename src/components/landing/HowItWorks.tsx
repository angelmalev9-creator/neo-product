import { Link, Settings, Rocket, Play } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Link,
    number: '01',
    title: 'Добавете линка на сайта си',
    desc: 'NEO анализира съдържанието и се обучава за секунди.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_30px_-5px_hsl(355_65%_52%/0.25)]',
  },
  {
    icon: Settings,
    number: '02',
    title: 'Настройте поведението',
    desc: 'Изберете глас, тон и какво да прави NEO — резервации, запитвания, информация.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    glow: 'shadow-[0_0_30px_-5px_hsl(270_60%_50%/0.25)]',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Готово — NEO работи',
    desc: 'Добавете уиджета на сайта си с един ред код. Или свържете телефонен номер.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_30px_-5px_hsl(160_60%_40%/0.25)]',
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="how-it-works"
      className={`neo-section-spacing relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-foreground/15 text-foreground/70 text-[11px] font-semibold uppercase tracking-[0.2em] mb-6">
            Как работи
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 font-mono">
            3 стъпки.{' '}
            <span className="text-primary">5 минути. Готово.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Ако можете да копирате текст — можете да настроите NEO.
          </p>
        </div>

        {/* 3-column cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col items-center text-center group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${step.bg} border ${step.border} ${step.glow} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${step.color}`} strokeWidth={1.5} />
              </div>

              {/* Number */}
              <span className={`text-2xl sm:text-3xl font-black ${step.color} font-mono mb-3`}>
                {step.number}
              </span>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{step.title}</h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 sm:mt-14 text-center"
        >
          <Button
            className="neo-btn-primary text-xs sm:text-sm px-8 py-3.5 h-auto font-bold rounded-full group gap-2"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Изпробвайте сега — без регистрация
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
