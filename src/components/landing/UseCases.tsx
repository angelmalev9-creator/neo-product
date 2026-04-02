import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Stethoscope, Car, Scissors, Hotel, Briefcase, GraduationCap, MessageSquare, Calendar } from 'lucide-react';

const cases = [
  {
    icon: Stethoscope,
    niche: 'Клиники и лекари',
    question: 'Имате ли свободен час за преглед утре?',
    answer: 'Да, имаме свободен час в 14:30 при д-р Иванов. Да ви запиша?',
    action: 'Записва час автоматично',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Car,
    niche: 'Автосервизи',
    question: 'Колко струва смяна на масло на BMW E90?',
    answer: 'Смяна на масло за BMW E90 е 89 лв с включен филтър. Кога ви е удобно?',
    action: 'Дава цена + предлага час',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Scissors,
    niche: 'Салони за красота',
    question: 'Работите ли в неделя? Искам маникюр.',
    answer: 'В неделя работим от 10 до 18ч. Имаме свободно в 11:00 и 15:30.',
    action: 'Показва свободни часове',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Hotel,
    niche: 'Хотели',
    question: 'Имате ли свободна стая за уикенда?',
    answer: 'Имаме двойна стая с изглед към морето за 120 лв/нощ. Да резервирам?',
    action: 'Резервира стая',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Briefcase,
    niche: 'Агенции',
    question: 'Какви услуги предлагате за малък бизнес?',
    answer: 'За малък бизнес предлагаме пакет "Старт" — уебсайт + SEO за 499 лв/мес.',
    action: 'Квалифицира клиента',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: GraduationCap,
    niche: 'Консултанти',
    question: 'Предлагате ли безплатна първа консултация?',
    answer: 'Да, първата 30-минутна консултация е безплатна. Кога ви е удобно?',
    action: 'Записва безплатна среща',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

const UseCases = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 sm:py-36 lg:py-40 relative overflow-hidden"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20 max-w-xl mx-auto">
          <span className="neo-badge mb-5 inline-flex">Подходящ за всеки бизнес</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-foreground mb-4 leading-[1.1] tracking-[-0.02em]">
            NEO знае как да говори с{' '}
            <span className="neo-gradient-text">вашите клиенти</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-light leading-[1.6] max-w-md mx-auto">
            Независимо от нишата — NEO разбира контекста и отговаря професионално.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {cases.map((c, i) => (
            <motion.div
              key={c.niche}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group neo-glass-subtle rounded-2xl p-5 sm:p-6 hover:border-primary/15 transition-all duration-500 neo-hover-lift"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{c.niche}</h3>
              </div>

              {/* Mini conversation */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">"{c.question}"</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-[8px] text-primary font-semibold">N</span>
                  </div>
                  <p className="text-xs text-foreground/70 font-light leading-relaxed">"{c.answer}"</p>
                </div>
              </div>

              {/* Action badge */}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" />
                <span className="text-[11px] text-primary font-medium">{c.action}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
