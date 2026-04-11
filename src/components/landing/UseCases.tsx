import { useState } from 'react';
import { Stethoscope, Scissors, Car, Dumbbell, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const industries = [
  {
    icon: Stethoscope, title: 'Клиники',
    tagline: 'Пациентите записват часове, докато спите.',
    benefits: [
      'Пациентите записват часове в 2 сутринта, без да чакат рецепцията.',
      'Автоматично попълва свободните часове в графика на лекаря.',
      'Напомня за часа ден преди срещата — намалява отсъствията с 40%.',
      'Обяснява подготовка за прегледи на български и английски.',
    ],
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',
    savings: '~1 200 EUR/мес спестявания',
  },
  {
    icon: Scissors, title: 'Салони',
    tagline: 'Записвания ден и нощ — без рецепция.',
    benefits: [
      'Клиентките записват час по телефона в 10 вечерта.',
      'NEO предлага свободен час при любимия стилист.',
      'Изпраща напомняне с час и адрес на салона.',
      'Събира имейл и телефон за бъдещи промоции.',
    ],
    color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/25',
    savings: '~900 EUR/мес спестявания',
  },
  {
    icon: Car, title: 'Автосервизи',
    tagline: 'NEO приема заявки, докато екипът работи.',
    benefits: [
      'Клиентите описват проблема, NEO записва заявка.',
      'Дава ориентировъчни цени за стандартни услуги.',
      'Приема обаждания, докато механиците са под колата.',
      'Събира марка, модел и описание преди визитата.',
    ],
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25',
    savings: '~1 000 EUR/мес спестявания',
  },
  {
    icon: Dumbbell, title: 'Фитнеси',
    tagline: 'Записвания за тренировки без чакане.',
    benefits: [
      'Нови клиенти питат за абонаменти в 6 сутринта — NEO отговаря.',
      'Записва за персонална тренировка в свободен слот.',
      'Обяснява разликата между плановете без човешка намеса.',
      'Изпраща линк за плащане след записване.',
    ],
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25',
    savings: '~800 EUR/мес спестявания',
  },
  {
    icon: Building2, title: 'Хотели',
    tagline: 'Резервации на 3 езика — без нощна смяна.',
    benefits: [
      'Гости резервират стая на български, английски или руски.',
      'NEO проверява наличност и потвърждава дати.',
      'Отговаря на въпроси за паркинг, закуска и настаняване.',
      'Събира данни за фактура автоматично.',
    ],
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25',
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-3 font-mono">
            Работи за бизнеси, <span className="text-accent">които живеят от обаждания.</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            Настройва се за Вашата индустрия за минути — без технически познания.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {current.benefits.map((b, j) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: j * 0.08 }}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-card/40 border border-border/10"
                >
                  <CheckCircle2 className={`w-4 h-4 ${current.color} shrink-0 mt-0.5`} />
                  <span className="text-xs text-foreground/80 font-medium leading-relaxed">{b}</span>
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
                Пробвайте за Вашия бизнес <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UseCases;
