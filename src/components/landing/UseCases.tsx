import { Stethoscope, Scissors, Car, Dumbbell, Building2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';

const industries = [
  {
    icon: Stethoscope,
    title: 'Клиники',
    example: 'Записва пациенти и отговаря на въпроси за услуги и цени.',
    color: 'text-emerald-400',
    bg: 'from-emerald-500/15 to-emerald-500/5',
    border: 'border-emerald-500/20',
  },
  {
    icon: Scissors,
    title: 'Салони за красота',
    example: 'Управлява записвания и информира за свободни часове.',
    color: 'text-pink-400',
    bg: 'from-pink-500/15 to-pink-500/5',
    border: 'border-pink-500/20',
  },
  {
    icon: Car,
    title: 'Автосервизи',
    example: 'Приема заявки и дава ориентировъчни цени на ремонти.',
    color: 'text-amber-400',
    bg: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-500/20',
  },
  {
    icon: Dumbbell,
    title: 'Фитнеси',
    example: 'Записва за персонални тренировки и отговаря за абонаменти.',
    color: 'text-cyan-400',
    bg: 'from-cyan-500/15 to-cyan-500/5',
    border: 'border-cyan-500/20',
  },
  {
    icon: Building2,
    title: 'Хотели',
    example: 'Отговаря на запитвания за стаи и прави резервации.',
    color: 'text-violet-400',
    bg: 'from-violet-500/15 to-violet-500/5',
    border: 'border-violet-500/20',
  },
];

const UseCases = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 sm:py-24 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-4">
            За всеки бизнес,{' '}
            <span className="neo-gradient-text">който говори с клиенти</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            NEO се адаптира към вашата индустрия за минути.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group relative rounded-2xl border ${ind.border} bg-gradient-to-b ${ind.bg} p-5 text-center hover:scale-[1.04] transition-all duration-300`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-background/30 flex items-center justify-center">
                <ind.icon className={`w-6 h-6 ${ind.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{ind.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.example}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
