import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { PhoneOff, DollarSign, Clock } from 'lucide-react';

const stats = [
  {
    icon: PhoneOff,
    number: '62%',
    text: 'от клиентите, които не се свържат от първия път, звънят на конкурент.',
    color: 'text-accent',
    bg: 'bg-muted',
    border: 'border-primary/20',
  },
  {
    icon: DollarSign,
    number: '€3,300',
    text: 'средна месечна загуба от пропуснати обаждания в малък бизнес.',
    color: 'text-accent',
    bg: 'bg-secondary',
    border: 'border-secondary',
  },
  {
    icon: Clock,
    number: '8 от 10',
    text: 'собственици на бизнес изпускат обаждания извън работно време.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="problem"
      className="neo-section-spacing"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-3 font-mono">
            Всяко пропуснато обаждане е{' '}
            <span className="text-accent">изгубен клиент.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Проучване на NEO сред 200 малки бизнеса в България показа:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative rounded-2xl border bg-card/30 p-6 text-center border-secondary"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className={`text-4xl sm:text-5xl font-black ${stat.color} mb-3 tracking-tight`}>
                {stat.number}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {stat.text}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/70 mt-6">
          * Средна оценка на база анонимни данни от потребители на NEO.
        </p>
      </div>
    </section>
  );
};

export default ProblemSection;
