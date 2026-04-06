import { Globe, Brain, Code2, Play, Clock } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Globe,
    number: '01',
    title: 'Добавяте сайта',
    desc: 'Въведете URL адреса и NEO анализира целия Ви сайт — услуги, цени, информация.',
    detail: 'Отнема под 30 секунди',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  {
    icon: Brain,
    number: '02',
    title: 'NEO се обучава',
    desc: 'За минути NEO научава бизнеса Ви и е готов да отговаря като професионален рецепционист.',
    detail: 'Без ръчна конфигурация',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
  {
    icon: Code2,
    number: '03',
    title: 'Вграждате 1 ред код',
    desc: 'Поставяте един скрипт таг на сайта — NEO заработва моментално и поема клиентите Ви.',
    detail: 'Копирай, постави — готово',
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
        <div className="text-center mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-5 uppercase tracking-[0.15em]">
            Как работи
          </span>
          <h2 className="neo-heading-section font-black text-foreground mb-4 font-mono">
            3 стъпки.{' '}
            <span className="text-primary">5 минути. Готово.</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            Не е необходим технически опит. Ако можете да копирате текст — можете да настроите NEO.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-violet-500/20 to-emerald-500/20 hidden sm:block" />

          <div className="space-y-8 sm:space-y-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative flex items-start gap-5 sm:gap-8 group"
              >
                <div className={`relative z-10 shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${step.color}`} strokeWidth={1.5} />
                </div>

                <div className="pt-1 sm:pt-2.5">
                  <span className={`text-[9px] font-bold ${step.color} uppercase tracking-[0.2em] mb-1.5 block`}>
                    Стъпка {step.number}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mb-2">{step.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-foreground/30 font-medium">
                    <Clock className="w-3 h-3" />
                    {step.detail}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 text-center sm:text-left sm:ml-20"
          >
            <Button
              className="neo-btn-primary text-xs px-6 py-3 h-auto font-bold rounded-full group gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Изпробвайте сега — без регистрация
            </Button>
            <p className="text-[10px] text-foreground/20 mt-3 sm:ml-1">
              Повечето бизнеси стартират за под 5 минути
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
