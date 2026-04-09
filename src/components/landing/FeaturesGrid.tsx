import { useState } from 'react';
import { Mic, MessageSquare, Calendar, Users, Brain, BarChart3, Globe, Clock, Zap, CheckCircle, Phone, Shield, Palette } from 'lucide-react';
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
    demo: [
      { icon: Mic, text: 'Естествен глас — не робот' },
      { icon: Brain, text: 'Разпознава намерение от контекста' },
      { icon: Globe, text: 'BG / EN / RU — автоматично' },
    ],
    liveLabel: 'Активно в реално време',
  },
  {
    icon: Phone,
    title: 'Телефонен рецепционист',
    desc: 'NEO отговаря на обажданията на вашия бизнес номер.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    demo: [
      { icon: Phone, text: 'Български номер (+359)' },
      { icon: Mic, text: 'Естествен глас на български' },
      { icon: Calendar, text: 'Записва часове по телефона' },
    ],
    liveLabel: 'Нова функция',
  },
  {
    icon: Calendar,
    title: 'Автоматични резервации',
    desc: 'Записва часове директно в календара ви.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    demo: [
      { icon: Calendar, text: 'Проверява свободни часове' },
      { icon: CheckCircle, text: 'Потвърждава автоматично с клиента' },
      { icon: MessageSquare, text: 'Изпраща напомняне преди срещата' },
    ],
    liveLabel: 'Свързан с Google Calendar',
  },
  {
    icon: Users,
    title: 'Събира контакти',
    desc: 'Име, имейл, телефон — автоматично.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    demo: [
      { icon: Users, text: 'Извлича данни от разговора' },
      { icon: Zap, text: 'Записва в CRM без ръчна работа' },
      { icon: CheckCircle, text: 'Верифицира имейл и телефон' },
    ],
    liveLabel: 'Автоматично събиране',
  },
  {
    icon: Palette,
    title: 'Пълна персонализация',
    desc: 'Цвят, лого, стил — всичко е ваше.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    demo: [
      { icon: Palette, text: 'Избирате цветове и шрифтове' },
      { icon: Brain, text: 'Настройвате тон и поведение' },
      { icon: Users, text: 'Добавяте лого и бранд' },
    ],
    liveLabel: 'Пълен контрол',
  },
  {
    icon: BarChart3,
    title: 'Анализи в реално време',
    desc: 'Дашборд с детайлна статистика.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    demo: [
      { icon: BarChart3, text: '47 разговора днес — детайлна статистика' },
      { icon: Zap, text: '+23% конверсия тази седмица' },
      { icon: Clock, text: 'Средно 45 сек. до първи отговор' },
    ],
    liveLabel: 'Данни в реално време',
  },
  {
    icon: Shield,
    title: 'GDPR и сигурност',
    desc: 'GDPR-съвместим. Данните ви са криптирани и защитени. Никога не споделяме информация с трети страни.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    demo: [
      { icon: Shield, text: 'Криптиране от край до край' },
      { icon: CheckCircle, text: 'GDPR пълно съответствие' },
      { icon: Globe, text: 'Данни само в ЕС сървъри' },
    ],
    liveLabel: 'Винаги защитен',
  },
];

const FeaturesGrid = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [active, setActive] = useState(0);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className={`neo-section-spacing relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="neo-heading-section font-black text-foreground mb-4 font-mono">
            Всичко, което <span className="text-primary">Ви трябва</span>
          </h2>
          <p className="neo-subheading text-muted-foreground max-w-lg mx-auto">
            NEO заменя рецепционист, чатбот и колцентър — в един инструмент.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start max-w-5xl mx-auto">
          {/* Left: Feature list */}
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-1">
            {features.map((f, i) => (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  active === i
                    ? `${f.bg} ${f.border} border shadow-lg`
                    : 'border border-transparent hover:bg-card/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${active === i ? f.bg : 'bg-card/60'} border ${active === i ? f.border : 'border-border/10'} flex items-center justify-center shrink-0 transition-all`}>
                  <f.icon className={`w-3.5 h-3.5 ${active === i ? f.color : 'text-foreground/40'} transition-colors`} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${active === i ? 'text-foreground' : 'text-foreground/60'} transition-colors`}>{f.title}</p>
                  <p className={`text-[10px] ${active === i ? 'text-foreground/50' : 'text-foreground/30'} transition-colors leading-snug truncate`}>{f.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: Interactive preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="relative rounded-2xl border border-border/15 bg-card/30 overflow-hidden min-h-[260px]">
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/10 bg-card/40">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/30" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                  <span className="w-2 h-2 rounded-full bg-foreground/10" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`text-[10px] font-semibold ml-2 ${features[active].color}`}
                  >
                    {features[active].title}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl ${features[active].bg} border ${features[active].border} flex items-center justify-center`}>
                        {(() => { const Icon = features[active].icon; return <Icon className={`w-5 h-5 ${features[active].color}`} strokeWidth={1.5} />; })()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{features[active].title}</h3>
                        <p className="text-[10px] text-foreground/40">{features[active].desc}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {features[active].demo.map((step, j) => (
                        <motion.div
                          key={step.text}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.1, duration: 0.25 }}
                          className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-card/50 border border-border/10"
                        >
                          <step.icon className={`w-3.5 h-3.5 ${features[active].color} shrink-0`} strokeWidth={1.5} />
                          <span className="text-xs text-foreground/70">{step.text}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${features[active].color.replace('text-', 'bg-')} animate-pulse`} />
                      <span className="text-[10px] text-foreground/30 font-medium">{features[active].liveLabel}</span>
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
