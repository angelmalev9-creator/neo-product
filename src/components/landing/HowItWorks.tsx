import { Globe, Brain, Code2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Globe,
    number: '01',
    title: 'Добавяте сайта',
    desc: 'Въведете URL адреса и NEO анализира целия ви сайт — услуги, цени, информация.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Brain,
    number: '02',
    title: 'NEO се обучава',
    desc: 'За минути NEO научава бизнеса ви и е готов да отговаря като човек.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: Code2,
    number: '03',
    title: 'Вграждате 1 ред код',
    desc: 'Поставяте един скрипт тагт на сайта — NEO заработва моментално.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="how-it-works"
      className={`py-20 sm:py-28 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-5 uppercase tracking-wider">
            Как работи
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground leading-[1.08] tracking-tight">
            3 стъпки.{' '}
            <span className="neo-gradient-text">5 минути. Готово.</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center group"
            >
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border/30 to-border/10" />
              )}

              <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-8 h-8 ${step.color}`} strokeWidth={1.5} />
              </div>

              <span className={`text-[10px] font-bold ${step.color} uppercase tracking-[0.2em] mb-2 block`}>
                Стъпка {step.number}
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
