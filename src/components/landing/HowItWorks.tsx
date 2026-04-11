import { Link, Settings, Rocket, Play } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Link,
    number: '01',
    title: 'Поставете линка на сайта си.',
    desc: 'NEO прочита всичко — услуги, цени, работно време — и се учи сам.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_30px_-5px_hsl(355_65%_52%/0.25)]',
  },
  {
    icon: Settings,
    number: '02',
    title: 'Изберете глас и стил.',
    desc: 'Мъжки или женски, официален или приятелски. Тествайте на живо преди да пуснете.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_30px_-5px_hsl(192_80%_50%/0.25)]',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Свържете телефон или сайт.',
    desc: 'Един ред код за уиджета, или пренасочете номер към NEO. Готово.',
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
          <h2 className="text-3xl sm:text-4xl font-black mb-4 font-mono text-primary-foreground lg:text-7xl">
            Готов за 5 минути.{' '}
            <span className="text-secondary">Наистина.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Без код, без интеграции, без обаждания с продажбен отдел.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${step.bg} border ${step.border} ${step.glow} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${step.color}`} strokeWidth={1.5} />
              </div>

              <span className={`text-2xl sm:text-3xl font-black ${step.color} font-mono mb-3`}>
                {step.number}
              </span>

              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{step.title}</h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

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
            Пробвайте безплатно
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
