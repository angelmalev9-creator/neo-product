import { Calendar, Database, Mic, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const cards = [
  {
    icon: Calendar,
    title: 'Записване',
    description: 'Календар, часове, автоматична логика за резервации.',
  },
  {
    icon: Database,
    title: 'Данни',
    description: 'Какво събира от клиента — имена, телефони, имейли.',
  },
  {
    icon: Mic,
    title: 'Глас',
    description: 'Избираш как звучи NEO — тон, скорост, стил.',
  },
  {
    icon: Palette,
    title: 'Widget',
    description: 'Дизайн, позиция и брандиране на уиджета.',
  },
];

const SettingsCards = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-28 sm:py-36 lg:py-40 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium mb-6">
              Настройки
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground tracking-[-0.5px] leading-[1.1] mb-4 max-w-xl mx-auto">
              Контролирате всичко от{' '}
              <span className="neo-gradient-text">едно място</span>
            </h2>
            <p className="text-sm sm:text-base text-foreground/40 max-w-md mx-auto leading-[1.6]">
              Всяка настройка е достъпна с няколко клика — без код, без сложности.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="neo-glass-subtle rounded-[20px] p-7 sm:p-8 border border-border/10 hover:border-border/25 group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_hsl(var(--neo-red)/0.08)]"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center text-primary mb-5 group-hover:bg-primary/12 transition-colors">
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-[-0.3px]">{card.title}</h3>
                <p className="text-sm text-foreground/40 leading-[1.6] max-w-[320px]">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsCards;
