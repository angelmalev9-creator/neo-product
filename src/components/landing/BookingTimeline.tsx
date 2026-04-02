import { MessageSquare, Bot, ClipboardList, CalendarClock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const timelineSteps = [
  { icon: MessageSquare, label: 'Клиент пита', color: 'text-foreground/60' },
  { icon: Bot, label: 'NEO отговаря', color: 'text-primary' },
  { icon: ClipboardList, label: 'Събира данни', color: 'text-violet-400' },
  { icon: CalendarClock, label: 'Предлага час', color: 'text-amber-400' },
  { icon: CheckCircle2, label: 'Записва', color: 'text-emerald-400' },
];

const BookingTimeline = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-28 sm:py-36 lg:py-40 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-6">
              Процес
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground tracking-[-0.5px] leading-[1.1] mb-4">
              От въпрос до{' '}
              <span className="neo-gradient-text">записан час</span>
            </h2>
            <p className="text-sm sm:text-base text-foreground/40 max-w-md mx-auto leading-[1.6]">
              Целият процес е автоматичен — без намеса от ваша страна.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-border/15 -translate-y-1/2 hidden sm:block" />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-4">
              {timelineSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl neo-glass-premium border border-border/10 flex items-center justify-center mb-4 relative z-10 hover:scale-105 transition-transform duration-300">
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground/70">{step.label}</p>
                  {i < timelineSteps.length - 1 && (
                    <div className="sm:hidden w-px h-6 bg-border/15 mt-3" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingTimeline;
