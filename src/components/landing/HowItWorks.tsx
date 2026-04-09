import { Link, Settings, Rocket } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Link,
    number: '01',
    title: 'Добавете линка на сайта си',
    desc: 'NEO анализира съдържанието и се обучава за секунди.',
  },
  {
    icon: Settings,
    number: '02',
    title: 'Настройте поведението',
    desc: 'Изберете глас, тон и какво да прави NEO — резервации, запитвания, информация.',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Готово — NEO работи',
    desc: 'Добавете уиджета на сайта си с един ред код. Или свържете телефонен номер.',
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
          <p className="text-xs font-medium uppercase tracking-[0.15em] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Как работи
          </p>
          <h2 className="neo-heading-section font-bold mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
            3 стъпки. <span className="neo-gradient-text">5 минути. Готово.</span>
          </h2>
          <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" strokeWidth={1.5} />
              </div>

              {/* Number */}
              <span className="text-2xl sm:text-3xl font-bold neo-gradient-text mb-3">
                {step.number}
              </span>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{step.title}</h3>

              {/* Description */}
              <p className="text-xs sm:text-sm leading-relaxed max-w-[220px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
