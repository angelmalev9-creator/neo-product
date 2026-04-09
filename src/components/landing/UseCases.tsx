import { useState } from 'react';
import { Stethoscope, Scissors, Car, Dumbbell, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const industries = [
  {
    icon: Stethoscope, title: 'Клиники',
    tagline: 'Пациентите записват часове 24/7',
    benefits: ['Мигновен отговор без чакане', 'Автоматични записвания', '94% по-малко пропуснати'],
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',
    savings: '~1 200 EUR/мес спестявания',
  },
  {
    icon: Scissors, title: 'Салони',
    tagline: 'Записвания ден и нощ — без рецепция',
    benefits: ['Записване извън работно време', 'Автоматични напомняния', '+38% повече записвания'],
    color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/25',
    savings: '~900 EUR/мес спестявания',
  },
  {
    icon: Car, title: 'Автосервизи',
    tagline: 'NEO приема заявки докато екипът работи',
    benefits: ['Отговаря вместо механиците', 'Дава ориентировъчни цени', '12ч/сед спестено време'],
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25',
    savings: '~1 000 EUR/мес спестявания',
  },
  {
    icon: Dumbbell, title: 'Фитнеси',
    tagline: 'Записвания за тренировки без чакане',
    benefits: ['Информация за абонаменти 24/7', 'Записване за персонални', '+45% по-доволни клиенти'],
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25',
    savings: '~800 EUR/мес спестявания',
  },
  {
    icon: Building2, title: 'Хотели',
    tagline: 'Резервации на 3 езика — без нощна смяна',
    benefits: ['Мигновена проверка на наличност', 'Многоезична комуникация', '+27% повече резервации'],
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25',
    savings: '~1 500 EUR/мес спестявания',
  },
];

const UseCases = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState(0);
  const current = industries[active];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="use-cases"
      className="neo-section-spacing relative"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            За всеки бизнес, <span className="text-primary">който говори с клиенти</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            NEO се адаптира към Вашата индустрия за минути.
          </p>
        </div>

        {/* Industry tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {industries.map((ind, i) => (
            <button
              key={ind.title}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                active === i
                  ? `${ind.bg} ${ind.border} border ${ind.color} shadow-lg`
                  : 'border border-border/15 text-muted-foreground hover:text-foreground hover:border-border/30'
              }`}
            >
              <ind.icon className="w-3.5 h-3.5" />
              {ind.title}
            </button>
          ))}
        </div>

        {/* Active industry card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="neo-glass-premium rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-xl ${current.bg} border ${current.border} flex items-center justify-center`}>
                <current.icon className={`w-6 h-6 ${current.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{current.title}</h3>
                <p className="text-sm text-muted-foreground">{current.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {current.benefits.map((b, j) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: j * 0.1 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card/40 border border-border/10"
                >
                  <CheckCircle2 className={`w-4 h-4 ${current.color} shrink-0`} />
                  <span className="text-xs text-foreground/80 font-medium">{b}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/10">
              <span className="text-sm font-bold text-neo-success">{current.savings}</span>
              <Button
                variant="ghost"
                className="text-xs font-bold text-primary gap-1.5 hover:bg-primary/10 w-full sm:w-auto"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Изпробвайте за Вашия бизнес <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UseCases;
