import { PhoneCall, UserPlus, DollarSign, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const BusinessResults = () => {
  const { ref, isVisible } = useScrollAnimation();

  const outcomes = [
    {
      icon: PhoneCall, metric: '24/7', label: 'Винаги на линия',
      description: 'Отговаря за 2 секунди — дори в 3 сутринта.',
      color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
    },
    {
      icon: UserPlus, metric: '+68%', label: 'Повече контакти',
      description: 'Събира име, телефон и имейл от всеки разговор.',
      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    },
    {
      icon: DollarSign, metric: '€15', label: 'Месечна цена',
      description: 'Вместо €1,000+ за рецепционист на заплата.',
      color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
    },
    {
      icon: TrendingUp, metric: '+35%', label: 'Ръст в продажби',
      description: 'Квалифицира и насочва клиенти към покупка.',
      color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="results"
      className="neo-section-spacing relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-secondary text-accent text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Резултати
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mb-4 font-mono text-primary-foreground lg:text-5xl">
            Какво постигат <span className="text-secondary">клиентите ни</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            Реални числа от бизнеси, които използват NEO.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto mb-10">
          {outcomes.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group relative neo-glass-premium p-5 sm:p-6 rounded-2xl text-center hover:scale-[1.03] transition-transform duration-300 border border-secondary"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className={`text-3xl sm:text-4xl font-black ${item.color} mb-1 tracking-tight`}>{item.metric}</p>
              <h3 className="text-sm font-bold text-foreground mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="neo-btn-primary text-sm px-8 py-5 rounded-full gap-2 font-bold w-full sm:w-auto"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Пробвайте безплатно <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Без регистрация · Без кредитна карта · Готово за 30 секунди
          </p>
        </div>
      </div>
    </section>
  );
};

export default BusinessResults;
