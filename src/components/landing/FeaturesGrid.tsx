import { useState } from 'react';
import { Mic, MessageSquare, Calendar, Users, Brain, BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: Mic,
    title: 'Глас + чат',
    desc: 'Говори и пише като истински човек — на 3 езика.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    demo: ['🎙️ „Здравейте, как мога да помогна?"', '💬 Разпознава намерение', '🌍 BG / EN / RU'],
  },
  {
    icon: Calendar,
    title: 'Автоматични резервации',
    desc: 'Записва часове директно в календара ви.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    demo: ['📅 Проверява свободни часове', '✅ Потвърждава с клиента', '📧 Изпраща напомняне'],
  },
  {
    icon: Users,
    title: 'Събира контакти',
    desc: 'Име, имейл, телефон — автоматично.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    demo: ['👤 Име: Мария Иванова', '📞 +359 88 123 456', '📧 maria@email.com'],
  },
  {
    icon: Brain,
    title: 'AI разбира като човек',
    desc: 'Естествен разговор, не скрипт.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    demo: ['🧠 Контекстно разбиране', '💡 Препоръчва услуги', '🎯 Персонализирани отговори'],
  },
  {
    icon: MessageSquare,
    title: 'Работи 24/7',
    desc: 'Не пропуска нито едно запитване.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    demo: ['🌙 3:00 AM — отговаря', '☀️ 14:00 — отговаря', '🔄 Без прекъсвания'],
  },
  {
    icon: BarChart3,
    title: 'Пълен контрол',
    desc: 'Дашборд с анализи в реално време.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    demo: ['📊 47 разговора днес', '📈 +23% конверсия', '⚡ Средно 45s отговор'],
  },
];

const FeaturesGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState(0);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`py-20 sm:py-28 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            Всичко, което <span className="text-primary">ви трябва</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            NEO заменя рецепционист, чатбот и колцентър — в един инструмент.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start max-w-5xl mx-auto">
          {/* Left: Feature list */}
          <div className="lg:col-span-2 space-y-1">
            {features.map((f, i) => (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                onClick={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  active === i
                    ? `${f.bg} ${f.border} border shadow-lg`
                    : 'border border-transparent hover:bg-card/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg ${active === i ? f.bg : 'bg-card/60'} border ${active === i ? f.border : 'border-border/10'} flex items-center justify-center shrink-0 transition-all`}>
                  <f.icon className={`w-4 h-4 ${active === i ? f.color : 'text-foreground/40'} transition-colors`} strokeWidth={1.5} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${active === i ? 'text-foreground' : 'text-foreground/60'} transition-colors`}>{f.title}</p>
                  <p className={`text-[11px] ${active === i ? 'text-foreground/50' : 'text-foreground/30'} transition-colors leading-snug`}>{f.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: Interactive preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="relative rounded-2xl border border-border/15 bg-card/30 backdrop-blur-xl overflow-hidden min-h-[280px]">
              {/* Header bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/10 bg-card/40">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/30" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`text-[10px] font-semibold ml-2 ${features[active].color}`}
                  >
                    {features[active].title}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl ${features[active].bg} border ${features[active].border} flex items-center justify-center`}>
                        {(() => { const Icon = features[active].icon; return <Icon className={`w-6 h-6 ${features[active].color}`} strokeWidth={1.5} />; })()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{features[active].title}</h3>
                        <p className="text-xs text-foreground/40">{features[active].desc}</p>
                      </div>
                    </div>

                    {/* Demo steps */}
                    <div className="space-y-2.5">
                      {features[active].demo.map((step, j) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.12, duration: 0.3 }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-card/50 border border-border/10"
                        >
                          <span className="text-sm">{step}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Animated indicator */}
                    <div className="flex items-center gap-2 pt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${features[active].color.replace('text-', 'bg-')} animate-pulse`} />
                      <span className="text-[10px] text-foreground/30 font-medium">Активно в реално време</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
