import { Link2, Settings, Rocket, Play } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Link2,
    number: '01',
    title: 'Добавете линка на сайта си',
    desc: 'NEO анализира съдържанието и се обучава за секунди.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  {
    icon: Settings,
    number: '02',
    title: 'Настройте поведението',
    desc: 'Изберете глас, тон и какво да прави NEO — резервации, запитвания, информация.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Готово — NEO работи',
    desc: 'Добавете уиджета на сайта си с един ред код. Или свържете телефонен номер.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
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
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-5 uppercase tracking-[0.15em]">
            Как работи
          </span>
          <h2 className="neo-heading-section font-black text-foreground mb-4 font-mono">
            3 стъпки.{' '}
            <span className="text-primary">5 минути. Готово.</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            Ако можете да копирате текст — можете да настроите NEO.
          </p>
        </div>

        {/* Horizontal on desktop, vertical on mobile */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-px border-t-2 border-dashed border-primary/15" />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`relative z-10 w-16 h-16 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-7 h-7 ${step.color}`} strokeWidth={1.5} />
                </div>
                <span className={`text-3xl font-black ${step.color} opacity-20 font-mono mb-2`}>
                  {step.number}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[250px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 text-center"
          >
            <Button
              className="neo-btn-primary text-xs px-6 py-3 h-auto font-bold rounded-full group gap-2 w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Изпробвайте сега — без регистрация
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
